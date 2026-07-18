import {
  normalizeAgentAvatarPreset,
  normalizeVisitorAvatarPreset,
} from "@/lib/chat-widget/chat-avatar-presets";
import type { LauncherIconPresetId } from "@/lib/chat-widget/widgetDraft";
import { normalizeLauncherIconPreset } from "@/lib/chat-widget/launcher-icon-presets";
import {
  normalizeLauncherStyle,
  normalizePanelSurfaceStyle,
  type WidgetLauncherStyleId,
} from "@/lib/chat-widget/launcher-style";
import {
  normalizeDesignAccent,
  normalizeDesignDensity,
  resolveAccentPalette,
  resolveDensityTokens,
  type AccentPalette,
  type DesignAccentId,
  type DesignDensityId,
  type DensityTokens,
} from "@/lib/chat-widget/design-accent-density";
import {
  mixHex,
  pickReadableText,
  resolveWidgetColorTokens,
  type ResolvedWidgetColors,
} from "./widget-color-tokens";
import {
  isPrechatFormEnabled,
  runtimeBoolFirst,
  runtimeBoolFlag,
  runtimeNumFlag,
} from "./widget-config-flags";
import {
  normalizeWidgetInquiryOptions,
  toRuntimeInquiryOptions,
  type RuntimeInquiryOption,
} from "@/lib/chat-widget/widget-inquiry.types";
import {
  configRecordFromEnvelope,
  inquiryFallbackFromExperience,
  inquiryOptionsFromExperience,
  parseWidgetExperienceV1,
} from "./widget-experience";
import { DEFAULT_TALK_TO_AGENT_BUTTON_LABEL } from "@/lib/chat-widget/talk-to-agent.constants";
import type { WidgetConfigEnvelope } from "./widget-types";
import {
  normalizeLauncherBadgeMode,
  normalizeWidgetSoundId,
  type WidgetLauncherBadgeMode,
  type WidgetSoundId,
} from "./widget-notifications";
import {
  resolveProactiveTeaser,
  resolvePanelGreetingCopy,
  resolveChatWelcomeCopy,
} from "@/lib/chat-widget/widget-feature-toggles";

/** `settings.ui.buttonIconUrl` wins; explicit "" clears a stale designJson launcher icon. */
function resolveLauncherCustomIconUrl(
  uiIcon: unknown,
  rootIcon: unknown,
  designLauncherIcon: unknown,
): string {
  if (typeof uiIcon === "string") return uiIcon.trim();
  if (typeof rootIcon === "string" && rootIcon.trim()) return rootIcon.trim();
  if (typeof designLauncherIcon === "string") return designLauncherIcon.trim();
  return "";
}
import type { ProactiveSecondaryCta } from "@/lib/chat-widget/proactive-teaser-types";

export interface RuntimeLauncherAppearance {
  /** `config.ctaButtonText` / `ui.buttonLabel` — FAB accessibility label. */
  buttonLabel: string;
  /** Invitation bubble above FAB when widget is closed (not unread preview). */
  proactiveTeaserActive: boolean;
  proactiveTeaser: string;
  proactiveTeaserAvatarUrl: string;
  proactiveSecondaryCta: ProactiveSecondaryCta;
  position: "left" | "center" | "right";
  /** When `top`, FAB + panel anchor from viewport top (Text Us / custom placement). */
  verticalAnchor?: "top" | "bottom";
  shape: string;
  insetBottomPx: number;
  insetTopPx?: number;
  insetSidePx: number;
  iconPreset: LauncherIconPresetId;
  /** When false, launcher shows label only (no icon glyph). */
  iconEnabled: boolean;
  /** Published `ui.buttonIconUrl` — overrides preset when set. */
  iconUrl: string;
  buttonColor: string;
  buttonHoverColor: string;
  iconColor: string;
  style: WidgetLauncherStyleId;
  /** Optional glow halo color when `style` is glow. */
  glowColor?: string;
}

export interface RuntimeChatBoxAppearance {
  headerTitle: string;
  headerLogoUrl: string;
  headerLogoHeightPx: number;
  headerLogoMaxWidthPx?: number;
  headerAlign: "left" | "center" | "right";
  headerBg: string;
  headerTextColor: string;
  greetingMessage: string;
  sendPlaceholder: string;
  backgroundColor: string;
  boxWidth: number;
  boxHeight: number;
  fontFamily: string;
}

export interface RuntimeFormAppearance {
  title: string;
  subtitle: string;
  submitLabel: string;
}

export interface RuntimeBannerAppearance {
  enabled: boolean;
  title: string;
  description: string;
  imageUrl: string;
  videoUrl: string;
  mediaType: string;
  heightPx: number;
  ctaLabel: string;
  ctaHref: string;
}

export interface RuntimeVideoWelcomeAppearance {
  enabled: boolean;
  url: string;
  heightPx: number;
}

/** Greeting bubble shown before the pre-chat form in the embed widget. */
export function resolveEmbedGreetingMessage(
  appearance: RuntimeChatAppearance,
  fallbackWelcome?: string,
): string {
  return (
    appearance.chatBox.greetingMessage.trim() ||
    appearance.panelGreetingMessage.trim() ||
    appearance.welcomeMessage.trim() ||
    (fallbackWelcome ?? "").trim()
  );
}

export interface RuntimeChatAvatarAppearance {
  enabled: boolean;
  url: string;
  preset: string;
}

