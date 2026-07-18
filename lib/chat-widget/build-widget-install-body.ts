import type { JsonRecord } from "@/api/types/common.types";
import type {
  WidgetChatModeApi,
  WidgetTypeApi,
} from "@/api/types/widgets.types";
import { buildChatColorsFromWidgetDraft } from "./widget-colors-draft";
import { CHAT_WIZARD_PATCH_DEFAULTS } from "./chat-wizard-patch-defaults";
import {
  DEFAULT_TEXT_US_FORM_FIELDS,
  resolveTextUsFormFields,
} from "./text-us-form-defaults";
import { buildTextUsDesignJsonFromDraft } from "./text-us-design-json";
import type { WidgetDraft } from "./widgetDraft";
import { applyAiTypeToWidgetConfig } from "./widget-ai-type";
import { accumulateWizardInstallConfigFromSaveTrace } from "./merge-wizard-draft-for-publish";
import { mergeWidgetConfigForEdit } from "./merge-widget-config-for-edit";
import { draftUsesCustomLauncherIcon } from "./launcher-icon-draft.util";
import { buildInquiryBehaviorPatchFields } from "@/lib/widget-runtime/widget-experience";
import {
  normalizeLauncherBadgeMode,
  normalizeWidgetSoundId,
} from "@/lib/widget-runtime/widget-notifications";
import {
  normalizeAgentAvatarPreset,
  normalizeVisitorAvatarPreset,
} from "./chat-avatar-presets";
import { normalizeLauncherStyle, normalizePanelSurfaceStyle } from "./launcher-style";

export interface WidgetInstallationAssetUrls {
  buttonIconPublicUrl?: string;
  teaserAvatarPublicUrl?: string;
  bannerImagePublicUrl?: string;
  bannerVideoPublicUrl?: string;
  headerLogoPublicUrl?: string;
  textUsHeaderLogoPublicUrl?: string;
  agentAvatarPublicUrl?: string;
  visitorAvatarPublicUrl?: string;
}

const defaultTextUsFormFields = (): JsonRecord[] =>
  DEFAULT_TEXT_US_FORM_FIELDS.map((f) => {
    const row: JsonRecord = {
      key: f.key,
      label: f.label,
      fieldType: f.fieldType,
      required: Boolean(f.required),
    };
    if (f.placeholder?.trim()) row.placeholder = f.placeholder.trim();
    return row;
  });

/** Backend UpdateWidgetConfigurationDto rejects unknown top-level `config` keys. */
function sanitizeWidgetPatchConfig(config: JsonRecord): JsonRecord {
  const out = { ...config };
  delete out.inquiry;
  return out;
}

/**
 * Whitelisted `theme.designJson.chat.chatBox` only (backend rejects headerAlign,
 * greetingMessage, bannerMediaType — those live on `config.ui` via buildChatShellUiFromDraft).
 * Banner CTA / height / logo size live on `theme.designJson.behavior`.
 */
/** `theme.designJson.chat.launcher` — synced with `config.ui` on save. */
function buildLauncherDesignJsonFromDraft(
  draft: WidgetDraft,
  assetUrls?: WidgetInstallationAssetUrls,
): JsonRecord {
  const urls = mergeDraftAssetUrls(draft, assetUrls);
  const launcher: JsonRecord = {
    shape: themeButtonShapeForPatch(draft),
    position: draft.buttonPosition,
    insetBottomPx: draft.launcherInsetBottomPx,
    insetSidePx: draft.launcherInsetSidePx,
    style: draft.launcherStyle ?? "solid",
  };
  if (draft.launcherIconEnabled === false) {
    launcher.iconEnabled = false;
    launcher.iconPreset = "";
    launcher.iconUrl = "";
  } else {
    launcher.iconEnabled = true;
    launcher.iconPreset = draft.launcherIconPreset || "phosphor-chat-dots";
    if (draftUsesCustomLauncherIcon(draft, urls)) {
      launcher.iconUrl = urls.buttonIconPublicUrl;
    } else {
      launcher.iconUrl = "";
    }
  }
  if (draft.launcherLabelEnabled === false) {
    launcher.labelEnabled = false;
  } else {
    launcher.labelEnabled = true;
  }
  return launcher;
}

function buildChatBoxPayloadFromDraft(
  draft: WidgetDraft,
  assetUrls?: WidgetInstallationAssetUrls,
): JsonRecord {
  const urls = mergeDraftAssetUrls(draft, assetUrls);
  const chatBox: JsonRecord = {
    headerTitle: draft.headerTitle?.trim() ?? "",
    sendPlaceholder: draft.sendPlaceholder,
    boxWidth: draft.boxWidth,
    boxHeight: draft.boxHeight,
    bannerEnabled: draft.bannerOn,
    bannerTitle: draft.bannerTitle?.trim() ?? "",
    bannerDescription: draft.bannerDescription?.trim() ?? "",
  };

  if (urls.bannerImagePublicUrl) chatBox.bannerImageUrl = urls.bannerImagePublicUrl;
  if (urls.bannerVideoPublicUrl) chatBox.bannerVideoUrl = urls.bannerVideoPublicUrl;
  if (urls.headerLogoPublicUrl) chatBox.headerLogoUrl = urls.headerLogoPublicUrl;

  return chatBox;
}

/** Extra chat panel fields allowed under `theme.designJson.behavior` (not `ui` / `chatBox`). */
function buildChatPanelDesignJsonBehaviorFromDraft(draft: WidgetDraft): JsonRecord {
  const patch: JsonRecord = {
    bannerHeightPx: draft.bannerHeightPx && draft.bannerHeightPx > 0 ? draft.bannerHeightPx : 0,
    bannerCtaLabel: draft.bannerCtaLabel?.trim() ?? "",
    bannerCtaHref: draft.bannerCtaHref?.trim() ?? "",
    headerLogoHeightPx: draft.headerLogoHeightPx ?? 28,
    videoWelcomeHeightPx: draft.videoWelcomeHeightPx ?? 160,
    bubbleBorderRadiusPx: draft.bubbleBorderRadiusPx ?? draft.themeBorderRadiusPx ?? 12,
  };
  return patch;
}

