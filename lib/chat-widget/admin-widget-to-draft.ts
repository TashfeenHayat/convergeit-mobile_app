import { isRecord } from "@/lib/utils";
import type { JsonRecord } from "@/api/types/common.types";
import { widgetResponseData } from "@/api/widgets/widgets.api";
import type { WidgetDraft, WidgetInstallChatMode } from "./widgetDraft";
import { apiWidgetTypeToDraftKind } from "./widget-remote-sync";
import {
  defaultWidgetDraft,
  normalizeButtonPosition,
  normalizeButtonShape,
} from "./widgetDraft";
import { resolveLauncherIconDataUrlForDraft } from "./launcher-icon-draft.util";
import {
  normalizeAgentAvatarPreset,
  normalizeVisitorAvatarPreset,
} from "./chat-avatar-presets";
import { normalizeLauncherStyle, normalizePanelSurfaceStyle } from "./launcher-style";
import { normalizeWidgetInquiryOptions } from "./widget-inquiry.types";
import { mapApiChatColorsToDraft, widgetChatColorsDraftToPatch } from "./widget-colors-draft";
import { parseAiTypeFromConfigRoot } from "./widget-ai-type";
import {
  normalizeLauncherBadgeMode,
  normalizeWidgetSoundId,
} from "@/lib/widget-runtime/widget-notifications";
import { normalizeLauncherIconPreset } from "./launcher-icon-presets";

function pickStr(obj: unknown, keys: string[]): string {
  if (!isRecord(obj)) return "";
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function pickStrAllowEmpty(obj: unknown, keys: string[]): string | undefined {
  if (!isRecord(obj)) return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string") return v.trim();
  }
  return undefined;
}

function pickNum(obj: unknown, keys: string[]): number | undefined {
  if (!isRecord(obj)) return undefined;
  for (const k of keys) {
    const v = obj[k];
    const n = typeof v === "number" ? v : typeof v === "string" ? Number.parseFloat(v) : NaN;
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function pickBool(obj: unknown, keys: string[]): boolean | undefined {
  if (!isRecord(obj)) return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "boolean") return v;
  }
  return undefined;
}

function normalizeLauncherIconPresetFromApi(value: string): WidgetDraft["launcherIconPreset"] {
  return normalizeLauncherIconPreset(value, defaultWidgetDraft.launcherIconPreset);
}

function normalizeHeaderAlign(raw: string): "Center" | "Left" {
  const s = raw.trim().toLowerCase();
  if (s === "left") return "Left";
  return "Center";
}

function normalizeChatMode(raw: string): WidgetInstallChatMode | undefined {
  const u = raw.toUpperCase();
  if (u === "AI_ONLY" || u === "AGENT_ONLY" || u === "HYBRID") return u as WidgetInstallChatMode;
  return undefined;
}

function pickRecord(obj: unknown, keys: string[]): JsonRecord | null {
  if (!isRecord(obj)) return null;
  for (const k of keys) {
    const v = obj[k];
    if (isRecord(v)) return v as JsonRecord;
  }
  return null;
}

function firstRecord(...values: Array<JsonRecord | null | undefined>): JsonRecord | null {
  for (const v of values) {
    if (isRecord(v)) return v;
  }
  return null;
}

function normalizeAllowedDomainsList(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const list = raw
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((s) => s.trim());
  return list.length ? list : undefined;
}

/** DB stores domains on widget row; config may carry an empty array — prefer non-empty sources. */
function resolveAllowedDomainsList(
  config: JsonRecord | null,
  root: JsonRecord,
): string[] | undefined {
  for (const raw of [
    root.allowedDomains,
    root.allowed_domains,
    config?.allowedDomains,
    config?.allowed_domains,
  ]) {
    const list = normalizeAllowedDomainsList(raw);
    if (list) return list;
  }
  return undefined;
}

/**
 * Maps `GET /widgets/:widgetKey` (admin) payload into `WidgetDraft` fields used by the 3-step CHAT wizard + PATCH builders.
 */
