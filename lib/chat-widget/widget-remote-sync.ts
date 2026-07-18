import { isAxiosError } from "axios";
import {
  createWidgetInstallation,
  getAdminWidget,
  patchWidgetConfiguration,
} from "@/api/widgets/widgets.api";
import type { JsonRecord } from "@/api/types/common.types";
import {
  buildMinimalWidgetInstallationBody,
  buildWidgetPatchConfigurationBody,
  type ChatWidgetWizardPatchScope,
  type WidgetInstallationAssetUrls,
} from "./build-widget-install-body";
import {
  wizardCreatePath,
  wizardPatchPath,
} from "./widget-wizard-save-trace";
import {
  pickInstallWidgetKeys,
  pickRequiresPublishBeforeEmbed,
  pickWidgetRemoteStatus,
  unwrapWidgetInstallEnvelope,
} from "./widget-install-response";
import { resolveWidgetDraftAssetUrls } from "./resolve-widget-draft-asset-urls";
import { mergeWizardDraftForPublish } from "./merge-wizard-draft-for-publish";
import type { WidgetDraft, WidgetKind } from "./widgetDraft";

export type WizardWidgetKind = "chat" | "text" | "both";

export function wizardKindToApiType(kind: WizardWidgetKind) {
  if (kind === "text") return "TEXT_US" as const;
  if (kind === "both") return "BOTH" as const;
  return "CHAT" as const;
}

export function apiWidgetTypeToDraftKind(widgetType: unknown): WidgetKind {
  const wt = String(widgetType ?? "").toUpperCase();
  if (wt === "TEXT_US") return "text";
  if (wt === "BOTH") return "both";
  return "chat";
}

export function resolveWizardKindFromDraft(draft: WidgetDraft): WizardWidgetKind {
  return draft.type ?? "chat";
}

/**
 * Confirms `remoteWidgetKey` still exists on the server (avoids skipping `POST /widgets/installations`
 * when localStorage holds a stale key after DB reset or env change).
 */
export async function isServerWidgetDraftAlive(widgetKey: string | undefined | null): Promise<boolean> {
  const k = widgetKey?.trim();
  if (!k) return false;
  try {
    const res = await getAdminWidget(k);
    return res.success === true;
  } catch (e) {
    if (isAxiosError(e) && e.response?.status === 404) return false;
    throw e;
  }
}

export async function createRemoteWidgetDraft(params: {
  draft: WidgetDraft;
  widgetKind: WizardWidgetKind;
}): Promise<{
  widgetKey: string;
  requiresPublishBeforeEmbed: boolean;
  inner: JsonRecord;
}> {
  const created = await createRemoteWidgetDraftWithMeta(params);
  return {
    widgetKey: created.widgetKey,
    requiresPublishBeforeEmbed: created.requiresPublishBeforeEmbed,
    inner: created.inner,
  };
}

export type RemoteWidgetPatchMeta = {
  inner: JsonRecord;
  method: "PATCH";
  path: string;
  requestBody: JsonRecord;
  scope?: ChatWidgetWizardPatchScope | "full";
  publishNow: boolean;
  assetUrls?: WidgetInstallationAssetUrls;
  assetErrors?: string[];
};

export async function patchRemoteWidgetConfiguration(params: {
  widgetKey: string;
  widgetKind: WizardWidgetKind;
  draft: WidgetDraft;
  publishNow?: boolean;
  assetUrls?: WidgetInstallationAssetUrls;
  embedAllowAnyOrigin?: boolean;
  /** CHAT add-widget flow: limit PATCH to fields from the current step. */
  chatWizardPatchScope?: ChatWidgetWizardPatchScope;
}): Promise<JsonRecord> {
  const meta = await patchRemoteWidgetConfigurationWithMeta(params);
  return meta.inner;
}

export async function patchRemoteWidgetConfigurationWithMeta(params: {
  widgetKey: string;
  widgetKind: WizardWidgetKind;
  draft: WidgetDraft;
  publishNow?: boolean;
  assetUrls?: WidgetInstallationAssetUrls;
  embedAllowAnyOrigin?: boolean;
  chatWizardPatchScope?: ChatWidgetWizardPatchScope;
}): Promise<RemoteWidgetPatchMeta> {
  const widgetType = wizardKindToApiType(params.widgetKind);
  const publishNow = params.publishNow ?? false;
  const scope = params.chatWizardPatchScope;

  let draft = params.draft;
  if (
    (params.widgetKind === "chat" || params.widgetKind === "both") &&
    (!scope || publishNow)
  ) {
    draft = mergeWizardDraftForPublish(draft);
  }

  let assetUrls = params.assetUrls;
  let assetErrors: string[] = [];
  const websiteId = draft.websiteId?.trim();
  if (websiteId) {
    const resolved = await resolveWidgetDraftAssetUrls({
      websiteId,
      draft,
      overrides: params.assetUrls,
    });
    assetUrls = resolved.urls;
    assetErrors = resolved.errors;
    if (resolved.errors.length > 0) {
      console.warn("[widget] asset upload warnings:", resolved.errors.join("; "));
    }
  }

  const requestBody = buildWidgetPatchConfigurationBody({
    draft,
    widgetType,
    publishNow,
    assetUrls,
    embedAllowAnyOrigin: params.embedAllowAnyOrigin,
    chatWizardPatchScope: scope,
  });

  const res = await patchWidgetConfiguration(params.widgetKey, requestBody);
  return {
    inner: unwrapWidgetInstallEnvelope(res),
    method: "PATCH",
    path: wizardPatchPath(params.widgetKey),
    requestBody,
    scope: scope ?? "full",
    publishNow,
    assetUrls,
    assetErrors,
  };
}

export type RemoteWidgetCreateMeta = {
  inner: JsonRecord;
  method: "POST";
  path: string;
  requestBody: JsonRecord;
  publishNow: boolean;
};

export async function createRemoteWidgetDraftWithMeta(params: {
  draft: WidgetDraft;
  widgetKind: WizardWidgetKind;
}): Promise<{
  widgetKey: string;
  requiresPublishBeforeEmbed: boolean;
  inner: JsonRecord;
  meta: RemoteWidgetCreateMeta;
}> {
  const websiteId = params.draft.websiteId?.trim();
  if (!websiteId)
    throw new Error("Website is required before saving a backend draft.");

  const widgetType = wizardKindToApiType(params.widgetKind);
  const publishNow = false;
  const requestBody = buildMinimalWidgetInstallationBody({
    websiteId,
    widgetType,
    publishNow,
  });

  const res = await createWidgetInstallation(requestBody);
  const inner = unwrapWidgetInstallEnvelope(res);
  const keys = pickInstallWidgetKeys(inner);
  const requiresPublishBeforeEmbed = pickRequiresPublishBeforeEmbed(inner);

  if (!keys.widgetKey) {
    throw new Error(
      "Server did not return widgetKey while saving draft (publishNow: false).",
    );
  }

  return {
    widgetKey: keys.widgetKey,
    requiresPublishBeforeEmbed,
    inner,
    meta: {
      inner,
      method: "POST",
      path: wizardCreatePath(),
      requestBody,
      publishNow,
    },
  };
}

export function summarizePatchResult(inner: JsonRecord) {
  return {
    widgetKey: pickInstallWidgetKeys(inner).widgetKey,
    requiresPublishBeforeEmbed: pickRequiresPublishBeforeEmbed(inner),
    status: pickWidgetRemoteStatus(inner),
  };
}