function resolvePanelBackground(draft: WidgetDraft): string {
  const def = CHAT_WIZARD_PATCH_DEFAULTS;
  return draft.backgroundColor?.trim() || def.backgroundColor;
}

function isHttpAssetUrl(value: string | undefined): value is string {
  const v = value?.trim();
  return Boolean(v && (v.startsWith("http://") || v.startsWith("https://")));
}

function mergeDraftAssetUrls(
  draft: WidgetDraft,
  assetUrls?: WidgetInstallationAssetUrls,
): WidgetInstallationAssetUrls {
  const merged: WidgetInstallationAssetUrls = { ...(assetUrls ?? {}) };
  if (
    !merged.buttonIconPublicUrl &&
    isHttpAssetUrl(draft.iconDataUrl) &&
    draftUsesCustomLauncherIcon(draft)
  ) {
    merged.buttonIconPublicUrl = draft.iconDataUrl.trim();
  }
  if (
    !merged.teaserAvatarPublicUrl &&
    isHttpAssetUrl(draft.proactiveTeaserAvatarDataUrl)
  ) {
    merged.teaserAvatarPublicUrl = draft.proactiveTeaserAvatarDataUrl.trim();
  }
  if (!merged.headerLogoPublicUrl && isHttpAssetUrl(draft.headerLogoDataUrl)) {
    merged.headerLogoPublicUrl = draft.headerLogoDataUrl.trim();
  }
  if (!merged.agentAvatarPublicUrl && isHttpAssetUrl(draft.agentAvatarDataUrl)) {
    merged.agentAvatarPublicUrl = draft.agentAvatarDataUrl.trim();
  }
  if (!merged.visitorAvatarPublicUrl && isHttpAssetUrl(draft.visitorAvatarDataUrl)) {
    merged.visitorAvatarPublicUrl = draft.visitorAvatarDataUrl.trim();
  }
  if (isHttpAssetUrl(draft.bannerDataUrl)) {
    if (draft.bannerMediaType === "video") {
      if (!merged.bannerVideoPublicUrl) {
        merged.bannerVideoPublicUrl = draft.bannerDataUrl.trim();
      }
    } else if (!merged.bannerImagePublicUrl) {
      merged.bannerImagePublicUrl = draft.bannerDataUrl.trim();
    }
  }
  return merged;
}

/** `theme.designJson.theme` — synced with `chat.colors.panelBackground` + `config.ui.backgroundColor`. */
export function buildDesignJsonThemeTokensFromDraft(draft: WidgetDraft): JsonRecord {
  const panel = resolvePanelBackground(draft);
  const def = CHAT_WIZARD_PATCH_DEFAULTS;
  return {
    textColor: draft.textColor?.trim() || "#0f172a",
    secondaryColor: draft.themeSecondaryColor?.trim() || def.themeSecondaryColor,
    panelBackground: panel,
    iconColor: draft.iconColor?.trim() || "#ffffff",
  };
}

type DesignJsonPatchScope = "launcher_only" | "chat_surface" | "full";

/**
 * Partial `theme.designJson` per wizard step (backend deep-merges colors / chatBox / theme / ui).
 */
export function buildDesignJsonPatchFromDraft(
  draft: WidgetDraft,
  scope: DesignJsonPatchScope,
  assetUrls?: WidgetInstallationAssetUrls,
): JsonRecord {
  const panel = resolvePanelBackground(draft);
  const chat: JsonRecord = {
    colors: buildChatColorsFromWidgetDraft(draft),
    launcher: buildLauncherDesignJsonFromDraft(draft, assetUrls),
  };
  if (scope === "chat_surface" || scope === "full") {
    const urls = mergeDraftAssetUrls(draft, assetUrls);
    chat.chatBox = buildChatBoxPayloadFromDraft(draft, assetUrls);
    chat.panel = {
      surfaceStyle: normalizePanelSurfaceStyle(draft.panelSurfaceStyle),
    };
    chat.bubbles = {
      surfaceStyle: normalizeLauncherStyle(draft.bubbleSurfaceStyle),
    };
    chat.avatars = {
      agent: {
        enabled: draft.agentAvatarEnabled !== false,
        url: urls.agentAvatarPublicUrl ?? "",
        preset: normalizeAgentAvatarPreset(draft.agentAvatarPreset),
      },
      visitor: {
        enabled: draft.visitorAvatarEnabled !== false,
        url: urls.visitorAvatarPublicUrl ?? "",
        preset: normalizeVisitorAvatarPreset(draft.visitorAvatarPreset),
      },
    };
  }
  const patch: JsonRecord = {
    chat,
    theme: buildDesignJsonThemeTokensFromDraft(draft),
    ui: { backgroundColor: panel },
  };
  if (scope === "chat_surface" || scope === "full") {
    patch.behavior = buildChatPanelDesignJsonBehaviorFromDraft(draft);
  }
  const accent = draft.themeDesignJsonAccent?.trim();
  const density = draft.themeDesignJsonDensity?.trim();
  if (accent) patch.accent = accent;
  if (density) patch.density = density;
  return patch;
}

/** `theme.designJson.chat` block (colors + optional chatBox). */
export function buildChatDesignJsonFromDraft(
  draft: WidgetDraft,
  assetUrls?: WidgetInstallationAssetUrls,
): JsonRecord {
  const patch = buildDesignJsonPatchFromDraft(draft, "full", assetUrls);
  const chat = patch.chat;
  return chat && typeof chat === "object" && !Array.isArray(chat) ? (chat as JsonRecord) : {};
}

