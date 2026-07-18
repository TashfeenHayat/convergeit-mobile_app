import {
  defaultWidgetDraft,
  mergePartialWidgetDraft,
  resolveLauncherPreviewFromDraft,
  type WidgetDraft,
} from "./widgetDraft";
import { writeWizardSaveTraceToSession } from "./widget-wizard-save-trace";

const CREATE_WIZARD_DRAFT_SESSION_KEY = "converge.widgetWizard.createDraft.v1";
const MAX_PERSISTED_DATA_URL_LEN = 200_000;

let createFlowDraft: WidgetDraft = mergePartialWidgetDraft(defaultWidgetDraft);
let createFlowHydratedFromSession = false;

const editFlowDrafts = new Map<string, WidgetDraft>();

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function stripHeavyDraftMedia(draft: WidgetDraft): WidgetDraft {
  const trimDataUrl = (value: string | undefined) => {
    const v = value?.trim() ?? "";
    if (!v.startsWith("data:")) return v;
    return v.length <= MAX_PERSISTED_DATA_URL_LEN ? v : "";
  };
  return {
    ...draft,
    iconDataUrl: trimDataUrl(draft.iconDataUrl),
    bannerDataUrl: trimDataUrl(draft.bannerDataUrl),
    proactiveTeaserAvatarDataUrl: trimDataUrl(draft.proactiveTeaserAvatarDataUrl),
  };
}

function persistCreateFlowDraftToSession(draft: WidgetDraft): void {
  if (!canUseSessionStorage()) return;
  try {
    sessionStorage.setItem(
      CREATE_WIZARD_DRAFT_SESSION_KEY,
      JSON.stringify(stripHeavyDraftMedia(draft)),
    );
  } catch {
    try {
      sessionStorage.setItem(
        CREATE_WIZARD_DRAFT_SESSION_KEY,
        JSON.stringify(
          stripHeavyDraftMedia({
            ...draft,
            iconDataUrl: "",
            bannerDataUrl: "",
            proactiveTeaserAvatarDataUrl: "",
          }),
        ),
      );
    } catch {
      /* ignore quota */
    }
  }
}

