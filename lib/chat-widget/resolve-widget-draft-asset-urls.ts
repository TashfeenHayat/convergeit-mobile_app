import type { WidgetInstallationAssetUrls } from "./build-widget-install-body";
import { draftUsesCustomLauncherIcon } from "./launcher-icon-draft.util";
import type { WidgetDraft } from "./widgetDraft";
import {
  uploadDraftWidgetAssets,
  type WidgetAssetUploadResult,
} from "./upload-widget-draft-assets";

function isHttpUrl(value: string | undefined): value is string {
  const v = value?.trim();
  return Boolean(v && (v.startsWith("http://") || v.startsWith("https://")));
}

/** Published or previously uploaded URLs already on the draft. */
export function resolveExistingHttpAssetUrls(
  draft: WidgetDraft,
): WidgetInstallationAssetUrls {
  const out: WidgetInstallationAssetUrls = {};
  if (isHttpUrl(draft.iconDataUrl) && draftUsesCustomLauncherIcon(draft)) {
    out.buttonIconPublicUrl = draft.iconDataUrl.trim();
  }
  if (isHttpUrl(draft.proactiveTeaserAvatarDataUrl)) {
    out.teaserAvatarPublicUrl = draft.proactiveTeaserAvatarDataUrl.trim();
  }
  if (isHttpUrl(draft.bannerDataUrl)) {
    if (draft.bannerMediaType === "video") {
      out.bannerVideoPublicUrl = draft.bannerDataUrl.trim();
    } else {
      out.bannerImagePublicUrl = draft.bannerDataUrl.trim();
    }
  }
  if (isHttpUrl(draft.headerLogoDataUrl)) {
    out.headerLogoPublicUrl = draft.headerLogoDataUrl.trim();
  }
  if (isHttpUrl(draft.agentAvatarDataUrl)) {
    out.agentAvatarPublicUrl = draft.agentAvatarDataUrl.trim();
  }
  if (isHttpUrl(draft.visitorAvatarDataUrl)) {
    out.visitorAvatarPublicUrl = draft.visitorAvatarDataUrl.trim();
  }
  if (isHttpUrl(draft.textUsHeaderLogoDataUrl)) {
    out.textUsHeaderLogoPublicUrl = draft.textUsHeaderLogoDataUrl.trim();
  }
  return out;
}

/**
 * Upload inline data URLs when needed, merge with existing http URLs and optional overrides.
 */
export async function resolveWidgetDraftAssetUrls(params: {
  websiteId: string;
  draft: WidgetDraft;
  overrides?: WidgetInstallationAssetUrls;
}): Promise<WidgetAssetUploadResult> {
  const existing = resolveExistingHttpAssetUrls(params.draft);
  const uploaded = await uploadDraftWidgetAssets({
    websiteId: params.websiteId,
    draft: params.draft,
  });
  return {
    urls: {
      ...existing,
      ...uploaded.urls,
      ...params.overrides,
    },
    errors: uploaded.errors,
  };
}

/** Replace data URLs in local draft with published http asset URLs after upload. */
export function persistAssetUrlsOnDraft(
  draft: WidgetDraft,
  urls: WidgetInstallationAssetUrls,
): Partial<WidgetDraft> {
  const out: Partial<WidgetDraft> = {};
  if (urls.buttonIconPublicUrl) {
    out.iconDataUrl = urls.buttonIconPublicUrl;
  } else if (draft.launcherIconPreset?.trim()) {
    out.iconDataUrl = "";
  }
  if (urls.teaserAvatarPublicUrl) {
    out.proactiveTeaserAvatarDataUrl = urls.teaserAvatarPublicUrl;
  }
  if (urls.bannerImagePublicUrl) {
    out.bannerDataUrl = urls.bannerImagePublicUrl;
    out.bannerMediaType = "image";
  } else if (urls.bannerVideoPublicUrl) {
    out.bannerDataUrl = urls.bannerVideoPublicUrl;
    out.bannerMediaType = "video";
  }
  if (urls.headerLogoPublicUrl) out.headerLogoDataUrl = urls.headerLogoPublicUrl;
  if (urls.agentAvatarPublicUrl) out.agentAvatarDataUrl = urls.agentAvatarPublicUrl;
  if (urls.visitorAvatarPublicUrl) out.visitorAvatarDataUrl = urls.visitorAvatarPublicUrl;
  if (urls.textUsHeaderLogoPublicUrl) {
    out.textUsHeaderLogoDataUrl = urls.textUsHeaderLogoPublicUrl;
  }
  return out;
}
