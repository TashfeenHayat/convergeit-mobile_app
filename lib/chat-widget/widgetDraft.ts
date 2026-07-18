import type { WidgetAiType } from "./widget-ai-type";
import type { WidgetLauncherStyleId } from "./launcher-style";
import { normalizeWidgetAiType } from "./widget-ai-type";
import {
  normalizeWidgetInquiryOptions,
  type WidgetInquiryOption,
} from "./widget-inquiry.types";
import {
  buildApiWidgetEmbedScript,
  resolveWidgetApiOrigin,
  resolveWidgetEmbedAppOrigin,
} from "./widget-embed-api-origin";
import { DEFAULT_TALK_TO_AGENT_BUTTON_LABEL } from "./talk-to-agent.constants";

export type WidgetKind = "chat" | "text" | "both";

import {
  normalizeLauncherIconPreset,
  type LauncherIconPresetId,
} from "./launcher-icon-presets";

export type { LauncherIconPresetId };
export type { LauncherIconPresetIdNonEmpty } from "./launcher-icon-presets";
export type { WidgetLauncherStyleId };
export { normalizeLauncherIconPreset };

export type WidgetInstallChatMode = "AI_ONLY" | "AGENT_ONLY" | "HYBRID";

export type { WidgetAiType };

export interface TextUsFormFieldDraft {
  key: string;
  label: string;
  placeholder?: string;
  fieldType: string;
  required?: boolean;
}