function hydrateCreateFlowFromSessionOnce(): void {
  if (createFlowHydratedFromSession || !canUseSessionStorage()) return;
  createFlowHydratedFromSession = true;
  try {
    const raw = sessionStorage.getItem(CREATE_WIZARD_DRAFT_SESSION_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<WidgetDraft>;
    createFlowDraft = mergePartialWidgetDraft(parsed);
  } catch {
    /* ignore corrupt session payload */
  }
}

export function resetCreateWizardDraft(): void {
  createFlowDraft = mergePartialWidgetDraft(defaultWidgetDraft);
  createFlowHydratedFromSession = true;
  if (canUseSessionStorage()) {
    try {
      sessionStorage.removeItem(CREATE_WIZARD_DRAFT_SESSION_KEY);
    } catch {
      /* ignore */
    }
  }
  writeWizardSaveTraceToSession([]);
}

export function readCreateWizardDraft(): WidgetDraft {
  hydrateCreateFlowFromSessionOnce();
  return createFlowDraft;
}

export function patchCreateWizardDraft(update: Partial<WidgetDraft>): WidgetDraft {
  hydrateCreateFlowFromSessionOnce();
  createFlowDraft = mergePartialWidgetDraft({
    ...createFlowDraft,
    ...update,
  });
  persistCreateFlowDraftToSession(createFlowDraft);
  const rk = createFlowDraft.remoteWidgetKey?.trim();
  if (rk) {
    mirrorCreateFlowDraftToEditCache(rk);
  }
  return createFlowDraft;
}

/** Prefer create-flow widget kind when API hydrate lacks or downgrades widgetType. */
function preferCreateWizardType(create: WidgetDraft, merged: WidgetDraft): WidgetDraft {
  const createKey = create.remoteWidgetKey?.trim() ?? "";
  const mergedKey = merged.remoteWidgetKey?.trim() ?? "";
  if (!createKey || createKey !== mergedKey) return merged;
  const kind = create.type ?? merged.type ?? "chat";
  if (kind === merged.type) return merged;
  return { ...merged, type: kind };
}

/** Keep edit-route draft in sync when create flow already saved step 1 (before `?edit=` on step 2). */
function mirrorCreateFlowDraftToEditCache(widgetKey: string): void {
  const k = widgetKey.trim();
  if (!k) return;
  editFlowDrafts.set(
    k,
    mergePartialWidgetDraft({
      ...createFlowDraft,
      type: createFlowDraft.type ?? "chat",
      remoteWidgetKey: k,
      widgetId: createFlowDraft.widgetId?.trim() || k,
    }),
  );
}

export function readEditWizardDraft(widgetKey: string): WidgetDraft {
  const k = widgetKey.trim();
  if (!k) return mergePartialWidgetDraft(defaultWidgetDraft);
  const cached = editFlowDrafts.get(k);
  if (cached) return cached;
  const create = readCreateWizardDraft();
  const seeded = mergePartialWidgetDraft({
    ...(create.remoteWidgetKey?.trim() === k ? create : {}),
    type: create.remoteWidgetKey?.trim() === k ? (create.type ?? "chat") : "chat",
    remoteWidgetKey: k,
    widgetId: k,
  });
  editFlowDrafts.set(k, seeded);
  return seeded;
}

/** Replace edit draft from GET /widgets/:widgetKey (source of truth for edit flow). */
function mergeCreateLauncherWhenApiHasThemeDefaults(
  fromApi: WidgetDraft,
  create: WidgetDraft,
): WidgetDraft {
  if (create.remoteWidgetKey?.trim() !== fromApi.remoteWidgetKey?.trim()) {
    return fromApi;
  }
  const apiLauncher = resolveLauncherPreviewFromDraft(fromApi);
  const createLauncher = resolveLauncherPreviewFromDraft(create);
  const apiLauncherIsFullyDefault =
    apiLauncher.buttonShape === defaultWidgetDraft.buttonShape &&
    apiLauncher.buttonPosition === defaultWidgetDraft.buttonPosition &&
    apiLauncher.buttonColor === defaultWidgetDraft.buttonColor &&
    apiLauncher.buttonHoverColor === defaultWidgetDraft.buttonHoverColor &&
    !fromApi.iconDataUrl?.trim();
  const createHasCustomLauncher =
    createLauncher.buttonShape !== defaultWidgetDraft.buttonShape ||
    createLauncher.buttonPosition !== defaultWidgetDraft.buttonPosition ||
    Boolean(create.iconDataUrl?.trim()) ||
    createLauncher.buttonColor !== defaultWidgetDraft.buttonColor ||
    createLauncher.buttonHoverColor !== defaultWidgetDraft.buttonHoverColor;

  if (!apiLauncherIsFullyDefault || !createHasCustomLauncher) {
    return preferCreateWizardType(
      create,
      mergePartialWidgetDraft({ ...create, ...fromApi }),
    );
  }

  return preferCreateWizardType(
    create,
    mergePartialWidgetDraft({
      ...fromApi,
      ...createLauncher,
      iconDataUrl: create.iconDataUrl || fromApi.iconDataUrl,
      proactiveTeaserEnabled: create.proactiveTeaserEnabled,
      proactiveTeaser: create.proactiveTeaser,
      proactiveTeaserAvatarEnabled: create.proactiveTeaserAvatarEnabled,
      proactiveTeaserAvatarDataUrl: create.proactiveTeaserAvatarDataUrl,
      proactiveSecondaryCtaEnabled: create.proactiveSecondaryCtaEnabled,
      proactiveSecondaryCtaLabel: create.proactiveSecondaryCtaLabel,
      proactiveSecondaryCtaHref: create.proactiveSecondaryCtaHref,
      proactiveSecondaryCtaKind: create.proactiveSecondaryCtaKind,
      themeDesignJsonAccent: create.themeDesignJsonAccent ?? fromApi.themeDesignJsonAccent,
      themeDesignJsonDensity: create.themeDesignJsonDensity ?? fromApi.themeDesignJsonDensity,
    }),
  );
}

export function replaceEditWizardDraftFromApi(
  widgetKey: string,
  mapped: Partial<WidgetDraft>,
): WidgetDraft {
  const k = widgetKey.trim();
  const create = readCreateWizardDraft();
  const fromApi = mergePartialWidgetDraft({
    ...mapped,
    type: mapped.type ?? create.type ?? "chat",
    remoteWidgetKey: k,
    widgetId: mapped.widgetId?.trim() || k,
  });
  const next = preferCreateWizardType(
    create,
    mergeCreateLauncherWhenApiHasThemeDefaults(fromApi, create),
  );
  editFlowDrafts.set(k, next);
  return next;
}

export function patchEditWizardDraft(
  widgetKey: string,
  update: Partial<WidgetDraft>,
): WidgetDraft {
  const k = widgetKey.trim();
  const current = readEditWizardDraft(k);
  const next = mergePartialWidgetDraft({
    ...current,
    ...update,
    type: update.type ?? current.type ?? "chat",
    remoteWidgetKey: k,
    widgetId: update.widgetId?.trim() || current.widgetId || k,
  });
  editFlowDrafts.set(k, next);
  return next;
}

export function clearEditWizardDraft(widgetKey: string): void {
  const k = widgetKey.trim();
  if (k) editFlowDrafts.delete(k);
}
