import type { JsonRecord } from "@/api/types/common.types";
import type { ChatWidgetWizardPatchScope } from "./build-widget-install-body";
import {
  normalizeButtonPosition,
  normalizeButtonShape,
  normalizeLauncherIconPreset,
  resolveLauncherPreviewFromDraft,
  type WidgetDraft,
} from "./widgetDraft";

export type WidgetWizardSaveEntry = {
  stepKey: string;
  stepLabel: string;
  savedAt: string;
  method: "POST" | "PATCH";
  path: string;
  scope?: ChatWidgetWizardPatchScope | "full" | "create";
  publishNow: boolean;
  requestBody: JsonRecord;
  responseBody: JsonRecord;
};

export const WIZARD_PATCH_SCOPE_LABELS: Record<
  ChatWidgetWizardPatchScope | "full" | "create",
  string
> = {
  create: "Create widget draft (website + type)",
  launcher_only: "Button — colors, launcher position, theme",
  chat_surface: "Chat box — header, greeting, panel, banner",
  notifications_only: "Notifications — auto-open, consent, routing",
  inquiry_only: "Inquiry topics",
  text_us_only: "Text Us — placement, branding, SMS fields",
  full: "Full config (install / publish)",
};

export function wizardPatchPath(widgetKey: string): string {
  return `/widgets/${encodeURIComponent(widgetKey.trim())}`;
}

export function wizardCreatePath(): string {
  return "/widgets/installations";
}

/** Human-readable list of top-level keys saved in this step. */
export function summarizePatchRequest(entry: WidgetWizardSaveEntry): string[] {
  const lines: string[] = [];
  lines.push(`${entry.method} ${entry.path}`);
  if (entry.scope) {
    lines.push(`Scope: ${WIZARD_PATCH_SCOPE_LABELS[entry.scope] ?? entry.scope}`);
  }
  if (entry.publishNow) lines.push("publishNow: true (goes live on this save)");

  const body = entry.requestBody;
  if (entry.method === "POST") {
    const w = body.websiteId ?? body.website_id;
    if (w) lines.push(`websiteId: ${String(w)}`);
    if (body.widgetType) lines.push(`widgetType: ${String(body.widgetType)}`);
    return lines;
  }

  const cfg = body.config;
  if (cfg && typeof cfg === "object" && !Array.isArray(cfg)) {
    const c = cfg as JsonRecord;
    const keys = Object.keys(c).filter((k) => k !== "settingsJson");
    if (keys.length) lines.push(`config sections: ${keys.join(", ")}`);
    if (c.theme && typeof c.theme === "object") lines.push("  → theme (+ designJson)");
    if (c.ui) lines.push("  → ui (labels, sizes, banner flags)");
    if (c.behavior) lines.push("  → behavior (notifications, inquiry)");
    if (c.form) lines.push("  → form (pre-chat)");
    if (c.response) lines.push("  → response (welcome / offline copy)");
    if (c.mode ?? c.chatMode) lines.push(`  → mode: ${String(c.mode ?? c.chatMode)}`);
  }

  const status = entry.responseBody.status ?? entry.responseBody.versionStatus;
  if (status) lines.push(`Server status: ${String(status)}`);

  return lines;
}

const WIZARD_SAVE_TRACE_STORAGE_KEY = "converge.widgetWizard.saveTrace.v1";

export function readWizardSaveTraceFromSession(): WidgetWizardSaveEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(WIZARD_SAVE_TRACE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as WidgetWizardSaveEntry[]) : [];
  } catch {
    return [];
  }
}

export function writeWizardSaveTraceToSession(entries: WidgetWizardSaveEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(WIZARD_SAVE_TRACE_STORAGE_KEY, JSON.stringify(entries.slice(0, 8)));
  } catch {
    /* ignore */
  }
}

export function appendWizardSaveTraceToSession(input: Omit<WidgetWizardSaveEntry, "savedAt"> & { savedAt?: string }): void {
  const entry: WidgetWizardSaveEntry = {
    ...input,
    savedAt: input.savedAt ?? new Date().toISOString(),
  };
  const prev = readWizardSaveTraceFromSession();
  const without = prev.filter((e) => e.stepKey !== entry.stepKey);
  writeWizardSaveTraceToSession([entry, ...without]);
}

/** Launcher fields from last wizard PATCH (matches Network tab / save trace JSON). */
/**
 * Launcher preview for wizard steps 2–4: Step 1 save-trace wins over draft (step 2 PATCH must not reset FAB).
 */
