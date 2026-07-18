import { uploadWidgetAsset } from "@/api/widgets/widgets.api";
import type { JsonRecord } from "@/api/types/common.types";
import type { WidgetInstallationAssetUrls } from "./build-widget-install-body";
import type { WidgetDraft } from "./widgetDraft";

export type WidgetAssetUploadResult = {
  urls: WidgetInstallationAssetUrls;
  errors: string[];
};

function readPublicUrl(payload: JsonRecord): string | undefined {
  if (typeof payload.publicUrl === "string" && payload.publicUrl) {
    return payload.publicUrl;
  }
  const nested = payload.data;
  if (
    typeof nested === "object" &&
    nested !== null &&
    typeof (nested as JsonRecord).publicUrl === "string"
  ) {
    return (nested as JsonRecord).publicUrl as string;
  }
  return undefined;
}

function extensionForMime(mime: string, fallback: string): string {
  const m = mime.toLowerCase();
  if (m.includes("svg")) return ".svg";
  if (m.includes("webp")) return ".webp";
  if (m.includes("gif")) return ".gif";
  if (m.includes("png")) return ".png";
  if (m.includes("jpeg") || m.includes("jpg")) return ".jpg";
  if (m.includes("mp4")) return ".mp4";
  if (m.includes("webm")) return ".webm";
  if (m.includes("quicktime")) return ".mov";
  return fallback;
}

async function dataUrlToFile(
  dataUrl: string,
  baseName: string,
  fallbackExt: string,
): Promise<File | null> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const type = blob.type || "application/octet-stream";
    const ext = extensionForMime(type, fallbackExt);
    return new File([blob], `${baseName}${ext}`, { type });
  } catch {
    return null;
  }
}

const MAX_INLINE_BYTES = 48 * 1024 * 1024;

async function uploadAssetFile(params: {
  websiteId: string;
  assetType:
    | "button_icon"
    | "teaser_avatar"
    | "banner_image"
    | "banner_video"
    | "header_logo"
    | "agent_avatar"
    | "visitor_avatar";
  file: File;
  label: string;
  errors: string[];
}): Promise<string | undefined> {
  try {
    const raw = await uploadWidgetAsset({
      websiteId: params.websiteId,
      assetType: params.assetType,
      file: params.file,
    });
    const url = readPublicUrl(raw);
    if (!url) {
      params.errors.push(`${params.label}: server did not return a public URL.`);
    }
    return url;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    params.errors.push(`${params.label}: ${msg}`);
    return undefined;
  }
}

/**
 * Upload launcher icon, teaser avatar, and banner from data URLs in the wizard draft.
 */
export async function uploadDraftWidgetAssets(params: {
  websiteId: string;
  draft: WidgetDraft;
}): Promise<WidgetAssetUploadResult> {
  const { websiteId, draft } = params;
  const urls: WidgetInstallationAssetUrls = {};
  const errors: string[] = [];

  const iconUrl = draft.iconDataUrl?.trim();
  if (iconUrl?.startsWith("data:") && iconUrl.length < MAX_INLINE_BYTES) {
    const file = await dataUrlToFile(iconUrl, "widget-button-icon", ".png");
    if (file) {
      const publicUrl = await uploadAssetFile({
        websiteId,
        assetType: "button_icon",
        file,
        label: "Launcher icon",
        errors,
      });
      if (publicUrl) urls.buttonIconPublicUrl = publicUrl;
    } else {
      errors.push("Launcher icon: could not read uploaded file.");
    }
  }

  const avatarUrl = draft.proactiveTeaserAvatarDataUrl?.trim();
  if (avatarUrl?.startsWith("data:") && avatarUrl.length < MAX_INLINE_BYTES) {
    const file = await dataUrlToFile(avatarUrl, "widget-teaser-avatar", ".png");
    if (file) {
      const publicUrl = await uploadAssetFile({
        websiteId,
        assetType: "teaser_avatar",
        file,
        label: "Teaser avatar",
        errors,
      });
      if (publicUrl) urls.teaserAvatarPublicUrl = publicUrl;
    } else {
      errors.push("Teaser avatar: could not read uploaded file.");
    }
  }

  const bannerUrl = draft.bannerDataUrl?.trim();
  if (bannerUrl?.startsWith("data:") && bannerUrl.length < MAX_INLINE_BYTES) {
    const isVideo = draft.bannerMediaType === "video";
    const file = await dataUrlToFile(
      bannerUrl,
      "widget-banner",
      isVideo ? ".mp4" : ".jpg",
    );
    if (file) {
      const publicUrl = await uploadAssetFile({
        websiteId,
        assetType: isVideo ? "banner_video" : "banner_image",
        file,
        label: isVideo ? "Banner video" : "Banner image",
        errors,
      });
      if (publicUrl) {
        if (isVideo) urls.bannerVideoPublicUrl = publicUrl;
        else urls.bannerImagePublicUrl = publicUrl;
      }
    } else {
      errors.push("Banner: could not read uploaded file.");
    }
  }

  const headerLogoUrl = draft.headerLogoDataUrl?.trim();
  if (headerLogoUrl?.startsWith("data:") && headerLogoUrl.length < MAX_INLINE_BYTES) {
    const file = await dataUrlToFile(headerLogoUrl, "widget-header-logo", ".png");
    if (file) {
      const publicUrl = await uploadAssetFile({
        websiteId,
        assetType: "header_logo",
        file,
        label: "Header logo",
        errors,
      });
      if (publicUrl) urls.headerLogoPublicUrl = publicUrl;
    } else {
      errors.push("Header logo: could not read uploaded file.");
    }
  }

  const textUsLogoUrl = draft.textUsHeaderLogoDataUrl?.trim();
  if (textUsLogoUrl?.startsWith("data:") && textUsLogoUrl.length < MAX_INLINE_BYTES) {
    const file = await dataUrlToFile(textUsLogoUrl, "text-us-header-logo", ".png");
    if (file) {
      const publicUrl = await uploadAssetFile({
        websiteId,
        assetType: "header_logo",
        file,
        label: "Text Us header logo",
        errors,
      });
      if (publicUrl) urls.textUsHeaderLogoPublicUrl = publicUrl;
    } else {
      errors.push("Text Us header logo: could not read uploaded file.");
    }
  }

  const agentAvatarUrl = draft.agentAvatarDataUrl?.trim();
  if (agentAvatarUrl?.startsWith("data:") && agentAvatarUrl.length < MAX_INLINE_BYTES) {
    const file = await dataUrlToFile(agentAvatarUrl, "widget-agent-avatar", ".png");
    if (file) {
      const publicUrl = await uploadAssetFile({
        websiteId,
        assetType: "agent_avatar",
        file,
        label: "Agent avatar",
        errors,
      });
      if (publicUrl) urls.agentAvatarPublicUrl = publicUrl;
    } else {
      errors.push("Agent avatar: could not read uploaded file.");
    }
  }

  const visitorAvatarUrl = draft.visitorAvatarDataUrl?.trim();
  if (visitorAvatarUrl?.startsWith("data:") && visitorAvatarUrl.length < MAX_INLINE_BYTES) {
    const file = await dataUrlToFile(visitorAvatarUrl, "widget-visitor-avatar", ".png");
    if (file) {
      const publicUrl = await uploadAssetFile({
        websiteId,
        assetType: "visitor_avatar",
        file,
        label: "Visitor avatar",
        errors,
      });
      if (publicUrl) urls.visitorAvatarPublicUrl = publicUrl;
    } else {
      errors.push("Visitor avatar: could not read uploaded file.");
    }
  }

  return { urls, errors };
}