function buildThemeScalarsFromDraft(draft: WidgetDraft): JsonRecord {
  const def = CHAT_WIZARD_PATCH_DEFAULTS;
  const primary = draft.themePrimaryColor ?? draft.buttonColor ?? "#2563eb";
  return {
    name: draft.themeName ?? def.themeName,
    primaryColor: primary,
    secondaryColor: draft.themeSecondaryColor ?? def.themeSecondaryColor,
    buttonHoverColor: draft.buttonHoverColor,
    iconColor: draft.iconColor,
    textColor: draft.textColor,
    fontFamily: draft.themeFontFamily ?? def.themeFontFamily,
    bubbleStyle: draft.themeBubbleStyle ?? def.themeBubbleStyle,
    buttonShape: themeButtonShapeForPatch(draft),
    position: draft.buttonPosition,
    borderRadiusPx: draft.themeBorderRadiusPx ?? def.themeBorderRadiusPx,
    welcomeFontSizePx: draft.themeWelcomeFontSizePx ?? def.themeWelcomeFontSizePx,
    bodyFontSizePx: draft.themeBodyFontSizePx ?? def.themeBodyFontSizePx,
    inputFontSizePx: draft.themeInputFontSizePx ?? def.themeInputFontSizePx,
    ctaFontSizePx: draft.themeCtaFontSizePx ?? def.themeCtaFontSizePx,
    consentFontSizePx: draft.themeConsentFontSizePx ?? def.themeConsentFontSizePx,
    lineHeightPx: draft.themeLineHeightPx ?? def.themeLineHeightPx,
  };
}

/** Launcher FAB fields allowed under PATCH `config.ui` (not `designJson.chat.launcher`). */
export function buildLauncherUiFromDraft(
  draft: WidgetDraft,
  assetUrls?: WidgetInstallationAssetUrls,
): JsonRecord {
  const urls = mergeDraftAssetUrls(draft, assetUrls);
  const def = CHAT_WIZARD_PATCH_DEFAULTS;
  const ui: JsonRecord = {
    buttonShape: draft.buttonShape,
    buttonPosition: draft.buttonPosition,
    launcherInsetBottomPx: draft.launcherInsetBottomPx,
    launcherInsetSidePx: draft.launcherInsetSidePx,
    launcherIconPreset: draft.launcherIconPreset || "phosphor-chat-dots",
    launcherStyle: draft.launcherStyle ?? "solid",
    buttonHoverColor: draft.buttonHoverColor,
    proactiveTeaserEnabled: draft.proactiveTeaserEnabled !== false,
    proactiveTeaser: (draft.proactiveTeaser ?? def.proactiveTeaser).trim(),
    proactiveTeaserAvatarEnabled: draft.proactiveTeaserAvatarEnabled === true,
    proactiveSecondaryCtaEnabled: draft.proactiveSecondaryCtaEnabled === true,
    proactiveSecondaryCtaLabel: draft.proactiveSecondaryCtaLabel?.trim() || undefined,
    proactiveSecondaryCtaHref: draft.proactiveSecondaryCtaHref?.trim() || undefined,
    proactiveSecondaryCtaKind: draft.proactiveSecondaryCtaKind?.trim() || undefined,
    closedMessagePreviewEnabled: draft.closedMessagePreviewEnabled !== false,
    buttonLabel:
      typeof draft.buttonLabel === "string" ? draft.buttonLabel.trim() : def.buttonLabel,
  };
  if (draft.launcherIconEnabled === false) {
    ui.launcherIconEnabled = false;
  } else {
    ui.launcherIconEnabled = true;
  }
  if (draft.launcherLabelEnabled === false) {
    ui.launcherLabelEnabled = false;
  } else {
    ui.launcherLabelEnabled = true;
  }
  if (draftUsesCustomLauncherIcon(draft, urls)) {
    ui.buttonIconUrl = urls.buttonIconPublicUrl;
  } else {
    ui.buttonIconUrl = "";
  }
  if (urls.teaserAvatarPublicUrl) {
    ui.proactiveTeaserAvatarUrl = urls.teaserAvatarPublicUrl;
  } else if (draft.proactiveTeaserAvatarDataUrl?.trim().startsWith("http")) {
    ui.proactiveTeaserAvatarUrl = draft.proactiveTeaserAvatarDataUrl.trim();
  }
  return ui;
}

/** Wizard step 2 (chat box UI): only `chatBox` — launcher + FAB `colors` were sent in step 1. */
export function buildChatBoxOnlyDesignJson(
  draft: WidgetDraft,
  assetUrls?: WidgetInstallationAssetUrls,
): JsonRecord {
  return { chatBox: buildChatBoxPayloadFromDraft(draft, assetUrls) };
}

function resolveChatAvatarPublicUrls(
  draft: WidgetDraft,
  assetUrls?: WidgetInstallationAssetUrls,
): { agent: string; visitor: string } {
  const urls = mergeDraftAssetUrls(draft, assetUrls);
  return {
    agent: urls.agentAvatarPublicUrl?.trim() ?? "",
    visitor: urls.visitorAvatarPublicUrl?.trim() ?? "",
  };
}

/** Mirror avatar + surface fields onto `designJson.ui` (embed reads `djUi` as fallback). */
function buildChatSurfaceDesignJsonUiFromDraft(
  draft: WidgetDraft,
  assetUrls?: WidgetInstallationAssetUrls,
  backgroundColor?: string,
): JsonRecord {
  const avatarUrls = resolveChatAvatarPublicUrls(draft, assetUrls);
  return {
    backgroundColor: backgroundColor ?? resolvePanelBackground(draft),
    panelSurfaceStyle: normalizePanelSurfaceStyle(draft.panelSurfaceStyle),
    bubbleSurfaceStyle: normalizeLauncherStyle(draft.bubbleSurfaceStyle),
    agentAvatarEnabled: draft.agentAvatarEnabled !== false,
    visitorAvatarEnabled: draft.visitorAvatarEnabled !== false,
    agentAvatarPreset: normalizeAgentAvatarPreset(draft.agentAvatarPreset),
    visitorAvatarPreset: normalizeVisitorAvatarPreset(draft.visitorAvatarPreset),
    agentAvatarUrl: avatarUrls.agent,
    visitorAvatarUrl: avatarUrls.visitor,
  };
}