export function resolveWizardLauncherPreview(
  draft: Partial<WidgetDraft>,
): ReturnType<typeof resolveLauncherPreviewFromDraft> {
  const fromDraft = resolveLauncherPreviewFromDraft(draft);
  const fromButton = launcherPreviewFromSaveTrace(
    readWizardSaveTraceFromSession(),
    "button",
  );
  if (!fromButton) return fromDraft;
  return {
    ...fromDraft,
    ...fromButton,
    iconDataUrl: fromButton.iconDataUrl || fromDraft.iconDataUrl,
  };
}

export function launcherPreviewFromSaveTrace(
  entries: WidgetWizardSaveEntry[],
  stepKey = "button",
): Pick<
  WidgetDraft,
  | "buttonShape"
  | "buttonPosition"
  | "launcherInsetBottomPx"
  | "launcherInsetSidePx"
  | "buttonColor"
  | "buttonHoverColor"
  | "iconColor"
  | "iconDataUrl"
  | "launcherIconPreset"
> | null {
  const entry = entries.find((e) => e.stepKey === stepKey);
  if (!entry) return null;
  const cfg = entry.requestBody.config;
  if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) return null;
  const config = cfg as JsonRecord;
  const ui = config.ui && typeof config.ui === "object" ? (config.ui as JsonRecord) : {};
  const theme =
    config.theme && typeof config.theme === "object" ? (config.theme as JsonRecord) : {};
  const designJson =
    theme.designJson && typeof theme.designJson === "object"
      ? (theme.designJson as JsonRecord)
      : {};
  const chat =
    designJson.chat && typeof designJson.chat === "object"
      ? (designJson.chat as JsonRecord)
      : {};
  const launcher =
    chat.launcher && typeof chat.launcher === "object" ? (chat.launcher as JsonRecord) : {};
  const colors =
    chat.colors && typeof chat.colors === "object" ? (chat.colors as JsonRecord) : {};

  const shape = normalizeButtonShape(
    launcher.shape ?? ui.buttonShape ?? theme.buttonShape,
  );
  const position = normalizeButtonPosition(
    launcher.position ?? ui.buttonPosition ?? theme.position,
  );
  const insetBottom = Number(launcher.insetBottomPx ?? ui.launcherInsetBottomPx ?? 28);
  const insetSide = Number(launcher.insetSidePx ?? ui.launcherInsetSidePx ?? 28);

  return {
    buttonShape: shape,
    buttonPosition: position,
    launcherInsetBottomPx: Number.isFinite(insetBottom) ? insetBottom : 28,
    launcherInsetSidePx: Number.isFinite(insetSide) ? insetSide : 28,
    buttonColor:
      String(colors.button ?? theme.primaryColor ?? "").trim() || "#2563eb",
    buttonHoverColor:
      String(colors.buttonHover ?? ui.buttonHoverColor ?? theme.buttonHoverColor ?? "").trim() ||
      "#1d4ed8",
    iconColor: String(colors.icon ?? theme.iconColor ?? "").trim() || "#ffffff",
    iconDataUrl: (() => {
      const preset = normalizeLauncherIconPreset(
        String(ui.launcherIconPreset ?? launcher.iconPreset ?? ""),
      );
      const url = String(ui.buttonIconUrl ?? launcher.iconUrl ?? "").trim();
      if (preset && url && !url.startsWith("data:")) return "";
      return url;
    })(),
    launcherIconPreset: normalizeLauncherIconPreset(
      String(ui.launcherIconPreset ?? launcher.iconPreset ?? ""),
    ),
  };
}

export function summarizePatchResponse(entry: WidgetWizardSaveEntry): string[] {
  const r = entry.responseBody;
  const lines: string[] = [];
  const wk = r.widgetKey ?? r.widget_key;
  if (wk) lines.push(`widgetKey: ${String(wk)}`);
  if (r.requiresPublishBeforeEmbed === true) {
    lines.push("requiresPublishBeforeEmbed: true");
  } else if (r.requiresPublishBeforeEmbed === false) {
    lines.push("Saved as draft (publish on Install step for live embed)");
  }
  if (r.published === true || r.publishNow === true) {
    lines.push("live: yes (published)");
  } else if (
    r.hasPendingDraft === true ||
    r.has_pending_draft === true ||
    r.requiresPublishBeforeEmbed === true
  ) {
    lines.push("draft saved (publish on Install step for live embed)");
  }
  return lines;
}