export interface WidgetDraft {
  type: WidgetKind;
  /** Target site for `POST /widgets/installations`. */
  websiteId?: string;
  /** Persisted tenant path on Add Widget (website list scoped by child company). */
  tenantResellerId?: string;
  tenantParentCompanyId?: string;
  tenantChildCompanyId?: string;
  /** Backend `widgetKey` after `POST /widgets/installations` (draft create) or PATCH. */
  remoteWidgetKey?: string;
  /** Backend flag when draft saved without deploy key (`publishNow: false`). */
  requiresPublishBeforeEmbed?: boolean;
  /** Chat routing mode stored as WidgetWebsiteConfig.mode. */
  chatMode?: WidgetInstallChatMode;
  /** `config.aiType` when chatMode is AI_ONLY or HYBRID (AI_CHATBOT | AI_ASSISTANT). */
  aiType?: WidgetAiType;
  /** Allowed embedding domains (hostname strings). */
  allowedDomains?: string[];
  /** When true, widget may embed on any origin (`chat_widget_config.embedAllowAnyOrigin`). */
  embedAllowAnyOrigin?: boolean;
  widgetId: string;
  completed: boolean;
  buttonShape: "circle" | "rounded" | "square";
  buttonPosition: "left" | "center" | "right";
  /** Launcher FAB distance from viewport bottom (px); larger moves the button upward. */
  launcherInsetBottomPx: number;
  /** Distance from left/right screen edge matching `buttonPosition`; from bottom center when `center` (horizontal shift, px). */
  launcherInsetSidePx: number;
  buttonColor: string;
  buttonHoverColor: string;
  iconColor: string;
  iconDataUrl: string;
  /** When set and `iconDataUrl` is empty, FAB uses preset Phosphor-style icon */
  launcherIconPreset: LauncherIconPresetId;
  /** When false, chat launcher shows button text only (no glyph). */
  launcherIconEnabled?: boolean;
  /** When false, chat launcher shows icon/shape only (no pill text). */
  launcherLabelEnabled?: boolean;
  /** FAB visual preset — solid, gradient, glass, glow. */
  launcherStyle?: WidgetLauncherStyleId;
  headerTitleAlign: "Center" | "Left";
  /** Header bar logo (data URL until upload). */
  headerLogoDataUrl?: string;
  /** Header logo height in px (embed + preview). */
  headerLogoHeightPx?: number;
  /** Chat panel shell style — independent of launcher FAB style. */
  panelSurfaceStyle?: WidgetLauncherStyleId;
  /** Message bubble surface style (solid, gradient, glass, glow). */
  bubbleSurfaceStyle?: WidgetLauncherStyleId;
  /** Agent / assistant avatar beside incoming bubbles. */
  agentAvatarEnabled?: boolean;
  agentAvatarDataUrl?: string;
  agentAvatarPreset?: string;
  /** Visitor avatar beside outgoing bubbles. */
  visitorAvatarEnabled?: boolean;
  visitorAvatarDataUrl?: string;
  visitorAvatarPreset?: string;
  headerTitle: string;
  textColor: string;
  greetingMessage: string;
  sendPlaceholder: string;
  bannerOn: boolean;
  bannerTitle: string;
  bannerDescription: string;
  /** Promo banner media height in px; `0` = auto (natural aspect ratio). */
  bannerHeightPx?: number;
  bannerCtaLabel?: string;
  bannerCtaHref?: string;
  bannerDataUrl: string;
  bannerMediaType: "image" | "video";
  boxWidth: number;
  boxHeight: number;
  /** Text Us surface (dashboard builder). */
  textUsButtonColor?: string;
  textUsButtonHoverColor?: string;
  textUsButtonLabel?: string;
  textUsIconColor?: string;
  textUsPosition?: string;
  textUsVerticalAnchor?: "top" | "bottom";
  textUsInsetBottomPx?: number;
  textUsInsetTopPx?: number;
  textUsInsetSidePx?: number;
  textUsBoxWidth?: number;
  textUsBoxHeight?: number;
  textUsHeaderTitle?: string;
  /** When false, panel header shows logo only (no title text). */
  textUsHeaderTitleEnabled?: boolean;
  textUsWelcomeMessage?: string;
  textUsHeaderLogoDataUrl?: string;
  textUsHeaderLogoHeightPx?: number;
  textUsHeaderLogoMaxWidthPx?: number;
  /** Header logo + title alignment inside the panel bar. */
  textUsHeaderAlign?: "left" | "center" | "right";
  /** Glow halo color when `textUsLauncherStyle` is glow — defaults to button color. */
  textUsGlowColor?: string;
  textUsLauncherIconPreset?: LauncherIconPresetId;
  /** When false, floating launcher shows button text only (no glyph). */
  textUsLauncherIconEnabled?: boolean;
  textUsLauncherStyle?: WidgetLauncherStyleId;
  textUsMotionEnabled?: boolean;
  textUsPanelBackground?: string;
  textUsAccent?: string;
  textUsDensity?: string;
  textUsFormFields?: TextUsFormFieldDraft[];
  /** Brand theme (PATCH `config.theme`) — optional; sensible fallbacks in patch builders. */
  themeName?: string;
  themePrimaryColor?: string;
  themeSecondaryColor?: string;
  themeFontFamily?: string;
  themeBubbleStyle?: string;
  /** Panel shell corner radius (PATCH `config.theme.borderRadiusPx`). */
  themeBorderRadiusPx?: number;
  /** Message bubble corner radius (`theme.designJson.behavior.bubbleBorderRadiusPx`). */
  bubbleBorderRadiusPx?: number;
  themeWelcomeFontSizePx?: number;
  themeBodyFontSizePx?: number;
  themeInputFontSizePx?: number;
  themeCtaFontSizePx?: number;
  themeConsentFontSizePx?: number;
  themeLineHeightPx?: number;
  themeDesignJsonAccent?: string;
  themeDesignJsonDensity?: string;
  /** Step 1 — closed-state invitation bubble above FAB */
  proactiveTeaserEnabled?: boolean;
  proactiveTeaser?: string;
  proactiveTeaserAvatarEnabled?: boolean;
  proactiveTeaserAvatarDataUrl?: string;
  /** Step 2 — Continue step before chat */
  panelGreetingEnabled?: boolean;
  /** Step 2 — first agent bubble in transcript */
  chatWelcomeEnabled?: boolean;
  proactiveSecondaryCtaEnabled?: boolean;
  proactiveSecondaryCtaLabel?: string;
  proactiveSecondaryCtaHref?: string;
  proactiveSecondaryCtaKind?: "whatsapp" | "link" | "";
  /** When true, show agent reply snippet above launcher while widget is closed. */
  closedMessagePreviewEnabled?: boolean;
  motionEnabled?: boolean;
  buttonLabel?: string;
  firstMessage?: string;
  messagePlaceholder?: string;
  backgroundColor?: string;
  popupEnabled?: boolean;
 chatBodyText?: string;
  chatMutedText?: string;
  incomingMessageBg?: string;
  incomingMessageText?: string;
  outgoingMessageBg?: string;
  outgoingMessageText?: string;
  greetingBubbleBg?: string;
  greetingBubbleText?: string;
  inputBackground?: string;
  inputText?: string;
  inputBorderColor?: string;
  inputPlaceholderColor?: string;
  labelColor?: string;
  inquiryPillBg?: string;
  inquiryPillText?: string;
  inquiryPillBorder?: string;
  inquiryPillSelectedBg?: string;
  inquiryPillSelectedText?: string;
  talkToAgentButtonBg?: string;
  talkToAgentButtonText?: string;
  talkToAgentButtonBorder?: string;
  /** Step 3 PATCH `config.behavior` */
  botEnabled?: boolean;
  notificationEnabled?: boolean;
  browserNotification?: boolean;
  soundNotification?: boolean;
  fallbackNotificationText?: string;
  videoWelcomeOn?: boolean;
  /** YouTube/Vimeo or direct MP4 link (saved in config; embed player pending). */
  videoWelcomeUrl?: string;
  /** Video welcome embed height in px. */
  videoWelcomeHeightPx?: number;
  /** When false, inquiry topic pills are hidden (step 2 toggle). */
  inquiryOn?: boolean;
  /** When true, visitor must pick a topic pill (default false = skip allowed). */
  inquiryRequired?: boolean;
  inquirySkipLabel?: string;
  /** Routes visitors who skip topic selection (`behavior.inquiryFallbackRoutingKey`). */
  inquiryFallbackRoutingKey?: string;
  inquiryOptions?: WidgetInquiryOption[];
  welcomeMessageBehavior?: string;
  autoOpenEnabled?: boolean;
  autoOpenDelaySeconds?: number;
  /** When false, auto-open runs only on first visit (per browser). */
  autoOpenOnReturnVisit?: boolean;
  notificationSoundId?: "soft" | "chime" | "ping" | "bell" | "pop" | "ding" | "none";
  launcherBadgeMode?: "count" | "dot" | "none";
  fileUploadEnabled?: boolean;
  emojiEnabled?: boolean;
  consentRequired?: boolean;
  consentText?: string;
  privacyPolicyUrl?: string;
  privacyNotice?: string;
  allowedDomainsText?: string;
  /** Step 3 PATCH `config.session` */
  persistVisitorSession?: boolean;
  sessionTtlMinutes?: number;
  /** Step 3 PATCH `config.form` */
  formEnabled?: boolean;
  formTitle?: string;
  formSubtitle?: string;
  formSubmitLabel?: string;
  prechatNameEnabled?: boolean;
  prechatEmailEnabled?: boolean;
  prechatPhoneEnabled?: boolean;
  prechatMessageEnabled?: boolean;
  prechatMessageRequired?: boolean;
  /** Step 3 PATCH `config.offlineForm` — shown when no agent is available. */
  offlineFormEnabled?: boolean;
  offlineFormTitle?: string;
  offlineFormSubtitle?: string;
  offlineFormSubmitLabel?: string;
  offlinePrechatNameEnabled?: boolean;
  offlinePrechatEmailEnabled?: boolean;
  offlinePrechatPhoneEnabled?: boolean;
  offlinePrechatMessageEnabled?: boolean;
  offlinePrechatMessageRequired?: boolean;
  /** Step 3 PATCH `config.response` */
  responseWelcomeMessage?: string;
  responseOfflineMessage?: string;
  responseGreetingMessage?: string;
  responseSendPlaceholder?: string;
  responseAiPromptHint?: string;
  responseTalkToAgentEnabled?: boolean;
  responseTalkToAgentTriggerText?: string;
}