/** `theme.designJson` for step 2 — chat surface without launcher (step 1 owns FAB). */
export function buildChatSurfaceDesignJsonPatchFromDraft(
  draft: WidgetDraft,
  assetUrls?: WidgetInstallationAssetUrls,
): JsonRecord {
  const patch = buildDesignJsonPatchFromDraft(draft, "chat_surface", assetUrls);
  const avatarUrls = resolveChatAvatarPublicUrls(draft, assetUrls);
  const chat =
    patch.chat && typeof patch.chat === "object" && !Array.isArray(patch.chat)
      ? ({ ...(patch.chat as JsonRecord) } as JsonRecord)
      : ({} as JsonRecord);
  delete chat.launcher;

  const avatars = chat.avatars;
  if (avatars && typeof avatars === "object" && !Array.isArray(avatars)) {
    const av = avatars as JsonRecord;
    const agent = av.agent;
    const visitor = av.visitor;
    chat.avatars = {
      ...av,
      ...(agent && typeof agent === "object" && !Array.isArray(agent)
        ? { agent: { ...(agent as JsonRecord), url: avatarUrls.agent } }
        : {}),
      ...(visitor && typeof visitor === "object" && !Array.isArray(visitor)
        ? { visitor: { ...(visitor as JsonRecord), url: avatarUrls.visitor } }
        : {}),
    };
  }

  const prevUi =
    patch.ui && typeof patch.ui === "object" && !Array.isArray(patch.ui)
      ? (patch.ui as JsonRecord)
      : {};
  const panel = typeof prevUi.backgroundColor === "string" ? prevUi.backgroundColor : undefined;

  return {
    ...patch,
    chat,
    ui: buildChatSurfaceDesignJsonUiFromDraft(draft, assetUrls, panel),
  };
}

/** Step 2+ panel `config.ui` — chat shell only; do not re-send launcher (step 1 owns FAB). */
export function buildChatPanelUiFromDraft(
  draft: WidgetDraft,
  assetUrls?: WidgetInstallationAssetUrls,
): JsonRecord {
  const def = CHAT_WIZARD_PATCH_DEFAULTS;
  const urls = mergeDraftAssetUrls(draft, assetUrls);
  const headerAlign = (draft.headerTitleAlign ?? "Center").toLowerCase();
  const panel = resolvePanelBackground(draft);
  const ui: JsonRecord = {
    buttonLabel:
      typeof draft.buttonLabel === "string" ? draft.buttonLabel.trim() : def.buttonLabel,
    headerTitle: draft.headerTitle?.trim() ?? "",
    headerTitleAlign: headerAlign,
    header: { align: headerAlign, companyName: draft.headerTitle },
    firstMessage: "",
    greetingMessage: draft.greetingMessage,
    panelGreetingEnabled: false,
    chatWelcomeEnabled: false,
    sendPlaceholder: draft.sendPlaceholder,
    messagePlaceholder: draft.messagePlaceholder ?? def.messagePlaceholder,
    bannerOn: draft.bannerOn,
    bannerEnabled: draft.bannerOn,
    bannerTitle: draft.bannerTitle?.trim() ?? "",
    bannerDescription: draft.bannerDescription?.trim() ?? "",
    bannerMediaType: draft.bannerMediaType,
    backgroundImageUrl: "",
    backgroundColor: panel,
    boxWidth: draft.boxWidth,
    boxHeight: draft.boxHeight,
    width: draft.boxWidth,
    height: draft.boxHeight,
    popupEnabled: draft.popupEnabled ?? def.popupEnabled,
  };
  if (urls.bannerImagePublicUrl) ui.bannerImageUrl = urls.bannerImagePublicUrl;
  if (urls.bannerVideoPublicUrl) ui.bannerVideoUrl = urls.bannerVideoPublicUrl;
  if (urls.headerLogoPublicUrl) ui.headerLogoUrl = urls.headerLogoPublicUrl;
  ui.panelSurfaceStyle = normalizePanelSurfaceStyle(draft.panelSurfaceStyle);
  ui.bubbleSurfaceStyle = normalizeLauncherStyle(draft.bubbleSurfaceStyle);
  ui.agentAvatarEnabled = draft.agentAvatarEnabled !== false;
  ui.visitorAvatarEnabled = draft.visitorAvatarEnabled !== false;
  ui.agentAvatarPreset = normalizeAgentAvatarPreset(draft.agentAvatarPreset);
  ui.visitorAvatarPreset = normalizeVisitorAvatarPreset(draft.visitorAvatarPreset);
  ui.agentAvatarUrl = urls.agentAvatarPublicUrl?.trim() ?? "";
  ui.visitorAvatarUrl = urls.visitorAvatarPublicUrl?.trim() ?? "";
  return ui;
}

