import { isRecord } from "@/lib/utils";

export interface ResolvedWidgetColors {
  primary: string;
  secondary: string;
  panelBackground: string;
  bodyText: string;
  mutedText: string;
  headerBackground: string;
  headerText: string;
  incomingBubbleBg: string;
  incomingBubbleText: string;
  outgoingBubbleBg: string;
  outgoingBubbleText: string;
  systemBubbleBg: string;
  systemBubbleText: string;
  greetingBubbleBg: string;
  greetingBubbleText: string;
  inputBackground: string;
  inputText: string;
  inputBorder: string;
  inputPlaceholder: string;
  labelText: string;
  inquiryIdleBg: string;
  inquiryIdleText: string;
  inquiryIdleBorder: string;
  inquirySelectedBg: string;
  inquirySelectedText: string;
  talkToAgentBackground: string;
  talkToAgentText: string;
  talkToAgentBorder: string;
  borderRadiusPx: number;
  inputFontSizePx: number;
  bodyFontSizePx: number;
  fontFamily: string;
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

function num(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number.parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace(/^#/, "").trim();
  if (h.length === 3) {
    return {
      r: Number.parseInt(h[0] + h[0], 16),
      g: Number.parseInt(h[1] + h[1], 16),
      b: Number.parseInt(h[2] + h[2], 16),
    };
  }
  if (h.length === 6) {
    return {
      r: Number.parseInt(h.slice(0, 2), 16),
      g: Number.parseInt(h.slice(2, 4), 16),
      b: Number.parseInt(h.slice(4, 6), 16),
    };
  }
  return null;
}

function relativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(rgb.r) + 0.7152 * f(rgb.g) + 0.0722 * f(rgb.b);
}

/** Prefer `preferred` when readable on `bg`; otherwise pick black or white. */
export function pickReadableText(
  bg: string,
  preferred: string,
  fallbackDark = "#0f172a",
  fallbackLight = "#ffffff",
): string {
  const bgRgb = parseHex(bg);
  const prefRgb = parseHex(preferred);
  if (bgRgb && prefRgb) {
    const contrast =
      (Math.max(relativeLuminance(bgRgb), relativeLuminance(prefRgb)) + 0.05) /
      (Math.min(relativeLuminance(bgRgb), relativeLuminance(prefRgb)) + 0.05);
    if (contrast >= 3) return preferred;
  }
  if (bgRgb) return relativeLuminance(bgRgb) > 0.45 ? fallbackDark : fallbackLight;
  return preferred || fallbackDark;
}

export function mixHex(fg: string, bg: string, fgWeightPct: number): string {
  const a = parseHex(fg);
  const b = parseHex(bg);
  if (!a || !b) return fg || bg;
  const w = Math.min(100, Math.max(0, fgWeightPct)) / 100;
  const r = Math.round(a.r * w + b.r * (1 - w));
  const g = Math.round(a.g * w + b.g * (1 - w));
  const bl = Math.round(a.b * w + b.b * (1 - w));
  return `#${[r, g, bl].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * MUI `sx` / palette do not accept `color-mix()` strings (common in published `chat.colors`).
 * Normalize to hex using the same mix weight as wizard defaults (62% foreground).
 */
export function sanitizeCssColorForMui(
  value: unknown,
  mixFg: string,
  mixBg: string,
  mixFgWeightPct = 62,
): string {
  const v = typeof value === "string" ? value.trim() : "";
  if (!v || v.toLowerCase().startsWith("color-mix")) {
    return mixHex(mixFg, mixBg, mixFgWeightPct);
  }
  return v;
}

export interface ResolveWidgetColorTokensInput {
  theme: Record<string, unknown> | null;
  chatColors: Record<string, unknown> | null;
  designTheme: Record<string, unknown> | null;
  ui: Record<string, unknown> | null;
}

/**
 * Resolve embed UI colors from `theme`, `theme.designJson.chat.colors`, `designJson.theme`, and `ui`.
 * Missing keys are derived from primary/secondary/header text (never dashboard defaults).
 */
export function resolveWidgetColorTokens(input: ResolveWidgetColorTokensInput): ResolvedWidgetColors {
  const theme = input.theme;
  const colors = input.chatColors;
  const designTheme = input.designTheme;
  const ui = input.ui;

  const primary = strFirst(
    colors?.button,
    colors?.primary,
    theme?.primaryColor,
    "#1E63D5",
  );
  const secondary = strFirst(
    colors?.secondary,
    theme?.secondaryColor,
    designTheme?.secondaryColor,
    "#64748b",
  );
  const panelBackground = strFirst(
    colors?.panelBackground,
    colors?.panel_background,
    ui?.backgroundColor,
    designTheme?.panelBackground,
    designTheme?.backgroundColor,
    "#ffffff",
  );
  const headerBackground = strFirst(
    colors?.headerBackground,
    colors?.header_background,
    theme?.primaryColor,
    primary,
  );
  const headerText = strFirst(
    colors?.headerText,
    colors?.header_text,
    designTheme?.textColor,
    theme?.textColor,
    "#000000",
  );
  const labelText = strFirst(
    colors?.labelColor,
    colors?.label_color,
    pickReadableText(panelBackground, "#0f172a", "#ffffff"),
  );
  /** Panel copy must contrast with `panelBackground` (API `bodyText` is often header-white). */
  const bodyTextFromApi = strFirst(colors?.bodyText, colors?.body_text, "");
  const bodyText = bodyTextFromApi
    ? pickReadableText(panelBackground, bodyTextFromApi, labelText, "#0f172a")
    : labelText;
  const mutedText = sanitizeCssColorForMui(
    strFirst(colors?.mutedText, colors?.muted_text, designTheme?.mutedTextColor, ""),
    bodyText,
    panelBackground,
    62,
  );

  const incomingBubbleBg = strFirst(
    colors?.incomingMessageBg,
    colors?.incoming_message_bg,
    mixHex(secondary, panelBackground, 22),
  );
  const incomingBubbleText = strFirst(
    colors?.incomingMessageText,
    colors?.incoming_message_text,
    pickReadableText(incomingBubbleBg, bodyText),
  );
  const outgoingBubbleBg = strFirst(
    colors?.outgoingMessageBg,
    colors?.outgoing_message_bg,
    primary,
  );
  const outgoingBubbleText = strFirst(
    colors?.outgoingMessageText,
    colors?.outgoing_message_text,
    pickReadableText(
      outgoingBubbleBg,
      strFirst(colors?.icon, theme?.iconColor, "#ffffff"),
    ),
  );
  const systemBubbleBg = strFirst(
    colors?.systemMessageBg,
    colors?.system_message_bg,
    incomingBubbleBg,
  );
  const systemBubbleText = strFirst(
    colors?.systemMessageText,
    colors?.system_message_text,
    incomingBubbleText,
  );
  const greetingBubbleBg = strFirst(
    colors?.greetingBubbleBg,
    colors?.greeting_bubble_bg,
    incomingBubbleBg,
  );
  const greetingBubbleText = strFirst(
    colors?.greetingBubbleText,
    colors?.greeting_bubble_text,
    incomingBubbleText,
  );

  const inputBackground = strFirst(
    colors?.inputBackground,
    colors?.input_background,
    designTheme?.inputBackground,
    "#ffffff",
  );
  const inputText = strFirst(
    colors?.inputText,
    colors?.input_text,
    designTheme?.inputTextColor,
    pickReadableText(inputBackground, bodyText),
  );
  const inputBorder = strFirst(
    colors?.inputBorderColor,
    colors?.input_border_color,
    mixHex(secondary, panelBackground, 55),
  );
  const inputPlaceholder = sanitizeCssColorForMui(
    strFirst(colors?.inputPlaceholderColor, colors?.input_placeholder_color, mutedText, ""),
    bodyText,
    panelBackground,
    62,
  );

  const inquirySelectedBg = strFirst(
    colors?.inquiryPillSelectedBg,
    colors?.inquiry_pill_selected_bg,
    primary,
  );
  const inquirySelectedText = strFirst(
    colors?.inquiryPillSelectedText,
    colors?.inquiry_pill_selected_text,
    pickReadableText(inquirySelectedBg, strFirst(colors?.icon, theme?.iconColor, "#ffffff")),
  );
  const inquiryIdleBg = strFirst(
    colors?.inquiryPillBg,
    colors?.inquiry_pill_bg,
    panelBackground,
  );
  const inquiryIdleText = strFirst(
    colors?.inquiryPillText,
    colors?.inquiry_pill_text,
    pickReadableText(inquiryIdleBg, bodyText),
  );
  const inquiryIdleBorder = strFirst(
    colors?.inquiryPillBorder,
    colors?.inquiry_pill_border,
    mixHex(secondary, panelBackground, 70),
  );

  const talkToAgentBackground = strFirst(
    colors?.talkToAgentButtonBg,
    colors?.handoverButtonBg,
    colors?.handover_button_bg,
    panelBackground,
  );
  const talkToAgentBorder = strFirst(
    colors?.talkToAgentButtonBorder,
    colors?.handoverButtonBorder,
    colors?.handover_button_border,
    primary,
  );
  const talkToAgentText = strFirst(
    colors?.talkToAgentButtonText,
    colors?.handoverButtonText,
    colors?.handover_button_text,
    pickReadableText(talkToAgentBackground, bodyText),
  );

  const borderRadiusPx = Math.min(
    20,
    Math.max(0, num(theme?.borderRadiusPx, num(designTheme?.borderRadiusPx, 12))),
  );
  const inputFontSizePx = num(theme?.inputFontSizePx, 14);
  const bodyFontSizePx = num(theme?.bodyFontSizePx, 14);
  const fontFamily = strFirst(theme?.fontFamily, "Inter, system-ui, sans-serif");

  return {
    primary,
    secondary,
    panelBackground,
    bodyText,
    mutedText,
    headerBackground,
    headerText,
    incomingBubbleBg,
    incomingBubbleText,
    outgoingBubbleBg,
    outgoingBubbleText,
    systemBubbleBg,
    systemBubbleText,
    greetingBubbleBg,
    greetingBubbleText,
    inputBackground,
    inputText,
    inputBorder,
    inputPlaceholder,
    labelText,
    inquiryIdleBg,
    inquiryIdleText,
    inquiryIdleBorder,
    inquirySelectedBg,
    inquirySelectedText,
    talkToAgentBackground,
    talkToAgentText,
    talkToAgentBorder,
    borderRadiusPx,
    inputFontSizePx,
    bodyFontSizePx,
    fontFamily,
  };
}

/** Build `theme.designJson.chat.colors` payload from wizard draft scalars. */
export function buildChatColorsFromDraftScalars(args: {
  buttonColor: string;
  buttonHoverColor: string;
  iconColor: string;
  headerTextColor: string;
  secondaryColor: string;
  panelBackground: string;
}): Record<string, string> {
  const {
    buttonColor,
    buttonHoverColor,
    iconColor,
    headerTextColor,
    secondaryColor,
    panelBackground,
  } = args;
  const incomingBg = mixHex(secondaryColor, panelBackground, 22);
  const incomingText = pickReadableText(incomingBg, headerTextColor);
  const panelBodyText = pickReadableText(panelBackground, headerTextColor);
  const panelLabelText = pickReadableText(panelBackground, headerTextColor);
  return {
    button: buttonColor,
    buttonHover: buttonHoverColor,
    icon: iconColor,
    headerText: headerTextColor,
    secondary: secondaryColor,
    panelBackground,
    bodyText: panelBodyText,
    mutedText: mixHex(panelBodyText, panelBackground, 62),
    incomingMessageBg: incomingBg,
    incomingMessageText: incomingText,
    outgoingMessageBg: buttonColor,
    outgoingMessageText: pickReadableText(buttonColor, iconColor),
    greetingBubbleBg: incomingBg,
    greetingBubbleText: incomingText,
    inputBackground: "#ffffff",
    inputText: pickReadableText("#ffffff", panelBodyText),
    inputBorderColor: mixHex(secondaryColor, panelBackground, 55),
    labelColor: panelLabelText,
    inquiryPillBg: panelBackground,
    inquiryPillText: pickReadableText(panelBackground, panelBodyText),
    inquiryPillBorder: mixHex(secondaryColor, panelBackground, 70),
    inquiryPillSelectedBg: buttonColor,
    inquiryPillSelectedText: pickReadableText(buttonColor, iconColor),
    talkToAgentButtonBg: panelBackground,
    talkToAgentButtonText: pickReadableText(panelBackground, headerTextColor),
    talkToAgentButtonBorder: buttonColor,
  };
}

export function readChatColorsRecord(
  colors: unknown,
): Record<string, unknown> | null {
  return isRecord(colors) ? colors : null;
}