export interface RuntimeChatAppearance {
  launcher: RuntimeLauncherAppearance;
  chatBox: RuntimeChatBoxAppearance;
  /** Panel shell style — separate from launcher FAB. */
  panelSurfaceStyle: WidgetLauncherStyleId;
  /** Message bubble surface style. */
  bubbleSurfaceStyle: WidgetLauncherStyleId;
  avatars: {
    agent: RuntimeChatAvatarAppearance;
    visitor: RuntimeChatAvatarAppearance;
  };
  colors: ResolvedWidgetColors;
  /** Welcome / continue step copy (`config.welcomeMessage`, `response.welcomeMessage`). */
  welcomeMessage: string;
  /** Intro bubble in chat (`config.greetingMessage`, `chatBox`, `ui`). */
  panelGreetingMessage: string;
  /** First agent line after pre-chat (`ui.firstMessage`, `config.firstMessage`). */
  firstMessage: string;
  offlineMessage: string;
  bodyTextColor: string;
  mutedTextColor: string;
  borderRadiusPx: number;
  /** Message bubble corner radius — separate from panel `borderRadiusPx`. */
  bubbleBorderRadiusPx: number;
  bubbleStyle: string;
  form: RuntimeFormAppearance;
  formEnabled: boolean;
  offlineForm: RuntimeFormAppearance;
  offlineFormEnabled: boolean;
  banner: RuntimeBannerAppearance;
  videoWelcome: RuntimeVideoWelcomeAppearance;
  inquiryOptions: RuntimeInquiryOption[];
  inquiryEnabled: boolean;
  inquiryRequired: boolean;
  inquirySkipLabel: string;
  inquiryFallback: RuntimeInquiryOption | null;
  talkToAgentTriggerText: string;
  agentTalkToAgentEnabled: boolean;
  botEnabled: boolean;
  consentRequired: boolean;
  consentText: string;
  privacyPolicyUrl: string;
  privacyNotice: string;
  fileUploadEnabled: boolean;
  emojiEnabled: boolean;
  autoOpenEnabled: boolean;
  autoOpenDelaySeconds: number;
  /** When false, auto-open only on first site visit (localStorage marker). */
  autoOpenOnReturnVisit: boolean;
  notificationEnabled: boolean;
  soundNotification: boolean;
  notificationSoundId: WidgetSoundId;
  launcherBadgeMode: WidgetLauncherBadgeMode;
  fallbackNotificationText: string;
  closedMessagePreviewEnabled: boolean;
  motionEnabled: boolean;
  /** `theme.designJson.accent` / `density` — panel spacing + accent family. */
  designAccent: DesignAccentId;
  designDensity: DesignDensityId;
  accentPalette: AccentPalette;
  densityTokens: DensityTokens;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function strFirst(...candidates: unknown[]): string {
  for (const c of candidates) {
    const s = str(c, "");
    if (s) return s;
  }
  return "";
}

/** Visible launcher label — empty string is valid (icon-only FAB). */
function resolveLauncherVisibleLabel(
  configRecord: Record<string, unknown>,
  ui: unknown,
  djUi: unknown,
  djLauncher?: unknown,
): string {
  const labelDisabled =
    (isObj(ui) && ui.launcherLabelEnabled === false) ||
    (isObj(djUi) && djUi.launcherLabelEnabled === false) ||
    (isObj(djLauncher) && djLauncher.labelEnabled === false);
  if (labelDisabled) return "";
  if (isObj(ui) && typeof ui.buttonLabel === "string") return ui.buttonLabel.trim();
  if (isObj(djUi) && typeof djUi.buttonLabel === "string") return djUi.buttonLabel.trim();
  if (typeof configRecord.ctaButtonText === "string") {
    return String(configRecord.ctaButtonText).trim();
  }
  return "";
}

function numFirst(...candidates: unknown[]): number | undefined {
  for (const c of candidates) {
    const n = typeof c === "number" ? c : typeof c === "string" ? Number.parseFloat(c) : NaN;
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function clampInt(raw: unknown, fallback: number, min: number, max: number): number {
  const n = numFirst(raw) ?? fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function normalizePosition(raw: string): RuntimeLauncherAppearance["position"] {
  const s = raw.toLowerCase();
  if (s === "left") return "left";
  if (s === "center") return "center";
  return "right";
}

function normalizeHeaderAlign(raw: string): RuntimeChatBoxAppearance["headerAlign"] {
  const s = raw.toLowerCase();
  if (s === "left") return "left";
  if (s === "right") return "right";
  return "center";
}

function normalizeIconPreset(raw: string): LauncherIconPresetId {
  return normalizeLauncherIconPreset(raw, "phosphor-chat-circle");
}

function readDesignJson(cfg: Record<string, unknown>): Record<string, unknown> | null {
  const theme = isObj(cfg.theme) ? cfg.theme : null;
  return theme && isObj(theme.designJson) ? theme.designJson : null;
}

/** Deep-merge `settingsJson` slices without replacing `theme` or wiping partial `ui`. */
function mergeSettingsJsonIntoConfig(
  cfg: Record<string, unknown>,
  settingsJson: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(settingsJson)) {
    if (key === "settingsJson" || key === "theme") continue;
    if (isObj(value) && isObj(cfg[key])) {
      cfg[key] = { ...(cfg[key] as Record<string, unknown>), ...value };
    } else if (value !== undefined) {
      cfg[key] = value;
    }
  }
}

/** Hoist `theme.designJson.{ui,form,behavior,response}` onto config root for runtime mappers. */
function hoistDesignJsonSections(cfg: Record<string, unknown>): Record<string, unknown> {
  const dj = readDesignJson(cfg);
  if (!dj) return cfg;

  const out = { ...cfg };
  const hoist = (key: string) => {
    const fromDj = dj[key];
    const existing = out[key];
    if (isObj(fromDj)) {
      out[key] = isObj(existing) ? { ...fromDj, ...existing } : { ...fromDj };
    }
  };

  hoist("ui");
  hoist("form");
  hoist("behavior");
  hoist("response");
  hoist("session");

  if (isObj(dj.theme)) {
    out._designThemeTokens = dj.theme;
  }

  return out;
}

function parseInquiryOptions(
  behavior: Record<string, unknown> | null,
): RuntimeInquiryOption[] {
  return toRuntimeInquiryOptions(normalizeWidgetInquiryOptions(behavior?.inquiryOptions));
}

/** Merge config from public config / snapshot-like shapes into one record for appearance + prechat. */
export function resolveRuntimeConfigRecord(envelope: WidgetConfigEnvelope): Record<string, unknown> {
  const root: Record<string, unknown> = {
    widgetKey: envelope.widgetKey,
    websiteId: envelope.websiteId,
    widgetType: envelope.widgetType,
    chatMode: envelope.chatMode,
    allowedDomains: envelope.allowedDomains,
  };

  const cfg = configRecordFromEnvelope(envelope);

  const settingsJson = cfg.settingsJson;
  if (isObj(settingsJson)) {
    mergeSettingsJsonIntoConfig(cfg, settingsJson);
    delete cfg.settingsJson;
  }

  return hoistDesignJsonSections({ ...root, ...cfg });
}

/**
 * Read published widget config (`theme.designJson` + hoisted ui/form/behavior).
 */
export function extractRuntimeChatAppearance(
  configRecord: Record<string, unknown>,
): RuntimeChatAppearance {
  const theme = isObj(configRecord.theme) ? configRecord.theme : null;
  const ui = isObj(configRecord.ui) ? configRecord.ui : null;
  const behavior = isObj(configRecord.behavior) ? configRecord.behavior : null;
  const response = isObj(configRecord.response) ? configRecord.response : null;
  const formCfg = isObj(configRecord.form) ? configRecord.form : null;
  const offlineFormCfg = isObj(configRecord.offlineForm) ? configRecord.offlineForm : null;

  const dj = readDesignJson(configRecord);
  const designAccent = normalizeDesignAccent(typeof dj?.accent === "string" ? dj.accent : undefined);
  const designDensity = normalizeDesignDensity(typeof dj?.density === "string" ? dj.density : undefined);
  const accentPalette = resolveAccentPalette(designAccent);
  const densityTokens = resolveDensityTokens(designDensity);
  const djUi = dj && isObj(dj.ui) ? dj.ui : null;
  const djBehavior = dj && isObj(dj.behavior) ? dj.behavior : null;
  const chat = dj && isObj(dj.chat) ? dj.chat : null;
  const launcher = chat && isObj(chat.launcher) ? chat.launcher : null;
  const chatPanel = chat && isObj(chat.panel) ? chat.panel : null;
  const chatBubbles = chat && isObj(chat.bubbles) ? chat.bubbles : null;
  const chatAvatars = chat && isObj(chat.avatars) ? chat.avatars : null;
  const chatAgentAvatar =
    chatAvatars && isObj(chatAvatars.agent) ? chatAvatars.agent : null;
  const chatVisitorAvatar =
    chatAvatars && isObj(chatAvatars.visitor) ? chatAvatars.visitor : null;
  const chatBox = chat && isObj(chat.chatBox) ? chat.chatBox : null;
  const colors = chat && isObj(chat.colors) ? chat.colors : null;
  const experience = parseWidgetExperienceV1(configRecord._experience);
  const expPanel =
    experience && isObj(experience.design.panel) ? experience.design.panel : null;
  const expBubbles =
    experience && isObj(experience.design.bubbles) ? experience.design.bubbles : null;
  const expAvatars =
    experience && isObj(experience.design.avatars) ? experience.design.avatars : null;
  const expAgentAvatar =
    expAvatars && isObj(expAvatars.agent) ? expAvatars.agent : null;
  const expVisitorAvatar =
    expAvatars && isObj(expAvatars.visitor) ? expAvatars.visitor : null;
  const expLauncher =
    experience && isObj(experience.design.launcher) ? experience.design.launcher : null;
  const designTokens =
    (isObj(configRecord._designThemeTokens) ? configRecord._designThemeTokens : null) ??
    (dj && isObj(dj.theme) ? dj.theme : null);

  const resolvedColors = resolveWidgetColorTokens({
    theme,
    chatColors: colors,
    designTheme: designTokens,
    ui,
  });

  const expChatColors =
    experience && isObj(experience.design.chatColors)
      ? experience.design.chatColors
      : null;

  const buttonColor = resolvedColors.primary;
  const buttonHover = strFirst(
    colors?.buttonHover,
    colors?.button_hover,
    expChatColors?.buttonHover,
    expChatColors?.button_hover,
    ui?.buttonHoverColor,
    theme?.buttonHoverColor,
    buttonColor,
  );
  const iconColor = strFirst(
    colors?.icon,
    theme?.textColor,
    designTokens?.iconColor,
    resolvedColors.outgoingBubbleText,
  );
  const headerTextColor = resolvedColors.headerText;
  const bodyTextColor = resolvedColors.bodyText;
  const mutedTextColor = resolvedColors.mutedText;

  const rawGreetingMessage = strFirst(
    configRecord.greetingMessage,
    chatBox?.greetingMessage,
    ui?.greetingMessage,
    behavior?.welcomeMessage,
    "How can we help?",
  );

  const panelGreetingMessage = resolvePanelGreetingCopy(
    rawGreetingMessage,
    { ...ui, ...djUi, panelGreetingEnabled: ui?.panelGreetingEnabled },
  );

  const welcomeMessage = strFirst(
    response?.welcomeMessage,
    configRecord.welcomeMessage,
    behavior?.welcomeMessage,
    panelGreetingMessage,
  );

  const borderRadiusPx = resolvedColors.borderRadiusPx;
  const bubbleBorderRadiusPx = Math.max(
    0,
    numFirst(djBehavior?.bubbleBorderRadiusPx, behavior?.bubbleBorderRadiusPx) ?? borderRadiusPx,
  );
  const bubbleStyle = strFirst(theme?.bubbleStyle, designTokens?.bubbleStyle, "rounded");

  const agentTalkToAgentEnabled = runtimeBoolFirst(
    true,
    response?.agentTalkToAgentEnabled,
    response?.agentHandoverEnabled,
    response?.responseTalkToAgentEnabled,
    configRecord.callHandoverEnabled,
    configRecord.agentHandoverEnabled,
  );

  const autoOpenEnabled = runtimeBoolFirst(
    false,
    behavior?.autoOpenEnabled,
    ui?.popupEnabled,
    configRecord.autoPopupEnabled,
  );

  const autoOpenDelaySeconds = Math.min(
    300,
    Math.max(
      0,
      runtimeNumFlag(
        configRecord.autoPopupDelaySeconds,
        runtimeNumFlag(behavior?.autoOpenDelaySeconds, 10),
      ),
    ),
  );

  const notificationEnabled = runtimeBoolFirst(
    true,
    behavior?.notificationEnabled,
    behavior?.browserNotification,
  );
  const soundNotification = behavior?.soundNotification === true;
  const notificationSoundId = normalizeWidgetSoundId(
    behavior?.notificationSoundId ?? behavior?.soundId,
  );
  const launcherBadgeMode = normalizeLauncherBadgeMode(
    behavior?.launcherBadgeMode ?? behavior?.launcherBadge,
  );
  const fallbackNotificationText = strFirst(
    behavior?.fallbackNotificationText,
    behavior?.fallbackNotification,
    configRecord.fallbackNotificationText,
    "You have a new message from support.",
  );
  const closedMessagePreviewEnabled = runtimeBoolFirst(
    true,
    ui?.closedMessagePreviewEnabled,
    djUi?.closedMessagePreviewEnabled,
    configRecord.closedMessagePreviewEnabled,
  );
  const autoOpenOnReturnVisit =
    behavior?.autoOpenOnReturnVisit === true || behavior?.autoOpenReturnVisit === true;

  return {
    colors: resolvedColors,
    welcomeMessage,
    panelGreetingMessage,
    firstMessage: resolveChatWelcomeCopy(
      strFirst(ui?.firstMessage, configRecord.firstMessage, chatBox?.firstMessage, ""),
      { ...ui, ...djUi },
    ),
    offlineMessage: strFirst(
      response?.offlineMessage,
      configRecord.offlineMessage,
      configRecord.offlineFormMessage,
      "",
    ),
    bodyTextColor,
    mutedTextColor,
    borderRadiusPx,
    bubbleBorderRadiusPx,
    bubbleStyle,
    formEnabled: isPrechatFormEnabled(configRecord),
    talkToAgentTriggerText: strFirst(
      response?.talkToAgentTriggerText,
      response?.handoverTriggerText,
      response?.handover_trigger_text,
      behavior?.talkToAgentTriggerText,
      behavior?.handoverTriggerText,
      DEFAULT_TALK_TO_AGENT_BUTTON_LABEL,
    ),
    agentTalkToAgentEnabled,
    botEnabled: runtimeBoolFlag(behavior?.botEnabled, true),
    consentRequired: runtimeBoolFirst(
      Boolean(strFirst(configRecord.consentText, behavior?.consentText, formCfg?.consentText)),
      behavior?.consentRequired,
      configRecord.consentRequired,
    ),
    consentText: strFirst(
      configRecord.consentText,
      behavior?.consentText,
      formCfg?.consentText,
      "I agree to the chat terms and privacy policy.",
    ),
    privacyPolicyUrl: strFirst(
      configRecord.privacyPolicyUrl,
      behavior?.privacyPolicyUrl,
      formCfg?.privacyPolicyUrl,
      "",
    ),
    privacyNotice: strFirst(behavior?.privacyNotice, configRecord.privacyNotice, ""),
    fileUploadEnabled: runtimeBoolFirst(
      true,
      configRecord.fileUploadEnabled,
      behavior?.fileUploadEnabled,
    ),
    emojiEnabled: runtimeBoolFirst(true, configRecord.emojiEnabled, behavior?.emojiEnabled),
    autoOpenEnabled,
    autoOpenDelaySeconds,
    autoOpenOnReturnVisit,
    notificationEnabled,
    soundNotification,
    notificationSoundId,
    launcherBadgeMode,
    fallbackNotificationText,
    closedMessagePreviewEnabled,
    motionEnabled: behavior?.motionEnabled !== false,
    designAccent,
    designDensity,
    accentPalette,
    densityTokens,
    inquiryEnabled: (() => {
      const chatMode = String(configRecord.mode ?? configRecord.chatMode ?? "").toUpperCase();
      if (chatMode === "AI_ONLY") return false;
      const exp = parseWidgetExperienceV1(configRecord._experience);
      if (exp) return exp.inquiry.enabled === true;
      if (
        behavior?.inquiryOptions !== undefined &&
        Array.isArray(behavior.inquiryOptions) &&
        behavior.inquiryOptions.length === 0
      ) {
        return false;
      }
      return parseInquiryOptions(behavior).length > 0;
    })(),
    inquiryOptions: (() => {
      const chatMode = String(configRecord.mode ?? configRecord.chatMode ?? "").toUpperCase();
      if (chatMode === "AI_ONLY") return [];
      const exp = parseWidgetExperienceV1(configRecord._experience);
      if (exp) {
        if (!exp.inquiry.enabled) return [];
        const fromExp = inquiryOptionsFromExperience(exp);
        if (fromExp.length > 0) return fromExp;
      }
      if (
        behavior?.inquiryOptions !== undefined &&
        Array.isArray(behavior.inquiryOptions) &&
        behavior.inquiryOptions.length === 0
      ) {
        return [];
      }
      return parseInquiryOptions(behavior);
    })(),
    inquiryRequired: (() => {
      const exp = parseWidgetExperienceV1(configRecord._experience);
      if (exp) return exp.inquiry.required;
      return behavior?.inquiryRequired === true;
    })(),
    inquirySkipLabel: strFirst(
      behavior?.inquirySkipLabel,
      "General question",
    ),
    inquiryFallback: (() => {
      const exp = parseWidgetExperienceV1(configRecord._experience);
      if (exp) return inquiryFallbackFromExperience(exp);
      const key = strFirst(behavior?.inquiryFallbackRoutingKey);
      const opts = parseInquiryOptions(behavior);
      if (key) {
        return opts.find((o) => o.routingKey === key) ?? opts[0] ?? null;
      }
      return (
        opts.find(
          (o) => o.internalDepartmentId?.trim() || o.externalDepartmentId?.trim(),
        ) ??
        opts[0] ??
        null
      );
    })(),
    form: {
      title: strFirst(formCfg?.title, configRecord.preChatFormText, "Before we start"),
      subtitle: strFirst(formCfg?.subtitle, "Tell us who you are"),
      submitLabel: strFirst(formCfg?.submitLabel, "Start chat"),
    },
    offlineFormEnabled: (() => {
      const exp = parseWidgetExperienceV1(configRecord._experience);
      if (exp && isObj(exp.offlineForm)) {
        return exp.offlineForm.enabled !== false;
      }
      if (offlineFormCfg && "enabled" in offlineFormCfg) {
        return runtimeBoolFlag(offlineFormCfg.enabled, true);
      }
      return configRecord.offlineFormEnabled !== false;
    })(),
    offlineForm: {
      title: strFirst(
        offlineFormCfg?.title,
        "Leave us a message",
      ),
      subtitle: strFirst(offlineFormCfg?.subtitle, ""),
      submitLabel: strFirst(offlineFormCfg?.submitLabel, "Send message"),
    },
    banner: {
      enabled:
        chatBox?.bannerEnabled === true ||
        ui?.bannerOn === true ||
        ui?.bannerEnabled === true ||
        configRecord.bannerOn === true ||
        chatBox?.bannerEnabled === "true" ||
        ui?.bannerOn === "true" ||
        configRecord.bannerOn === "true",
      title: strFirst(chatBox?.bannerTitle, ui?.bannerTitle, configRecord.bannerTitle),
      description: strFirst(chatBox?.bannerDescription, ui?.bannerDescription, configRecord.bannerDescription),
      imageUrl: strFirst(chatBox?.bannerImageUrl, ui?.bannerImageUrl, configRecord.bannerImageUrl),
      videoUrl: strFirst(
        ui?.bannerVideoUrl,
        chatBox?.bannerVideoUrl,
        configRecord.bannerVideoUrl,
      ),
      mediaType: strFirst(chatBox?.bannerMediaType, ui?.bannerMediaType, configRecord.bannerMediaType, "image"),
      heightPx: (() => {
        const raw = numFirst(
          djBehavior?.bannerHeightPx,
          behavior?.bannerHeightPx,
          chatBox?.bannerHeightPx,
          ui?.bannerHeightPx,
          configRecord.bannerHeightPx,
        );
        if (raw === undefined || raw <= 0) return 0;
        return clampInt(raw, 0, 48, 200);
      })(),
      ctaLabel: strFirst(
        djBehavior?.bannerCtaLabel,
        behavior?.bannerCtaLabel,
        chatBox?.bannerCtaLabel,
        ui?.bannerCtaLabel,
        configRecord.bannerCtaLabel,
      ),
      ctaHref: strFirst(
        djBehavior?.bannerCtaHref,
        behavior?.bannerCtaHref,
        chatBox?.bannerCtaHref,
        ui?.bannerCtaHref,
        configRecord.bannerCtaHref,
      ),
    },
    videoWelcome: {
      enabled:
        behavior?.videoWelcomeOn === true ||
        configRecord.videoWelcomeOn === true,
      url: strFirst(behavior?.videoWelcomeUrl, configRecord.videoWelcomeUrl),
      heightPx: clampInt(
        numFirst(
          djBehavior?.videoWelcomeHeightPx,
          behavior?.videoWelcomeHeightPx,
          chatBox?.videoWelcomeHeightPx,
          ui?.videoWelcomeHeightPx,
          configRecord.videoWelcomeHeightPx,
        ),
        160,
        80,
        320,
      ),
    },
    launcher: (() => {
      const teaser = resolveProactiveTeaser({ ...djUi, ...ui });
      const launcherIconEnabled = launcher?.iconEnabled !== false;
      return {
      buttonLabel: resolveLauncherVisibleLabel(configRecord, ui, djUi, launcher),
      proactiveTeaserActive: teaser.active,
      proactiveTeaser: teaser.text,
      proactiveTeaserAvatarUrl: teaser.avatarUrl,
      proactiveSecondaryCta: teaser.secondaryCta,
      position: normalizePosition(
        strFirst(ui?.buttonPosition, theme?.position, launcher?.position, "right"),
      ),
      shape: strFirst(ui?.buttonShape, theme?.buttonShape, launcher?.shape, "circle"),
      insetBottomPx: numFirst(
        launcher?.insetBottomPx,
        ui?.launcherInsetBottomPx,
        djUi?.launcherInsetBottomPx,
      ) ?? 28,
      insetSidePx:
        numFirst(launcher?.insetSidePx, ui?.launcherInsetSidePx, djUi?.launcherInsetSidePx) ?? 28,
      iconEnabled: launcherIconEnabled,
      iconPreset: launcherIconEnabled
        ? normalizeIconPreset(
            strFirst(
              launcher?.iconPreset,
              ui?.launcherIconPreset,
              ui?.iconPreset,
              djUi?.launcherIconPreset,
              "phosphor-chat-circle",
            ),
          )
        : ("" as LauncherIconPresetId),
      iconUrl: launcherIconEnabled
        ? resolveLauncherCustomIconUrl(
            ui?.buttonIconUrl,
            configRecord.buttonIconUrl,
            launcher?.iconUrl,
          )
        : "",
      buttonColor,
      buttonHoverColor: buttonHover,
      iconColor,
      style: normalizeLauncherStyle(
        launcher?.style ??
          ui?.launcherStyle ??
          djUi?.launcherStyle ??
          expLauncher?.style,
      ),
    };
    })(),
    chatBox: {
      headerTitle: strFirst(chatBox?.headerTitle, ui?.headerTitle),
      headerLogoUrl: strFirst(
        chatBox?.headerLogoUrl,
        ui?.headerLogoUrl,
        configRecord.headerLogoUrl,
        expPanel?.headerLogoUrl,
      ),
      headerLogoHeightPx: clampInt(
        numFirst(
          djBehavior?.headerLogoHeightPx,
          behavior?.headerLogoHeightPx,
          chatBox?.headerLogoHeightPx,
          ui?.headerLogoHeightPx,
        ),
        28,
        16,
        64,
      ),
      headerLogoMaxWidthPx: clampInt(
        numFirst(
          djBehavior?.headerLogoMaxWidthPx,
          behavior?.headerLogoMaxWidthPx,
          chatBox?.headerLogoMaxWidthPx,
          ui?.headerLogoMaxWidthPx,
        ),
        96,
        48,
        200,
      ),
      headerAlign: normalizeHeaderAlign(
        strFirst(
          chatBox?.headerAlign,
          chatBox?.headerTitleAlign,
          ui?.headerTitleAlign,
          expPanel?.headerAlign,
          "center",
        ),
      ),
      headerBg: resolvedColors.headerBackground,
      headerTextColor,
      greetingMessage: rawGreetingMessage.trim(),
      sendPlaceholder: strFirst(
        chatBox?.sendPlaceholder,
        ui?.sendPlaceholder,
        djUi?.sendPlaceholder,
        response?.sendPlaceholder,
        ui?.messagePlaceholder,
        "Write a message…",
      ),
      backgroundColor: resolvedColors.panelBackground,
      boxWidth: Math.min(
        520,
        Math.max(280, numFirst(chatBox?.boxWidth, ui?.boxWidth, djUi?.boxWidth) ?? 360),
      ),
      boxHeight: Math.min(
        640,
        Math.max(320, numFirst(chatBox?.boxHeight, ui?.boxHeight, djUi?.boxHeight) ?? 480),
      ),
      fontFamily: resolvedColors.fontFamily,
    },
    panelSurfaceStyle: normalizePanelSurfaceStyle(
      strFirst(
        ui?.panelSurfaceStyle,
        djUi?.panelSurfaceStyle,
        chatPanel?.surfaceStyle,
        chatBox?.panelSurfaceStyle,
        expPanel?.surfaceStyle,
        launcher?.style,
      ),
    ),
    bubbleSurfaceStyle: normalizeLauncherStyle(
      strFirst(
        ui?.bubbleSurfaceStyle,
        djUi?.bubbleSurfaceStyle,
        chatBubbles?.surfaceStyle,
        chatBox?.bubbleSurfaceStyle,
        expBubbles?.surfaceStyle,
        "solid",
      ),
    ),
    avatars: {
      agent: {
        enabled:
          ui?.agentAvatarEnabled !== false &&
          djUi?.agentAvatarEnabled !== false &&
          expAgentAvatar?.enabled !== false,
        url: strFirst(
          ui?.agentAvatarUrl,
          djUi?.agentAvatarUrl,
          chatAgentAvatar?.url,
          expAgentAvatar?.url,
          ui?.proactiveTeaserAvatarUrl,
          djUi?.proactiveTeaserAvatarUrl,
        ),
        preset: normalizeAgentAvatarPreset(
          strFirst(
            chatAgentAvatar?.preset,
            ui?.agentAvatarPreset,
            djUi?.agentAvatarPreset,
            expAgentAvatar?.preset,
          ),
        ),
      },
      visitor: {
        enabled:
          ui?.visitorAvatarEnabled === true ||
          djUi?.visitorAvatarEnabled === true ||
          chatVisitorAvatar?.enabled === true ||
          expVisitorAvatar?.enabled === true,
        url: strFirst(
          ui?.visitorAvatarUrl,
          djUi?.visitorAvatarUrl,
          chatVisitorAvatar?.url,
          expVisitorAvatar?.url,
        ),
        preset: normalizeVisitorAvatarPreset(
          strFirst(
            chatVisitorAvatar?.preset,
            ui?.visitorAvatarPreset,
            djUi?.visitorAvatarPreset,
            expVisitorAvatar?.preset,
          ),
        ),
      },
    },
  };
}

/**
 * Text-us-only widgets store visuals under `theme.designJson.textUs`.
 * Maps into `RuntimeChatAppearance` so embed chrome reuses chat panel styling.
 */
export function extractRuntimeTextUsAppearance(
  configRecord: Record<string, unknown>,
): RuntimeChatAppearance {
  const base = extractRuntimeChatAppearance(configRecord);
  const dj = readDesignJson(configRecord);
  const textUs = dj && isObj(dj.textUs) ? dj.textUs : null;
  if (!textUs) return base;

  const buttonColor = str(textUs.buttonColor, "#1E63D5");
  const buttonHover = str(textUs.buttonHoverColor, mixHex(buttonColor, "#000000", 88));
  const headerTitle =
    textUs.headerTitleEnabled === false
      ? ""
      : typeof textUs.headerTitle === "string"
        ? textUs.headerTitle.trim() || "Text Us"
        : str(textUs.headerTitle, "Text Us");
  const welcomeMessage = str(textUs.welcomeMessage, "");
  const buttonLabel = str(textUs.buttonLabel, "Text Us");
  const position = normalizePosition(str(textUs.position, "right"));
  const verticalAnchor =
    str(textUs.verticalAnchor, "bottom").toLowerCase() === "top" ? "top" : "bottom";
  const insetBottomPx = clampInt(textUs.insetBottomPx, 28, 0, 240);
  const insetTopPx = clampInt(textUs.insetTopPx, insetBottomPx, 0, 240);
  const insetSidePx = clampInt(textUs.insetSidePx, 28, 0, 240);
  const boxWidth = clampInt(textUs.boxWidth, base.chatBox.boxWidth, 280, 520);
  const boxHeight = clampInt(textUs.boxHeight, base.chatBox.boxHeight, 320, 640);
  const headerLogoUrl = str(textUs.headerLogoUrl, "");
  const headerLogoHeightPx = clampInt(textUs.headerLogoHeightPx, 28, 16, 64);
  const headerLogoMaxWidthPx = clampInt(textUs.headerLogoMaxWidthPx, 96, 48, 200);
  const headerAlign = normalizeHeaderAlign(str(textUs.headerAlign, "left"));
  const iconColor = str(textUs.iconColor, pickReadableText(buttonColor, "#ffffff", "#0f172a", "#ffffff"));
  const headerTextColor = pickReadableText(buttonColor, "#ffffff", "#0f172a", "#ffffff");
  const panelBackground = str(textUs.panelBackground, base.chatBox.backgroundColor);
  const motionEnabled = textUs.motionEnabled !== false;

  const textUsLauncher = isObj(textUs.launcher) ? textUs.launcher : null;
  const launcherIconEnabled = textUsLauncher?.iconEnabled !== false;
  const iconPreset = launcherIconEnabled
    ? (normalizeLauncherIconPreset(
        typeof textUsLauncher?.iconPreset === "string" ? textUsLauncher.iconPreset : undefined,
        base.launcher.iconPreset || "phosphor-chat-circle",
      ) as LauncherIconPresetId)
    : ("" as LauncherIconPresetId);
  const launcherStyle = normalizeLauncherStyle(
    str(textUsLauncher?.style, base.launcher.style),
  );
  const launcherGlowColor = str(textUsLauncher?.glowColor, "");

  const designAccent = normalizeDesignAccent(
    typeof textUs.accent === "string"
      ? textUs.accent
      : typeof dj?.accent === "string"
        ? dj.accent
        : undefined,
  );
  const designDensity = normalizeDesignDensity(
    typeof textUs.density === "string"
      ? textUs.density
      : typeof dj?.density === "string"
        ? dj.density
        : undefined,
  );

  const theme = isObj(configRecord.theme) ? configRecord.theme : null;
  const formCfg = isObj(configRecord.form) ? configRecord.form : null;

  const resolvedColors = resolveWidgetColorTokens({
    theme,
    chatColors: {
      primary: buttonColor,
      button: buttonColor,
      headerBackground: buttonColor,
      headerText: headerTextColor,
      panelBackground,
    },
    designTheme: null,
    ui: null,
  });

  const colors: ResolvedWidgetColors = {
    ...resolvedColors,
    primary: buttonColor,
    headerBackground: buttonColor,
    headerText: headerTextColor,
    panelBackground,
  };

  return {
    ...base,
    colors,
    motionEnabled,
    welcomeMessage: welcomeMessage || strFirst(configRecord.welcomeMessage, headerTitle),
    panelGreetingMessage: welcomeMessage || headerTitle,
    panelSurfaceStyle: launcherStyle,
    accentPalette: resolveAccentPalette(designAccent),
    densityTokens: resolveDensityTokens(designDensity),
    launcher: {
      ...base.launcher,
      position,
      verticalAnchor,
      insetBottomPx,
      insetTopPx,
      insetSidePx,
      buttonColor,
      buttonHoverColor: buttonHover,
      iconColor,
      iconPreset,
      iconEnabled: launcherIconEnabled,
      style: launcherStyle,
      glowColor: launcherGlowColor || undefined,
      buttonLabel,
    },
    chatBox: {
      ...base.chatBox,
      headerTitle,
      headerLogoUrl,
      headerLogoHeightPx,
      headerLogoMaxWidthPx,
      headerBg: buttonColor,
      headerTextColor,
      headerAlign,
      greetingMessage: welcomeMessage || headerTitle,
      backgroundColor: panelBackground,
      boxWidth,
      boxHeight,
    },
    form: {
      ...base.form,
      title: "",
      subtitle: "",
      submitLabel: strFirst(formCfg?.submitLabel, "Send message"),
    },
  };
}

export function launcherFabPositionSx(
  appearance: RuntimeLauncherAppearance,
): Record<string, string | number> {
  const { position, insetBottomPx, insetSidePx } = appearance;
  const verticalAnchor = appearance.verticalAnchor === "top" ? "top" : "bottom";
  const inset =
    verticalAnchor === "top"
      ? (appearance.insetTopPx ?? insetBottomPx)
      : insetBottomPx;
  const base =
    verticalAnchor === "top"
      ? { top: `${inset}px`, bottom: "auto" as const }
      : { bottom: `${inset}px`, top: "auto" as const };
  if (position === "left") {
    return { ...base, left: `${insetSidePx}px`, right: "auto", transform: "none" };
  }
  if (position === "center") {
    return {
      ...base,
      left: "50%",
      right: "auto",
      transform: `translateX(calc(-50% + ${insetSidePx}px))`,
    };
  }
  return { ...base, right: `${insetSidePx}px`, left: "auto", transform: "none" };
}

export const EMBED_LAUNCHER_SHADOW_PAD_PX = 22;
export const EMBED_LAUNCHER_BADGE_PAD_PX = 14;
export const EMBED_INNER_BASE_PAD_PX = 10;
export const TEXT_US_EMBED_LAUNCHER_HEIGHT_PX = 56;

export type LauncherFrameChromeOptions = {
  hasBadge?: boolean;
};

export function estimatePillLauncherWidth(label: string, iconEnabled: boolean): number {
  const text = label.trim() || "Text Us";
  const charWidth = 8.5;
  const textWidth = Math.min(text.length * charWidth, 180);
  const iconPart = iconEnabled ? 26 + 12 : 0;
  const padding = 32;
  return Math.ceil(Math.max(56, iconPart + textWidth + padding));
}

export function launcherFrameChromeInsets(
  appearance: Pick<RuntimeLauncherAppearance, "position" | "verticalAnchor">,
  options?: LauncherFrameChromeOptions,
): { top: number; right: number; bottom: number; left: number } {
  const base = EMBED_INNER_BASE_PAD_PX;
  const shadow = EMBED_LAUNCHER_SHADOW_PAD_PX;
  const badge = options?.hasBadge ? EMBED_LAUNCHER_BADGE_PAD_PX : 0;
  const vertical = appearance.verticalAnchor === "top" ? "top" : "bottom";
  const pos = appearance.position;

  const top = base + badge;
  const bottom = vertical === "bottom" ? base + shadow : base;
  let left = base;
  let right = base;

  if (pos === "right") {
    right += shadow + badge;
  } else if (pos === "left") {
    left += shadow + badge;
  } else {
    left += badge;
    right += shadow + badge;
  }

  return { top, right, bottom, left };
}

export function launcherInnerRootSx(
  appearance: Pick<RuntimeLauncherAppearance, "position" | "verticalAnchor">,
  options?: LauncherFrameChromeOptions,
): Record<string, string | number> {
  const { top, right, bottom, left } = launcherFrameChromeInsets(appearance, options);
  const verticalAnchor = appearance.verticalAnchor === "top" ? "top" : "bottom";
  const vertical =
    verticalAnchor === "top"
      ? { top, bottom: "auto" as const }
      : { bottom, top: "auto" as const };
  if (appearance.position === "left") {
    return { ...vertical, left, right: "auto", transform: "none" };
  }
  if (appearance.position === "center") {
    return {
      ...vertical,
      left: "50%",
      right: "auto",
      transform: "translateX(-50%)",
    };
  }
  return { ...vertical, right, left: "auto", transform: "none" };
}

export function launcherEmbedRootSx(
  position: RuntimeLauncherAppearance["position"],
): Record<string, string | number> {
  const base = { bottom: 0, top: "auto" as const };
  if (position === "left") {
    return { ...base, left: 0, right: "auto", transform: "none" };
  }
  if (position === "center") {
    return { ...base, left: "50%", right: "auto", transform: "translateX(-50%)" };
  }
  return { ...base, right: 0, left: "auto", transform: "none" };
}

export function launcherBorderRadius(shape: string): string {
  const s = shape.toLowerCase();
  if (s === "square") return "10px";
  if (s === "rounded") return "16px";
  return "50%";
}