/** `config.ui` chat shell + launcher (includes `backgroundColor` for panel sync). */
export function buildChatShellUiFromDraft(
  draft: WidgetDraft,
  assetUrls?: WidgetInstallationAssetUrls,
): JsonRecord {
  const def = CHAT_WIZARD_PATCH_DEFAULTS;
  const urls = mergeDraftAssetUrls(draft, assetUrls);
  const headerAlign = (draft.headerTitleAlign ?? "Center").toLowerCase();
  const panel = resolvePanelBackground(draft);
  const ui: JsonRecord = {
    ...buildLauncherUiFromDraft(draft, assetUrls),
    buttonLabel:
      typeof draft.buttonLabel === "string" ? draft.buttonLabel.trim() : def.buttonLabel,
    headerTitle: draft.headerTitle?.trim() ?? "",
    headerTitleAlign: headerAlign,
    header: { align: headerAlign, companyName: draft.headerTitle },
    firstMessage: "",
    greetingMessage: draft.greetingMessage,
    panelGreetingEnabled: false,
    chatWelcomeEnabled: false,
    sendPlaceholder: draft.sendPlaceholder,
    messagePlaceholder: draft.messagePlaceholder ?? def.messagePlaceholder,
    bannerOn: draft.bannerOn,
    bannerEnabled: draft.bannerOn,
    bannerTitle: draft.bannerTitle?.trim() ?? "",
    bannerDescription: draft.bannerDescription?.trim() ?? "",
    bannerMediaType: draft.bannerMediaType,
    backgroundImageUrl: "",
    backgroundColor: panel,
    boxWidth: draft.boxWidth,
    boxHeight: draft.boxHeight,
    width: draft.boxWidth,
    height: draft.boxHeight,
    popupEnabled: draft.popupEnabled ?? def.popupEnabled,
  };
  if (urls.bannerImagePublicUrl) ui.bannerImageUrl = urls.bannerImagePublicUrl;
  if (urls.bannerVideoPublicUrl) ui.bannerVideoUrl = urls.bannerVideoPublicUrl;
  if (urls.headerLogoPublicUrl) ui.headerLogoUrl = urls.headerLogoPublicUrl;
  ui.panelSurfaceStyle = normalizePanelSurfaceStyle(draft.panelSurfaceStyle);
  ui.bubbleSurfaceStyle = normalizeLauncherStyle(draft.bubbleSurfaceStyle);
  ui.agentAvatarEnabled = draft.agentAvatarEnabled !== false;
  ui.visitorAvatarEnabled = draft.visitorAvatarEnabled !== false;
  ui.agentAvatarPreset = normalizeAgentAvatarPreset(draft.agentAvatarPreset);
  ui.visitorAvatarPreset = normalizeVisitorAvatarPreset(draft.visitorAvatarPreset);
  ui.agentAvatarUrl = urls.agentAvatarPublicUrl?.trim() ?? "";
  ui.visitorAvatarUrl = urls.visitorAvatarPublicUrl?.trim() ?? "";
  return ui;
}

function themeButtonShapeForPatch(draft: WidgetDraft): string {
  if (draft.buttonShape === "rounded") return "rounded";
  if (draft.buttonShape === "square") return "square";
  return "circle";
}

/** Step 1 PATCH `config`: theme scalars + `designJson` (colors, theme tokens, ui.backgroundColor) + launcher `ui`. */
export function buildChatWizardStep1Config(
  draft: WidgetDraft,
  assetUrls?: WidgetInstallationAssetUrls,
): JsonRecord {
  const panel = resolvePanelBackground(draft);
  return {
    theme: {
      ...buildThemeScalarsFromDraft(draft),
      designJson: buildDesignJsonPatchFromDraft(draft, "launcher_only", assetUrls),
    },
    ui: {
      ...buildLauncherUiFromDraft(draft, assetUrls),
      backgroundColor: panel,
    },
  };
}

/** `config.behavior.inquiryOptions` for widget JSON (embed pills + routing ids). */
export function buildInquiryBehaviorPatchFromDraft(draft: WidgetDraft): JsonRecord {
  return {
    behavior: buildInquiryBehaviorPatchFields({
      inquiryOn: draft.inquiryOn,
      inquiryOptions: draft.inquiryOptions,
      inquiryRequired: draft.inquiryRequired,
      inquirySkipLabel: draft.inquirySkipLabel,
      inquiryFallbackRoutingKey: draft.inquiryFallbackRoutingKey,
    }),
  };
}

/** Step 2 PATCH `config`: chat surface + inquiry JSON (does not overwrite step 1 launcher). */
export function buildChatWizardStep2Config(
  draft: WidgetDraft,
  assetUrls?: WidgetInstallationAssetUrls,
): JsonRecord {
  return {
    ...buildInquiryBehaviorPatchFromDraft(draft),
    theme: {
      designJson: buildChatSurfaceDesignJsonPatchFromDraft(draft, assetUrls),
    },
    ui: buildChatPanelUiFromDraft(draft, assetUrls),
  };
}

/** Merged CHAT config for final publish (all wizard steps). */
export function buildFullChatConfigFromDraft(
  draft: WidgetDraft,
  assetUrls?: WidgetInstallationAssetUrls,
): JsonRecord {
  const routing = buildChatWizardStep3Config(draft);
  const config: JsonRecord = {
    ...routing,
    theme: {
      ...buildThemeScalarsFromDraft(draft),
      designJson: buildDesignJsonPatchFromDraft(draft, "full", assetUrls),
    },
    ui: buildChatShellUiFromDraft(draft, assetUrls),
  };
  applyAiTypeToWidgetConfig(config, draft);
  return config;
}

/**
 * Step 4 publish body: merge steps 1→3 Network PATCH configs (save trace), then fill gaps from draft.
 * Ensures install publish matches what each wizard step actually saved.
 */
export function buildFullChatPublishConfigFromDraft(
  draft: WidgetDraft,
  assetUrls?: WidgetInstallationAssetUrls,
): JsonRecord {
  const fromDraft = buildFullChatConfigFromDraft(draft, assetUrls);
  const fromTrace = accumulateWizardInstallConfigFromSaveTrace();
  if (Object.keys(fromTrace).length === 0) return fromDraft;
  const merged = mergeWidgetConfigForEdit(fromDraft, fromTrace);
  applyAiTypeToWidgetConfig(merged, draft);
  return merged;
}

/** BOTH final publish: full chat wizard config + Text Us designJson + SMS form fields. */
export function buildFullBothPublishConfigFromDraft(
  draft: WidgetDraft,
  assetUrls?: WidgetInstallationAssetUrls,
): JsonRecord {
  const chatConfig = buildFullChatPublishConfigFromDraft(draft, assetUrls);
  const chatTheme =
    typeof chatConfig.theme === "object" &&
    chatConfig.theme !== null &&
    !Array.isArray(chatConfig.theme)
      ? ({ ...(chatConfig.theme as JsonRecord) } as JsonRecord)
      : ({} as JsonRecord);
  const designJson =
    typeof chatTheme.designJson === "object" &&
    chatTheme.designJson !== null &&
    !Array.isArray(chatTheme.designJson)
      ? ({ ...(chatTheme.designJson as JsonRecord) } as JsonRecord)
      : ({} as JsonRecord);
  const chatForm =
    typeof chatConfig.form === "object" &&
    chatConfig.form !== null &&
    !Array.isArray(chatConfig.form)
      ? ({ ...(chatConfig.form as JsonRecord) } as JsonRecord)
      : ({} as JsonRecord);

  return {
    ...chatConfig,
    theme: {
      ...chatTheme,
      designJson: {
        ...designJson,
        textUs: buildTextUsDesignJsonFromDraft(draft, assetUrls),
      },
    },
    form: {
      ...chatForm,
      fields: textUsDraftFieldsAsFormPayload(draft),
    },
  };
}