export function mapAdminWidgetResponseToWidgetDraft(
  payload: unknown,
  widgetKey: string,
): Partial<WidgetDraft> {
  const root = widgetResponseData<JsonRecord>(payload as never);
  if (!isRecord(root)) return { remoteWidgetKey: widgetKey, widgetId: widgetKey };

  const config = isRecord(root.config) ? root.config : null;
  const theme = config && isRecord(config.theme) ? config.theme : null;
  const settingsJson =
    config && isRecord(config.settingsJson) ? (config.settingsJson as JsonRecord) : null;
  const dj =
    theme && isRecord(theme.designJson) ? (theme.designJson as JsonRecord) : null;
  const djUi = pickRecord(dj, ["ui"]);
  const djForm = pickRecord(dj, ["form"]);
  const djBehavior = pickRecord(dj, ["behavior"]);
  const djSession = pickRecord(dj, ["session"]);
  const djResponse = pickRecord(dj, ["response"]);
  const djTheme = pickRecord(dj, ["theme"]);
  const chat = dj && isRecord(dj.chat) ? (dj.chat as JsonRecord) : null;
  const launcher = chat && isRecord(chat.launcher) ? (chat.launcher as JsonRecord) : null;
  const chatBox = chat && isRecord(chat.chatBox) ? (chat.chatBox as JsonRecord) : null;
  const colors = chat && isRecord(chat.colors) ? (chat.colors as JsonRecord) : null;

  const ui = firstRecord(pickRecord(config, ["ui"]), pickRecord(settingsJson, ["ui"]), djUi);
  const behavior = firstRecord(
    pickRecord(config, ["behavior"]),
    pickRecord(settingsJson, ["behavior"]),
    djBehavior,
  );
  const session = firstRecord(
    pickRecord(config, ["session"]),
    pickRecord(settingsJson, ["session"]),
    djSession,
  );
  const form = firstRecord(pickRecord(config, ["form"]), pickRecord(settingsJson, ["form"]), djForm);
  const offlineForm = firstRecord(
    pickRecord(config, ["offlineForm"]),
    pickRecord(settingsJson, ["offlineForm"]),
  );
  const response = firstRecord(
    pickRecord(config, ["response"]),
    pickRecord(settingsJson, ["response"]),
    djResponse,
  );

  const websiteId = pickStr(root, ["websiteId", "website_id"]);
  const chatModeRaw =
    pickStr(config ?? {}, ["chatMode", "chat_mode", "mode"]) ||
    pickStr(root, ["chatMode", "chat_mode", "mode"]);
  const allowedDomains = resolveAllowedDomainsList(config, root);

  const inquiryRaw = behavior?.inquiryOptions;
  const inquiryOptions = normalizeWidgetInquiryOptions(
    inquiryRaw ?? defaultWidgetDraft.inquiryOptions,
  );

  const headerAlignRaw =
    pickStr(chatBox ?? {}, ["headerAlign", "headerTitleAlign"]) ||
    pickStr(ui ?? {}, ["headerTitleAlign"]) ||
    "Center";

  const widgetTypeRaw =
    pickStr(root, ["widgetType", "widget_type"]) ||
    pickStr(config ?? {}, ["widgetType", "widget_type"]);

  const patch: Partial<WidgetDraft> = {
    type: apiWidgetTypeToDraftKind(widgetTypeRaw),
    remoteWidgetKey: widgetKey,
    widgetId: widgetKey,
    websiteId: websiteId || undefined,
    completed: false,
    chatMode: normalizeChatMode(chatModeRaw) ?? defaultWidgetDraft.chatMode,
    aiType: parseAiTypeFromConfigRoot({
      ...(config ?? {}),
      ...(root as Record<string, unknown>),
    }),
    allowedDomains: allowedDomains?.length ? allowedDomains : undefined,
    embedAllowAnyOrigin:
      pickBool(root, ["embedAllowAnyOrigin", "embed_allow_any_origin"]) ??
      defaultWidgetDraft.embedAllowAnyOrigin,
    themeName: pickStr(theme ?? {}, ["name"]) || defaultWidgetDraft.themeName,
    themePrimaryColor:
      pickStr(theme ?? {}, ["primaryColor", "primary_color"]) ||
      pickStr(colors ?? {}, ["button"]) ||
      defaultWidgetDraft.themePrimaryColor,
    themeSecondaryColor:
      pickStr(theme ?? {}, ["secondaryColor", "secondary_color"]) ||
      defaultWidgetDraft.themeSecondaryColor,
    themeFontFamily: pickStr(theme ?? {}, ["fontFamily", "font_family"]) || defaultWidgetDraft.themeFontFamily,
    themeBubbleStyle: pickStr(theme ?? {}, ["bubbleStyle", "bubble_style"]) || defaultWidgetDraft.themeBubbleStyle,
    themeBorderRadiusPx:
      pickNum(theme ?? {}, ["borderRadiusPx", "border_radius_px"]) ?? defaultWidgetDraft.themeBorderRadiusPx,
    bubbleBorderRadiusPx:
      pickNum(behavior ?? {}, ["bubbleBorderRadiusPx"]) ??
      pickNum(theme ?? {}, ["borderRadiusPx", "border_radius_px"]) ??
      defaultWidgetDraft.bubbleBorderRadiusPx,
    themeWelcomeFontSizePx:
      pickNum(theme ?? {}, ["welcomeFontSizePx", "welcome_font_size_px"]) ??
      defaultWidgetDraft.themeWelcomeFontSizePx,
    themeBodyFontSizePx:
      pickNum(theme ?? {}, ["bodyFontSizePx", "body_font_size_px"]) ?? defaultWidgetDraft.themeBodyFontSizePx,
    themeInputFontSizePx:
      pickNum(theme ?? {}, ["inputFontSizePx", "input_font_size_px"]) ?? defaultWidgetDraft.themeInputFontSizePx,
    themeCtaFontSizePx:
      pickNum(theme ?? {}, ["ctaFontSizePx", "cta_font_size_px"]) ?? defaultWidgetDraft.themeCtaFontSizePx,
    themeConsentFontSizePx:
      pickNum(theme ?? {}, ["consentFontSizePx", "consent_font_size_px"]) ??
      defaultWidgetDraft.themeConsentFontSizePx,
    themeLineHeightPx:
      pickNum(theme ?? {}, ["lineHeightPx", "line_height_px"]) ?? defaultWidgetDraft.themeLineHeightPx,
    themeDesignJsonAccent:
      isRecord(dj) && typeof dj.accent === "string" ? dj.accent : defaultWidgetDraft.themeDesignJsonAccent,
    themeDesignJsonDensity:
      isRecord(dj) && typeof dj.density === "string" ? dj.density : defaultWidgetDraft.themeDesignJsonDensity,
    buttonShape: normalizeButtonShape(
      (launcher ? pickStr(launcher, ["shape"]) : "") ||
        pickStr(ui ?? {}, ["buttonShape"]) ||
        pickStr(theme ?? {}, ["buttonShape", "button_shape"]),
    ),
    buttonPosition: normalizeButtonPosition(
      (launcher ? pickStr(launcher, ["position"]) : "") ||
        pickStr(ui ?? {}, ["buttonPosition"]) ||
        pickStr(theme ?? {}, ["buttonPosition", "position"]),
    ),
    launcherInsetBottomPx:
      pickNum(launcher ?? ui ?? {}, ["insetBottomPx", "launcherInsetBottomPx"]) ??
      defaultWidgetDraft.launcherInsetBottomPx,
    launcherInsetSidePx:
      pickNum(launcher ?? ui ?? {}, ["insetSidePx", "launcherInsetSidePx"]) ??
      defaultWidgetDraft.launcherInsetSidePx,
    buttonColor: pickStr(colors ?? {}, ["button"]) || pickStr(theme ?? {}, ["primaryColor"]) || defaultWidgetDraft.buttonColor,
    iconDataUrl: resolveLauncherIconDataUrlForDraft({
      buttonIconUrl: pickStr(ui ?? {}, ["buttonIconUrl", "button_icon_url"]),
      launcherIconPreset: pickStr(ui ?? {}, ["launcherIconPreset", "iconPreset"]),
    }),
    buttonHoverColor:
      pickStr(colors ?? {}, ["buttonHover", "button_hover"]) ||
      pickStr(ui ?? {}, ["buttonHoverColor", "button_hover_color"]) ||
      pickStr(theme ?? {}, ["buttonHoverColor", "button_hover_color"]) ||
      defaultWidgetDraft.buttonHoverColor,
    iconColor: pickStr(colors ?? {}, ["icon"]) || defaultWidgetDraft.iconColor,
    launcherIconPreset: normalizeLauncherIconPresetFromApi(
      pickStr(ui ?? {}, ["launcherIconPreset"]),
    ),
    launcherIconEnabled:
      launcher?.iconEnabled === false
        ? false
        : pickBool(ui ?? {}, ["launcherIconEnabled"]) ?? defaultWidgetDraft.launcherIconEnabled ?? true,
    launcherLabelEnabled:
      launcher?.labelEnabled === false
        ? false
        : pickBool(ui ?? {}, ["launcherLabelEnabled"]) ?? defaultWidgetDraft.launcherLabelEnabled ?? true,
    launcherStyle: normalizeLauncherStyle(
      pickStr(launcher ?? ui ?? {}, ["style", "launcherStyle"]),
    ),
    headerTitleAlign: normalizeHeaderAlign(headerAlignRaw),
    headerTitle:
      pickStr(chatBox ?? {}, ["headerTitle"]) ||
      pickStr(ui ?? {}, ["headerTitle"]) ||
      "",
    headerLogoDataUrl:
      pickStr(chatBox ?? ui ?? {}, ["headerLogoUrl", "header_logo_url"]) ||
      defaultWidgetDraft.headerLogoDataUrl ||
      "",
    panelSurfaceStyle: normalizePanelSurfaceStyle(
      pickStr(chatBox ?? ui ?? {}, ["panelSurfaceStyle"]) ||
        pickStr(chat && isRecord(chat.panel) ? chat.panel : {}, ["surfaceStyle"]),
    ),
    bubbleSurfaceStyle: normalizeLauncherStyle(
      pickStr(chatBox ?? ui ?? {}, ["bubbleSurfaceStyle"]) ||
        pickStr(chat && isRecord(chat.bubbles) ? chat.bubbles : {}, ["surfaceStyle"]),
    ),
    agentAvatarEnabled:
      pickBool(ui ?? {}, ["agentAvatarEnabled"]) ??
      pickBool(
        chat && isRecord(chat.avatars) && isRecord(chat.avatars.agent)
          ? chat.avatars.agent
          : {},
        ["enabled"],
      ) ??
      defaultWidgetDraft.agentAvatarEnabled,
    agentAvatarDataUrl:
      pickStr(ui ?? {}, ["agentAvatarUrl"]) ||
      pickStr(
        chat && isRecord(chat.avatars) && isRecord(chat.avatars.agent)
          ? chat.avatars.agent
          : {},
        ["url"],
      ) ||
      "",
    agentAvatarPreset: normalizeAgentAvatarPreset(
      pickStr(
        chat && isRecord(chat.avatars) && isRecord(chat.avatars.agent)
          ? chat.avatars.agent
          : {},
        ["preset"],
      ) || pickStr(ui ?? {}, ["agentAvatarPreset"]),
    ),
    visitorAvatarEnabled:
      pickBool(ui ?? {}, ["visitorAvatarEnabled"]) ??
      pickBool(
        chat && isRecord(chat.avatars) && isRecord(chat.avatars.visitor)
          ? chat.avatars.visitor
          : {},
        ["enabled"],
      ) ??
      defaultWidgetDraft.visitorAvatarEnabled,
    visitorAvatarDataUrl:
      pickStr(ui ?? {}, ["visitorAvatarUrl"]) ||
      pickStr(
        chat && isRecord(chat.avatars) && isRecord(chat.avatars.visitor)
          ? chat.avatars.visitor
          : {},
        ["url"],
      ) ||
      "",
    visitorAvatarPreset: normalizeVisitorAvatarPreset(
      pickStr(
        chat && isRecord(chat.avatars) && isRecord(chat.avatars.visitor)
          ? chat.avatars.visitor
          : {},
        ["preset"],
      ) || pickStr(ui ?? {}, ["visitorAvatarPreset"]),
    ),
    textColor:
      pickStr(colors ?? {}, ["headerText", "header_text"]) ||
      pickStr(djTheme ?? {}, ["textColor", "text_color"]) ||
      pickStr(theme ?? {}, ["textColor", "text_color"]) ||
      defaultWidgetDraft.textColor,
    greetingMessage:
      pickStr(chatBox ?? {}, ["greetingMessage"]) ||
      pickStr(ui ?? {}, ["greetingMessage"]) ||
      pickStr(config ?? {}, ["greetingMessage"]) ||
      defaultWidgetDraft.greetingMessage,
    sendPlaceholder:
      pickStr(chatBox ?? {}, ["sendPlaceholder"]) ||
      pickStr(ui ?? {}, ["sendPlaceholder"]) ||
      pickStr(config ?? {}, ["messagePlaceholder"]) ||
      defaultWidgetDraft.sendPlaceholder,
    bannerOn:
      pickBool(chatBox ?? {}, ["bannerEnabled", "bannerOn"]) ??
      pickBool(ui ?? {}, ["bannerEnabled", "bannerOn"]) ??
      defaultWidgetDraft.bannerOn,
    bannerTitle: pickStr(chatBox ?? ui ?? {}, ["bannerTitle"]) || "",
    bannerDescription: pickStr(chatBox ?? ui ?? {}, ["bannerDescription"]) || "",
    bannerMediaType:
      (pickStr(chatBox ?? ui ?? {}, ["bannerMediaType"]) as WidgetDraft["bannerMediaType"]) ||
      (pickStr(chatBox ?? ui ?? {}, ["bannerVideoUrl", "banner_video_url"])
        ? "video"
        : defaultWidgetDraft.bannerMediaType),
    bannerDataUrl:
      pickStr(chatBox ?? ui ?? {}, ["bannerVideoUrl", "banner_video_url"]) ||
      pickStr(chatBox ?? ui ?? {}, ["bannerImageUrl", "banner_image_url"]) ||
      defaultWidgetDraft.bannerDataUrl,
    bannerHeightPx:
      pickNum(behavior ?? {}, ["bannerHeightPx"]) ?? defaultWidgetDraft.bannerHeightPx,
    bannerCtaLabel:
      pickStr(behavior ?? {}, ["bannerCtaLabel"]) || defaultWidgetDraft.bannerCtaLabel,
    bannerCtaHref:
      pickStr(behavior ?? {}, ["bannerCtaHref"]) || defaultWidgetDraft.bannerCtaHref,
    headerLogoHeightPx:
      pickNum(behavior ?? {}, ["headerLogoHeightPx"]) ?? defaultWidgetDraft.headerLogoHeightPx,
    videoWelcomeHeightPx:
      pickNum(behavior ?? {}, ["videoWelcomeHeightPx"]) ?? defaultWidgetDraft.videoWelcomeHeightPx,
    boxWidth: pickNum(chatBox ?? ui ?? {}, ["boxWidth", "width"]) ?? defaultWidgetDraft.boxWidth,
    boxHeight: pickNum(chatBox ?? ui ?? {}, ["boxHeight", "height"]) ?? defaultWidgetDraft.boxHeight,
    buttonLabel:
      pickStrAllowEmpty(ui ?? {}, ["buttonLabel"]) ?? defaultWidgetDraft.buttonLabel,
    proactiveTeaserEnabled:
      pickBool(ui ?? {}, ["proactiveTeaserEnabled"]) ?? defaultWidgetDraft.proactiveTeaserEnabled,
    proactiveTeaser:
      pickStr(ui ?? {}, ["proactiveTeaser"]) || defaultWidgetDraft.proactiveTeaser,
    proactiveTeaserAvatarEnabled:
      pickBool(ui ?? {}, ["proactiveTeaserAvatarEnabled"]) ??
      defaultWidgetDraft.proactiveTeaserAvatarEnabled,
    panelGreetingEnabled:
      pickBool(ui ?? {}, ["panelGreetingEnabled"]) ?? defaultWidgetDraft.panelGreetingEnabled,
    chatWelcomeEnabled:
      pickBool(ui ?? {}, ["chatWelcomeEnabled"]) ?? defaultWidgetDraft.chatWelcomeEnabled,
    proactiveTeaserAvatarDataUrl: pickStr(ui ?? {}, ["proactiveTeaserAvatarUrl"]) || "",
    proactiveSecondaryCtaEnabled:
      pickBool(ui ?? {}, ["proactiveSecondaryCtaEnabled"]) ??
      defaultWidgetDraft.proactiveSecondaryCtaEnabled,
    proactiveSecondaryCtaLabel:
      pickStr(ui ?? {}, ["proactiveSecondaryCtaLabel"]) ||
      defaultWidgetDraft.proactiveSecondaryCtaLabel,
    proactiveSecondaryCtaHref:
      pickStr(ui ?? {}, ["proactiveSecondaryCtaHref"]) ||
      defaultWidgetDraft.proactiveSecondaryCtaHref,
    proactiveSecondaryCtaKind:
      (pickStr(ui ?? {}, ["proactiveSecondaryCtaKind"]) as WidgetDraft["proactiveSecondaryCtaKind"]) ||
      defaultWidgetDraft.proactiveSecondaryCtaKind,
    closedMessagePreviewEnabled:
      pickBool(ui ?? {}, ["closedMessagePreviewEnabled"]) ??
      defaultWidgetDraft.closedMessagePreviewEnabled,
    motionEnabled: pickBool(behavior ?? {}, ["motionEnabled"]) ?? defaultWidgetDraft.motionEnabled,
    firstMessage: pickStr(ui ?? {}, ["firstMessage"]) || defaultWidgetDraft.firstMessage,
    messagePlaceholder: pickStr(ui ?? {}, ["messagePlaceholder"]) || defaultWidgetDraft.messagePlaceholder,
    backgroundColor:
      pickStr(colors ?? {}, ["panelBackground", "panel_background"]) ||
      pickStr(djTheme ?? {}, ["panelBackground", "panel_background"]) ||
      pickStr(djUi ?? {}, ["backgroundColor"]) ||
      pickStr(ui ?? {}, ["backgroundColor"]) ||
      defaultWidgetDraft.backgroundColor,
    popupEnabled: pickBool(ui ?? {}, ["popupEnabled"]) ?? defaultWidgetDraft.popupEnabled,
    botEnabled: pickBool(behavior ?? {}, ["botEnabled"]) ?? defaultWidgetDraft.botEnabled,
    notificationEnabled:
      pickBool(behavior ?? {}, ["notificationEnabled"]) ?? defaultWidgetDraft.notificationEnabled,
    browserNotification:
      pickBool(behavior ?? {}, ["browserNotification"]) ?? defaultWidgetDraft.browserNotification,
    soundNotification: pickBool(behavior ?? {}, ["soundNotification"]) ?? defaultWidgetDraft.soundNotification,
    fallbackNotificationText:
      pickStr(behavior ?? {}, ["fallbackNotificationText"]) || defaultWidgetDraft.fallbackNotificationText,
    videoWelcomeOn: pickBool(behavior ?? {}, ["videoWelcomeOn"]) ?? defaultWidgetDraft.videoWelcomeOn,
    videoWelcomeUrl:
      pickStr(behavior ?? {}, ["videoWelcomeUrl", "video_welcome_url"]) ||
      defaultWidgetDraft.videoWelcomeUrl,
    welcomeMessageBehavior:
      pickStr(behavior ?? {}, ["welcomeMessage"]) || defaultWidgetDraft.welcomeMessageBehavior,
    autoOpenEnabled: pickBool(behavior ?? {}, ["autoOpenEnabled"]) ?? defaultWidgetDraft.autoOpenEnabled,
    autoOpenDelaySeconds:
      pickNum(behavior ?? {}, ["autoOpenDelaySeconds"]) ??
      pickNum(config ?? {}, ["autoPopupDelaySeconds"]) ??
      defaultWidgetDraft.autoOpenDelaySeconds,
    autoOpenOnReturnVisit:
      pickBool(behavior ?? {}, ["autoOpenOnReturnVisit", "autoOpenReturnVisit"]) ??
      defaultWidgetDraft.autoOpenOnReturnVisit,
    notificationSoundId: normalizeWidgetSoundId(
      pickStr(behavior ?? {}, ["notificationSoundId", "soundId"]) ||
        defaultWidgetDraft.notificationSoundId,
    ),
    launcherBadgeMode: normalizeLauncherBadgeMode(
      pickStr(behavior ?? {}, ["launcherBadgeMode", "launcherBadge"]) ||
        defaultWidgetDraft.launcherBadgeMode,
    ),
    fileUploadEnabled:
      pickBool(behavior ?? {}, ["fileUploadEnabled"]) ??
      pickBool(config ?? {}, ["fileUploadEnabled"]) ??
      defaultWidgetDraft.fileUploadEnabled,
    emojiEnabled:
      pickBool(behavior ?? {}, ["emojiEnabled"]) ??
      pickBool(config ?? {}, ["emojiEnabled"]) ??
      defaultWidgetDraft.emojiEnabled,
    consentRequired: pickBool(behavior ?? {}, ["consentRequired"]) ?? defaultWidgetDraft.consentRequired,
    consentText:
      pickStr(behavior ?? {}, ["consentText"]) ||
      pickStr(config ?? {}, ["consentText"]) ||
      defaultWidgetDraft.consentText,
    privacyPolicyUrl:
      pickStr(behavior ?? {}, ["privacyPolicyUrl"]) ||
      pickStr(config ?? {}, ["privacyPolicyUrl"]) ||
      defaultWidgetDraft.privacyPolicyUrl,
    privacyNotice: pickStr(behavior ?? {}, ["privacyNotice"]) || defaultWidgetDraft.privacyNotice,
    allowedDomainsText:
      (allowedDomains?.length ? allowedDomains.join(", ") : "") ||
      pickStr(behavior ?? {}, ["allowedDomainsText"]) ||
      defaultWidgetDraft.allowedDomainsText,
    inquiryOn: inquiryOptions != null ? inquiryOptions.length > 0 : defaultWidgetDraft.inquiryOn,
    inquiryRequired: pickBool(behavior ?? {}, ["inquiryRequired"]) ?? false,
    inquirySkipLabel:
      pickStr(behavior ?? {}, ["inquirySkipLabel"]) || defaultWidgetDraft.inquirySkipLabel,
    inquiryFallbackRoutingKey:
      pickStr(behavior ?? {}, ["inquiryFallbackRoutingKey"]) ||
      defaultWidgetDraft.inquiryFallbackRoutingKey,
    inquiryOptions: inquiryOptions?.length ? inquiryOptions : defaultWidgetDraft.inquiryOptions,
    persistVisitorSession:
      pickBool(session ?? {}, ["persistVisitorSession"]) ?? defaultWidgetDraft.persistVisitorSession,
    sessionTtlMinutes:
      pickNum(session ?? {}, ["sessionTtlMinutes", "session_ttl_minutes"]) ??
      pickNum(config ?? {}, ["expiresInMinutes"]) ??
      defaultWidgetDraft.sessionTtlMinutes,
    formEnabled:
      pickBool(form ?? {}, ["enabled"]) ??
      defaultWidgetDraft.formEnabled,
    formTitle:
      pickStr(form ?? {}, ["title"]) ||
      pickStr(config ?? {}, ["preChatFormText"]) ||
      defaultWidgetDraft.formTitle,
    formSubtitle: pickStr(form ?? {}, ["subtitle"]) || defaultWidgetDraft.formSubtitle,
    formSubmitLabel: pickStr(form ?? {}, ["submitLabel", "submit_label"]) || defaultWidgetDraft.formSubmitLabel,
    prechatNameEnabled:
      pickBool(form ?? {}, ["prechatNameEnabled"]) ??
      pickBool(config ?? {}, ["prechatNameEnabled"]) ??
      defaultWidgetDraft.prechatNameEnabled,
    prechatEmailEnabled:
      pickBool(form ?? {}, ["prechatEmailEnabled"]) ??
      pickBool(config ?? {}, ["prechatEmailEnabled"]) ??
      defaultWidgetDraft.prechatEmailEnabled,
    prechatPhoneEnabled:
      pickBool(form ?? {}, ["prechatPhoneEnabled"]) ??
      pickBool(config ?? {}, ["prechatPhoneEnabled"]) ??
      defaultWidgetDraft.prechatPhoneEnabled,
    prechatMessageEnabled:
      pickBool(form ?? {}, ["prechatMessageEnabled"]) ??
      pickBool(config ?? {}, ["prechatMessageEnabled"]) ??
      defaultWidgetDraft.prechatMessageEnabled,
    prechatMessageRequired:
      pickBool(form ?? {}, ["prechatMessageRequired"]) ??
      pickBool(config ?? {}, ["prechatMessageRequired"]) ??
      defaultWidgetDraft.prechatMessageRequired,
    offlineFormEnabled:
      pickBool(offlineForm ?? {}, ["enabled"]) ??
      pickBool(config ?? {}, ["offlineFormEnabled"]) ??
      defaultWidgetDraft.offlineFormEnabled,
    offlineFormTitle:
      pickStr(offlineForm ?? {}, ["title"]) || defaultWidgetDraft.offlineFormTitle,
    offlineFormSubtitle:
      pickStr(offlineForm ?? {}, ["subtitle"]) || defaultWidgetDraft.offlineFormSubtitle,
    offlineFormSubmitLabel:
      pickStr(offlineForm ?? {}, ["submitLabel", "submit_label"]) ||
      defaultWidgetDraft.offlineFormSubmitLabel,
    offlinePrechatNameEnabled:
      pickBool(offlineForm ?? {}, ["prechatNameEnabled"]) ??
      defaultWidgetDraft.offlinePrechatNameEnabled,
    offlinePrechatEmailEnabled:
      pickBool(offlineForm ?? {}, ["prechatEmailEnabled"]) ??
      defaultWidgetDraft.offlinePrechatEmailEnabled,
    offlinePrechatPhoneEnabled:
      pickBool(offlineForm ?? {}, ["prechatPhoneEnabled"]) ??
      defaultWidgetDraft.offlinePrechatPhoneEnabled,
    offlinePrechatMessageEnabled:
      pickBool(offlineForm ?? {}, ["prechatMessageEnabled"]) ??
      defaultWidgetDraft.offlinePrechatMessageEnabled,
    offlinePrechatMessageRequired:
      pickBool(offlineForm ?? {}, ["prechatMessageRequired"]) ??
      defaultWidgetDraft.offlinePrechatMessageRequired,
    responseWelcomeMessage:
      pickStr(response ?? {}, ["welcomeMessage"]) ||
      pickStr(config ?? {}, ["welcomeMessage"]) ||
      defaultWidgetDraft.responseWelcomeMessage,
    responseOfflineMessage:
      pickStr(response ?? {}, ["offlineMessage"]) ||
      pickStr(config ?? {}, ["offlineMessage"]) ||
      defaultWidgetDraft.responseOfflineMessage,
    responseGreetingMessage:
      pickStr(response ?? {}, ["greetingMessage"]) ||
      pickStr(config ?? {}, ["greetingMessage"]) ||
      defaultWidgetDraft.responseGreetingMessage,
    responseSendPlaceholder:
      pickStr(response ?? {}, ["sendPlaceholder"]) || defaultWidgetDraft.responseSendPlaceholder,
    responseAiPromptHint: pickStr(response ?? {}, ["aiPromptHint"]) || defaultWidgetDraft.responseAiPromptHint,
    responseTalkToAgentEnabled:
      pickBool(response ?? {}, ["agentTalkToAgentEnabled", "agentHandoverEnabled"]) ??
      pickBool(config ?? {}, ["callHandoverEnabled"]) ??
      defaultWidgetDraft.responseTalkToAgentEnabled,
    responseTalkToAgentTriggerText:
      pickStr(response ?? {}, ["talkToAgentTriggerText", "handoverTriggerText"]) ||
      defaultWidgetDraft.responseTalkToAgentTriggerText,
  };

  if (colors) {
    const headerFallback =
      pickStr(colors, ["headerText", "header_text"]) || patch.textColor || defaultWidgetDraft.textColor;
    Object.assign(patch, widgetChatColorsDraftToPatch(mapApiChatColorsToDraft(colors, headerFallback)));
    const panelBg = pickStr(colors, ["panelBackground", "panel_background"]);
    if (panelBg) patch.backgroundColor = panelBg;
    const secondary = pickStr(colors, ["secondary"]);
    if (secondary) patch.themeSecondaryColor = secondary;
  }

  return patch;
}