const STORAGE_KEY = "chat_widget_draft_v1";

export const defaultWidgetDraft: WidgetDraft = {
  type: "chat",
  websiteId: undefined,
  chatMode: "HYBRID",
  aiType: "AI_CHATBOT",
  allowedDomains: undefined,
  embedAllowAnyOrigin: false,
  widgetId: "12345",
  completed: false,
  buttonShape: "circle",
  buttonPosition: "right",
  launcherInsetBottomPx: 28,
  launcherInsetSidePx: 28,
  buttonColor: "#1E63D5",
  buttonHoverColor: "#164EB0",
  iconColor: "#FFFFFF",
  iconDataUrl: "",
  launcherIconPreset: "phosphor-chat-circle",
  launcherIconEnabled: true,
  launcherLabelEnabled: true,
  launcherStyle: "solid",
  headerTitleAlign: "Center",
  headerLogoDataUrl: "",
  headerLogoHeightPx: 28,
  panelSurfaceStyle: "solid",
  bubbleSurfaceStyle: "solid",
  agentAvatarEnabled: true,
  agentAvatarDataUrl: "",
  agentAvatarPreset: "phosphor-user-circle",
  visitorAvatarEnabled: true,
  visitorAvatarDataUrl: "",
  visitorAvatarPreset: "phosphor-user-circle",
  headerTitle: "",
  textColor: "#FFFFFF",
  greetingMessage: "Hi! How can we help today?",
  sendPlaceholder: "Type your message…",
  bannerOn: true,
  bannerTitle: "",
  bannerDescription: "",
  bannerHeightPx: 0,
  bannerCtaLabel: "",
  bannerCtaHref: "",
  bannerDataUrl: "",
  bannerMediaType: "image",
  boxWidth: 350,
  boxHeight: 430,
  textUsButtonColor: "#1E63D5",
  textUsButtonHoverColor: "#164EB0",
  textUsButtonLabel: "Text Us",
  textUsIconColor: "#FFFFFF",
  textUsPosition: "right",
  textUsVerticalAnchor: "bottom",
  textUsInsetBottomPx: 28,
  textUsInsetTopPx: 28,
  textUsInsetSidePx: 28,
  textUsBoxWidth: 360,
  textUsBoxHeight: 480,
  textUsHeaderTitle: "Text Us",
  textUsHeaderTitleEnabled: true,
  textUsWelcomeMessage: "Send us a message — we reply by SMS.",
  textUsHeaderLogoDataUrl: "",
  textUsHeaderLogoHeightPx: 28,
  textUsHeaderLogoMaxWidthPx: 96,
  textUsHeaderAlign: "left",
  textUsGlowColor: "",
  textUsLauncherIconPreset: "phosphor-chat-circle",
  textUsLauncherIconEnabled: true,
  textUsLauncherStyle: "solid",
  textUsMotionEnabled: true,
  textUsPanelBackground: "#f8fafc",
  textUsAccent: "blue",
  textUsDensity: "comfortable",
  themeName: "Brand Default",
  themeSecondaryColor: "#64748b",
  themeFontFamily: "Inter, system-ui, sans-serif",
  themeBubbleStyle: "rounded",
  themeBorderRadiusPx: 12,
  bubbleBorderRadiusPx: 12,
  themeWelcomeFontSizePx: 18,
  themeBodyFontSizePx: 14,
  themeInputFontSizePx: 14,
  themeCtaFontSizePx: 15,
  themeConsentFontSizePx: 12,
  themeLineHeightPx: 22,
  themeDesignJsonAccent: "blue",
  themeDesignJsonDensity: "comfortable",
  buttonLabel: "Chat with us",
  proactiveTeaserEnabled: true,
  proactiveTeaser: "Any questions? Let us know!",
  proactiveTeaserAvatarEnabled: false,
  proactiveTeaserAvatarDataUrl: "",
  panelGreetingEnabled: false,
  chatWelcomeEnabled: false,
  proactiveSecondaryCtaEnabled: false,
  proactiveSecondaryCtaLabel: "Contact us on WhatsApp",
  proactiveSecondaryCtaHref: "https://wa.me/",
  proactiveSecondaryCtaKind: "whatsapp",
  closedMessagePreviewEnabled: true,
  motionEnabled: true,
  firstMessage: "",
  messagePlaceholder: "Write here…",
  backgroundColor: "#f8fafc",
  popupEnabled: false,
  botEnabled: true,
  notificationEnabled: true,
  browserNotification: true,
  soundNotification: false,
  fallbackNotificationText: "You have a new message from support.",
  videoWelcomeOn: false,
  videoWelcomeUrl: "",
  videoWelcomeHeightPx: 160,
  welcomeMessageBehavior: "Thanks for reaching out.",
  autoOpenEnabled: false,
  autoOpenDelaySeconds: 10,
  autoOpenOnReturnVisit: false,
  notificationSoundId: "chime",
  launcherBadgeMode: "count",
  fileUploadEnabled: true,
  emojiEnabled: true,
  consentRequired: true,
  consentText: "I agree to the chat terms and privacy policy.",
  privacyPolicyUrl: "https://www.example.com/privacy",
  privacyNotice: "We process messages per our privacy policy.",
  allowedDomainsText: "",
  persistVisitorSession: true,
  sessionTtlMinutes: 120,
  formEnabled: true,
  formTitle: "Before we start",
  formSubtitle: "Tell us who you are",
  formSubmitLabel: "Start chat",
  prechatNameEnabled: true,
  prechatEmailEnabled: true,
  prechatPhoneEnabled: false,
  prechatMessageEnabled: true,
  prechatMessageRequired: false,
  offlineFormEnabled: true,
  offlineFormTitle: "Leave us a message",
  offlineFormSubtitle: "We're away right now — tell us how we can help.",
  offlineFormSubmitLabel: "Send message",
  offlinePrechatNameEnabled: true,
  offlinePrechatEmailEnabled: true,
  offlinePrechatPhoneEnabled: false,
  offlinePrechatMessageEnabled: true,
  offlinePrechatMessageRequired: true,
  responseWelcomeMessage: "Hello! A teammate will join shortly.",
  responseOfflineMessage: "We are offline; leave a message and we will reply.",
  responseGreetingMessage: "Good day!",
  responseSendPlaceholder: "Ask us anything…",
  responseAiPromptHint: "Be concise and helpful.",
  responseTalkToAgentEnabled: true,
  responseTalkToAgentTriggerText: DEFAULT_TALK_TO_AGENT_BUTTON_LABEL,
  inquiryOn: false,
  inquiryRequired: false,
  inquirySkipLabel: "General question",
  inquiryOptions: normalizeWidgetInquiryOptions(["Billing", "Technical", "Sales"]),
};