/** Step 3 PATCH `config`: routing, domains, behavior, session, form, response. */
export function buildChatWizardStep3Config(draft: WidgetDraft): JsonRecord {
  const def = CHAT_WIZARD_PATCH_DEFAULTS;
  const inquiryBehavior = buildInquiryBehaviorPatchFields({
    inquiryOn: draft.inquiryOn,
    inquiryOptions: draft.inquiryOptions,
    inquiryRequired: draft.inquiryRequired,
    inquirySkipLabel: draft.inquirySkipLabel,
    inquiryFallbackRoutingKey: draft.inquiryFallbackRoutingKey,
  });
  const config: JsonRecord = {
    chatMode: (draft.chatMode ?? "HYBRID") as WidgetChatModeApi,
    behavior: {
      botEnabled: draft.botEnabled ?? def.botEnabled,
      notificationEnabled: draft.notificationEnabled ?? def.notificationEnabled,
      browserNotification: draft.browserNotification ?? true,
      soundNotification: draft.soundNotification ?? false,
      fallbackNotificationText:
        draft.fallbackNotificationText ?? "New message from support",
      ...inquiryBehavior,
      videoWelcomeOn: draft.videoWelcomeOn ?? false,
      videoWelcomeUrl: draft.videoWelcomeUrl?.trim() || undefined,
      welcomeMessage: draft.welcomeMessageBehavior ?? def.welcomeMessage,
      autoOpenEnabled: draft.autoOpenEnabled ?? def.autoOpenEnabled,
      autoOpenDelaySeconds: draft.autoOpenDelaySeconds ?? def.autoOpenDelaySeconds,
      autoOpenOnReturnVisit: draft.autoOpenOnReturnVisit ?? def.autoOpenOnReturnVisit,
      notificationSoundId: normalizeWidgetSoundId(
        draft.soundNotification === false
          ? "none"
          : (draft.notificationSoundId ?? def.notificationSoundId),
      ),
      launcherBadgeMode: normalizeLauncherBadgeMode(
        draft.launcherBadgeMode ?? def.launcherBadgeMode,
      ),
      fileUploadEnabled: draft.fileUploadEnabled ?? def.fileUploadEnabled,
      emojiEnabled: draft.emojiEnabled ?? def.emojiEnabled,
      consentRequired: draft.consentRequired ?? def.consentRequired,
      consentText: draft.consentText ?? def.consentText,
      privacyPolicyUrl: draft.privacyPolicyUrl ?? def.privacyPolicyUrl,
      privacyNotice: draft.privacyNotice ?? def.privacyNotice,
      allowedDomainsText: draft.allowedDomainsText ?? def.allowedDomainsText,
      motionEnabled: draft.motionEnabled !== false,
    },
    session: {
      persistVisitorSession: draft.persistVisitorSession ?? def.persistVisitorSession,
      sessionTtlMinutes: draft.sessionTtlMinutes ?? def.sessionTtlMinutes,
    },
    form: {
      enabled: draft.formEnabled ?? def.formEnabled,
      title: draft.formTitle ?? def.formTitle,
      subtitle: draft.formSubtitle ?? def.formSubtitle,
      submitLabel: draft.formSubmitLabel ?? def.formSubmitLabel,
      prechatNameEnabled: draft.prechatNameEnabled ?? def.prechatNameEnabled,
      prechatEmailEnabled: draft.prechatEmailEnabled ?? def.prechatEmailEnabled,
      prechatPhoneEnabled: draft.prechatPhoneEnabled ?? def.prechatPhoneEnabled,
      prechatMessageEnabled: draft.prechatMessageEnabled ?? def.prechatMessageEnabled,
      prechatMessageRequired: draft.prechatMessageRequired ?? def.prechatMessageRequired,
      fields: prechatDraftFieldsAsFormPayload(draft),
    },
    offlineForm: {
      enabled: draft.offlineFormEnabled ?? def.offlineFormEnabled,
      title: draft.offlineFormTitle ?? def.offlineFormTitle,
      subtitle: draft.offlineFormSubtitle ?? def.offlineFormSubtitle,
      submitLabel: draft.offlineFormSubmitLabel ?? def.offlineFormSubmitLabel,
      prechatNameEnabled: draft.offlinePrechatNameEnabled ?? def.offlinePrechatNameEnabled,
      prechatEmailEnabled: draft.offlinePrechatEmailEnabled ?? def.offlinePrechatEmailEnabled,
      prechatPhoneEnabled: draft.offlinePrechatPhoneEnabled ?? def.offlinePrechatPhoneEnabled,
      prechatMessageEnabled: draft.offlinePrechatMessageEnabled ?? def.offlinePrechatMessageEnabled,
      prechatMessageRequired: draft.offlinePrechatMessageRequired ?? def.offlinePrechatMessageRequired,
      fields: offlineDraftFieldsAsFormPayload(draft),
    },
    response: {
      welcomeMessage: draft.responseWelcomeMessage ?? def.responseWelcomeMessage,
      offlineMessage: draft.responseOfflineMessage ?? def.responseOfflineMessage,
      greetingMessage: draft.responseGreetingMessage ?? def.responseGreetingMessage,
      sendPlaceholder: draft.responseSendPlaceholder ?? def.responseSendPlaceholder,
      aiPromptHint: draft.responseAiPromptHint ?? def.responseAiPromptHint,
      agentTalkToAgentEnabled:
        draft.responseTalkToAgentEnabled ?? def.responseTalkToAgentEnabled,
      agentHandoverEnabled:
        draft.responseTalkToAgentEnabled ?? def.responseTalkToAgentEnabled,
      talkToAgentTriggerText:
        draft.responseTalkToAgentTriggerText ?? def.responseTalkToAgentTriggerText,
      handoverTriggerText:
        draft.responseTalkToAgentTriggerText ?? def.responseTalkToAgentTriggerText,
    },
  };
  if (draft.allowedDomains?.length) config.allowedDomains = draft.allowedDomains;
  applyAiTypeToWidgetConfig(config, draft);
  return config;
}

/**
 * Chat pre-chat / offline form fields from wizard toggles.
 * Maps to `config.form.fields` / `config.offlineForm.fields` for embed field resolver.
 */
export function prechatTogglesToFormFields(toggles: {
  prechatNameEnabled?: boolean;
  prechatEmailEnabled?: boolean;
  prechatPhoneEnabled?: boolean;
  prechatMessageEnabled?: boolean;
  prechatMessageRequired?: boolean;
}): JsonRecord[] {
  const def = CHAT_WIZARD_PATCH_DEFAULTS;
  const nameOn = toggles.prechatNameEnabled ?? def.prechatNameEnabled;
  const emailOn = toggles.prechatEmailEnabled ?? def.prechatEmailEnabled;
  const phoneOn = toggles.prechatPhoneEnabled ?? def.prechatPhoneEnabled;
  const messageOn = toggles.prechatMessageEnabled ?? def.prechatMessageEnabled;
  const messageRequired = toggles.prechatMessageRequired ?? def.prechatMessageRequired;

  const fields: JsonRecord[] = [];
  if (nameOn) {
    fields.push({
      key: "name",
      label: "Name",
      fieldType: "text",
      type: "text",
      required: true,
      options: [],
    });
  }
  if (emailOn) {
    fields.push({
      key: "email",
      label: "Email",
      fieldType: "email",
      type: "email",
      required: false,
      options: [],
    });
  }
  if (phoneOn) {
    fields.push({
      key: "phone",
      label: "Phone",
      fieldType: "phone",
      type: "phone",
      required: false,
      options: [],
    });
  }
  if (messageOn) {
    fields.push({
      key: "message",
      label: "Message",
      fieldType: "textarea",
      type: "textarea",
      required: messageRequired,
      options: [],
    });
  }
  return fields;
}

export function prechatDraftFieldsAsFormPayload(draft: WidgetDraft): JsonRecord[] {
  const def = CHAT_WIZARD_PATCH_DEFAULTS;
  return prechatTogglesToFormFields({
    prechatNameEnabled: draft.prechatNameEnabled ?? def.prechatNameEnabled,
    prechatEmailEnabled: draft.prechatEmailEnabled ?? def.prechatEmailEnabled,
    prechatPhoneEnabled: draft.prechatPhoneEnabled ?? def.prechatPhoneEnabled,
    prechatMessageEnabled: draft.prechatMessageEnabled ?? def.prechatMessageEnabled,
    prechatMessageRequired: draft.prechatMessageRequired ?? def.prechatMessageRequired,
  });
}

export function offlineDraftFieldsAsFormPayload(draft: WidgetDraft): JsonRecord[] {
  const def = CHAT_WIZARD_PATCH_DEFAULTS;
  return prechatTogglesToFormFields({
    prechatNameEnabled: draft.offlinePrechatNameEnabled ?? def.offlinePrechatNameEnabled,
    prechatEmailEnabled: draft.offlinePrechatEmailEnabled ?? def.offlinePrechatEmailEnabled,
    prechatPhoneEnabled: draft.offlinePrechatPhoneEnabled ?? def.offlinePrechatPhoneEnabled,
    prechatMessageEnabled: draft.offlinePrechatMessageEnabled ?? def.offlinePrechatMessageEnabled,
    prechatMessageRequired: draft.offlinePrechatMessageRequired ?? def.offlinePrechatMessageRequired,
  });
}

/** Text-us field list goes under PATCH `config.form.fields`; use `type` for runtime pre-chat resolver. */
export function textUsDraftFieldsAsFormPayload(draft: WidgetDraft): JsonRecord[] {
  const source = resolveTextUsFormFields(draft.textUsFormFields);
  return source.map((f) => {
    const row: JsonRecord = {
      key: String(f.key),
      label: String(f.label ?? f.key),
      required: Boolean(f.required),
      type: String(f.fieldType ?? "text").toLowerCase(),
    };
    const ph = f.placeholder?.trim();
    if (ph) row.placeholder = ph;
    return row;
  });
}

/**
 * First wizard step — draft only (`publishNow: false`).
 * Use **only** fields allowed by `InstallTokenDto` on POST /widgets/installations (strict whitelist).
 * TEXT_US / CHAT / BOTH: nested theme/ui/textUsFormConfig are merged on later PATCH steps, not here.
 */
export function buildMinimalWidgetInstallationBody(input: {
  websiteId: string;
  widgetType: WidgetTypeApi;
  publishNow?: boolean;
}): JsonRecord {
  return {
    websiteId: input.websiteId.trim(),
    widgetType: input.widgetType,
    publishNow: input.publishNow ?? false,
  };
}

/**
 * Builds full `POST /widgets/installations`-style merged config OR PATCH `config` pieces
 * (InstallTokenDto: theme, ui, behavior, session, form, response — not legacy `settingsJson`).
 */