export { normalizeWidgetInquiryOptions };

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}


function clampLauncherInsetPx(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(240, Math.max(0, Math.round(n)));
}

const CHAT_MODES = new Set<string>(["AI_ONLY", "AGENT_ONLY", "HYBRID"]);

function normalizeChatMode(value: unknown): WidgetInstallChatMode | undefined {
  if (typeof value !== "string") return undefined;
  const up = value.toUpperCase();
  return CHAT_MODES.has(up) ? (up as WidgetInstallChatMode) : undefined;
}

/** Coerce persisted / API launcher shape tokens (matches backend + admin mapper). */
export function normalizeButtonShape(value: unknown): WidgetDraft["buttonShape"] {
  const s = String(value ?? "").toLowerCase();
  if (s === "square") return "square";
  if (s === "rounded" || s === "pill") return "rounded";
  return "circle";
}

/** Coerce persisted / API launcher position tokens. */
export function normalizeButtonPosition(value: unknown): WidgetDraft["buttonPosition"] {
  const s = String(value ?? "").toLowerCase();
  if (s === "left" || s === "center" || s === "right") return s;
  return "right";
}

/** Launcher FAB fields for wizard closed-state previews (step 2+). */
export function resolveLauncherPreviewFromDraft(
  draft: Partial<WidgetDraft>,
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
> {
  return {
    buttonShape: normalizeButtonShape(draft.buttonShape),
    buttonPosition: normalizeButtonPosition(draft.buttonPosition),
    launcherInsetBottomPx: clampLauncherInsetPx(
      draft.launcherInsetBottomPx,
      defaultWidgetDraft.launcherInsetBottomPx,
    ),
    launcherInsetSidePx: clampLauncherInsetPx(
      draft.launcherInsetSidePx,
      defaultWidgetDraft.launcherInsetSidePx,
    ),
    buttonColor:
      draft.buttonColor?.trim() ||
      draft.themePrimaryColor?.trim() ||
      defaultWidgetDraft.buttonColor,
    buttonHoverColor: draft.buttonHoverColor ?? defaultWidgetDraft.buttonHoverColor,
    iconColor: draft.iconColor ?? defaultWidgetDraft.iconColor,
    iconDataUrl: draft.iconDataUrl ?? "",
    launcherIconPreset: normalizeLauncherIconPreset(draft.launcherIconPreset),
  };
}

/** Merge defaults + partial stored JSON with the same coercion as `readWidgetDraft`. */
export function mergePartialWidgetDraft(parsed: Partial<WidgetDraft>): WidgetDraft {
  return {
    ...defaultWidgetDraft,
    ...parsed,
    chatMode: normalizeChatMode(parsed.chatMode) ?? defaultWidgetDraft.chatMode,
    aiType: normalizeWidgetAiType(parsed.aiType ?? defaultWidgetDraft.aiType),
    buttonShape: normalizeButtonShape(parsed.buttonShape),
    buttonPosition: normalizeButtonPosition(parsed.buttonPosition),
    launcherIconPreset: normalizeLauncherIconPreset(parsed.launcherIconPreset),
    launcherInsetBottomPx: clampLauncherInsetPx(
      parsed.launcherInsetBottomPx,
      defaultWidgetDraft.launcherInsetBottomPx,
    ),
    launcherInsetSidePx: clampLauncherInsetPx(
      parsed.launcherInsetSidePx,
      defaultWidgetDraft.launcherInsetSidePx,
    ),
  };
}

export function readWidgetDraft(): WidgetDraft {
  if (!canUseStorage()) return defaultWidgetDraft;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultWidgetDraft;
    const parsed = JSON.parse(raw) as Partial<WidgetDraft>;
    return mergePartialWidgetDraft(parsed);
  } catch {
    return defaultWidgetDraft;
  }
}

export function saveWidgetDraft(update: Partial<WidgetDraft>) {
  if (!canUseStorage()) return;
  const current = readWidgetDraft();
  const next: WidgetDraft = { ...current, ...update };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return;
  } catch {
    // Fallback for large base64 uploads (especially videos) that exceed localStorage quota.
    const withoutBannerMedia: WidgetDraft = {
      ...next,
      bannerDataUrl: "",
      bannerMediaType: "image",
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(withoutBannerMedia));
      return;
    } catch {
      const withoutAnyMedia: WidgetDraft = {
        ...withoutBannerMedia,
        iconDataUrl: "",
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(withoutAnyMedia));
      } catch {
        // Ignore persistence failure to avoid runtime crash.
      }
    }
  }
}

/** Customer embed snippet (iframe loader on dashboard origin). */
export function buildUnifiedWidgetEmbedScript(input: {
  widgetKey: string;
  appOrigin?: string;
  apiOrigin?: string;
}) {
  return buildApiWidgetEmbedScript({
    widgetKey: input.widgetKey,
    appOrigin: input.appOrigin ?? input.apiOrigin,
  });
}

export { resolveWidgetApiOrigin, resolveWidgetEmbedAppOrigin };

export function buildWidgetScript(
  draft: WidgetDraft,
  options?: { apiOrigin?: string; appOrigin?: string },
) {
  return buildApiWidgetEmbedScript({
    widgetKey: draft.widgetId || "YOUR_WIDGET_KEY",
    apiOrigin: options?.apiOrigin ?? options?.appOrigin,
  });
}