export function buildWidgetInstallationPayload(input: {
  websiteId: string;
  widgetType: WidgetTypeApi;
  draft: WidgetDraft;
  publishNow?: boolean;
  assetUrls?: WidgetInstallationAssetUrls;
}): JsonRecord {
  const { websiteId, widgetType, draft, publishNow = true, assetUrls } = input;

  const chatMode = (draft.chatMode ?? "HYBRID") as WidgetChatModeApi;

  const themeDesign: JsonRecord =
    widgetType === "CHAT" || widgetType === "BOTH"
      ? buildDesignJsonPatchFromDraft(draft, "full", assetUrls)
      : {};

  if (widgetType === "TEXT_US" || widgetType === "BOTH") {
    themeDesign.textUs = buildTextUsDesignJsonFromDraft(draft, assetUrls);
  }

  const body: JsonRecord = {
    websiteId,
    widgetType,
    publishNow,
    theme:
      widgetType === "CHAT" || widgetType === "BOTH"
        ? { ...buildThemeScalarsFromDraft(draft), designJson: themeDesign }
        : { designJson: themeDesign },
    ui:
      widgetType === "CHAT" || widgetType === "BOTH"
        ? buildChatShellUiFromDraft(draft, assetUrls)
        : {},
    behavior: {},
    form: {},
    response: {},
  };

  if (widgetType === "CHAT" || widgetType === "BOTH") {
    body.chatMode = chatMode;
  }

  if (draft.allowedDomains?.length) {
    body.allowedDomains = draft.allowedDomains;
  }

  if (widgetType === "TEXT_US" || widgetType === "BOTH") {
    body.textUsFormConfig = {
      fields: draft.textUsFormFields?.length
        ? draft.textUsFormFields
        : defaultTextUsFormFields(),
    };
  }

  return body;
}

/** Add-widget CHAT flow: PATCH `config` in three slices (~theme / ~ui+chatBox / ~routing+behavior+session+form+response). */
export type ChatWidgetWizardPatchScope =
  /** Step 1: `theme` scalars + `ui` launcher + `designJson.chat.colors`. */
  | "launcher_only"
  /** Step 2: `theme.designJson.chat` (chatBox + header text color) + `config.ui`. */
  | "chat_surface"
  /** Step 3: `chatMode`, `allowedDomains`, `behavior`, `session`, `form`, `response`. */
  | "notifications_only"
  /** Inquiry topics only: `behavior.inquiryOptions` (visitor-topics sync uses same helper). */
  | "inquiry_only";

/**
 * Body for `PATCH /widgets/:widgetKey` — `UpdateWidgetConfigurationDto`:
 * merges config like InstallTokenDto without websiteId/publishNow (widgetType optional top-level).
 */
export function buildWidgetPatchConfigurationBody(input: {
  draft: WidgetDraft;
  widgetType: WidgetTypeApi;
  publishNow: boolean;
  assetUrls?: WidgetInstallationAssetUrls;
  embedAllowAnyOrigin?: boolean;
  /** When set for `CHAT`, PATCH body is trimmed to that wizard step (scoped steps also apply to `BOTH` chat slices). */
  chatWizardPatchScope?: ChatWidgetWizardPatchScope;
}): JsonRecord {
  const { draft, widgetType, publishNow, assetUrls, embedAllowAnyOrigin } =
    input;

  const withConfig = (config: JsonRecord): JsonRecord => ({
    publishNow,
    widgetType,
    config: sanitizeWidgetPatchConfig(config),
    ...(embedAllowAnyOrigin !== undefined ? { embedAllowAnyOrigin } : {}),
  });

  if (
    (widgetType === "CHAT" || widgetType === "BOTH") &&
    input.chatWizardPatchScope === "launcher_only"
  ) {
    return withConfig(buildChatWizardStep1Config(draft, assetUrls));
  }

  if (
    (widgetType === "CHAT" || widgetType === "BOTH") &&
    input.chatWizardPatchScope === "chat_surface"
  ) {
    return withConfig(buildChatWizardStep2Config(draft, assetUrls));
  }

  if (
    (widgetType === "CHAT" || widgetType === "BOTH") &&
    input.chatWizardPatchScope === "notifications_only"
  ) {
    return withConfig(buildChatWizardStep3Config(draft));
  }

  if (
    (widgetType === "CHAT" || widgetType === "BOTH") &&
    input.chatWizardPatchScope === "inquiry_only"
  ) {
    return withConfig(buildInquiryBehaviorPatchFromDraft(draft));
  }

  if (widgetType === "CHAT" && !input.chatWizardPatchScope) {
    return withConfig(buildFullChatPublishConfigFromDraft(draft, assetUrls));
  }

  if (widgetType === "BOTH" && !input.chatWizardPatchScope) {
    return withConfig(buildFullBothPublishConfigFromDraft(draft, assetUrls));
  }

  const wid = draft.websiteId?.trim();
  if (!wid) {
    throw new Error(
      "Widget draft is missing websiteId; complete the website step first.",
    );
  }

  const install = buildWidgetInstallationPayload({
    websiteId: wid,
    widgetType,
    draft,
    publishNow,
    assetUrls,
  });

  const theme = install.theme;

  /**
   * PATCH `config.ui` whitelist does not allow surface mirrors (`chat`, `textUs`).
   * Chat / Text-us visuals belong under `theme.designJson` only (same pattern as `ui.textUs` rejection).
   */
  const uiForPatch: JsonRecord = {};

  const baseForm =
    typeof install.form === "object" && install.form !== null && !Array.isArray(install.form)
      ? ({ ...(install.form as JsonRecord) } as JsonRecord)
      : ({} as JsonRecord);

  if (widgetType === "TEXT_US" || widgetType === "BOTH") {
    baseForm.fields = textUsDraftFieldsAsFormPayload(draft);
  }

  const config: JsonRecord = {};
  if (theme !== undefined) config.theme = theme;
  config.ui = uiForPatch;
  config.behavior =
    typeof install.behavior === "object" && install.behavior !== null ? install.behavior : {};
  config.session = {};
  config.form = baseForm;
  config.response =
    typeof install.response === "object" && install.response !== null ? install.response : {};

  if (widgetType === "CHAT" || widgetType === "BOTH") {
    config.chatMode = install.chatMode;
  }

  if (install.allowedDomains !== undefined)
    config.allowedDomains = install.allowedDomains;

  const body: JsonRecord = withConfig(config);
  return body;
}
