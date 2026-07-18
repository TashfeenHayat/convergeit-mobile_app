import type { EmailTemplateBlockKey } from "../constants/email-template-blocks";

export type EmailHeaderLayout =
  | "hero_banner"
  | "platform_banner"
  | "custom_banner"
  | "logo_bar"
  | "minimal";

export type EmailSectionHeaderStyle = "bar" | "underline" | "pill";
export type EmailLogoPosition = "below_banner" | "above_banner" | "on_banner" | "hidden";
export type EmailFieldIconStyle = "mui" | "emoji" | "symbol" | "minimal";

export type EmailTemplateTheme = {
  presetId?: string;
  backgroundColor?: string;
  contentBackground?: string;
  textColor?: string;
  mutedTextColor?: string;
  headerLayout?: EmailHeaderLayout;
  showPlatformHeader?: boolean;
  headerTagline?: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerTitleFontSize?: number;
  bannerOverlayColor?: string;
  bannerOverlayOpacity?: number;
  bannerTextColor?: string;
  logoPosition?: EmailLogoPosition;
  globalIconStyle?: EmailFieldIconStyle;
  sectionHeaderStyle?: EmailSectionHeaderStyle;
  footerBackground?: string;
  footerTextColor?: string;
  footerNote?: string;
  footerCompanyName?: string;
  footerSupportEmail?: string;
  showPoweredBy?: boolean;
};

export type EmailTemplateThemeJson = EmailTemplateTheme;

export const DEFAULT_EMAIL_THEME: EmailTemplateTheme = {
  presetId: "chat_alert",
  backgroundColor: "#eef2f7",
  contentBackground: "#ffffff",
  textColor: "#1e293b",
  mutedTextColor: "#475569",
  headerLayout: "hero_banner",
  showPlatformHeader: false,
  headerTagline: "",
  bannerTitle: "New Web Chat Alert",
  bannerSubtitle: "",
  bannerTitleFontSize: 22,
  bannerOverlayColor: "#0f2744",
  bannerOverlayOpacity: 0.55,
  bannerTextColor: "#ffffff",
  logoPosition: "below_banner",
  globalIconStyle: "mui",
  sectionHeaderStyle: "bar",
  footerBackground: "#1a57a5",
  footerTextColor: "#ffffff",
  footerNote: "NOTE: This is a system generated email. Please do not reply.",
  footerCompanyName: "",
  footerSupportEmail: "",
  showPoweredBy: false,
};

export type EmailThemePreset = {
  id: string;
  label: string;
  description: string;
  swatch: string;
  primaryColor: string;
  theme: EmailTemplateTheme;
};

export const EMAIL_THEME_PRESETS: EmailThemePreset[] = [
  {
    id: "chat_alert",
    label: "Chat Alert",
    description: "Reference design — blue headers & hero banner",
    swatch: "linear-gradient(135deg,#1a57a5,#2563eb)",
    primaryColor: "#1a57a5",
    theme: { ...DEFAULT_EMAIL_THEME },
  },
  {
    id: "ocean",
    label: "Ocean",
    description: "Clean blue — professional SaaS",
    swatch: "linear-gradient(135deg,#2563eb,#0ea5e9)",
    primaryColor: "#2563eb",
    theme: {
      ...DEFAULT_EMAIL_THEME,
      presetId: "ocean",
      bannerTitle: "New Web Chat Alert",
      footerBackground: "#2563eb",
    },
  },
  {
    id: "forest",
    label: "Forest",
    description: "Teal accent — calm support",
    swatch: "linear-gradient(135deg,#0d9488,#14b8a6)",
    primaryColor: "#0d9488",
    theme: {
      ...DEFAULT_EMAIL_THEME,
      presetId: "forest",
      backgroundColor: "#ecfdf5",
      footerBackground: "#134e4a",
    },
  },
  {
    id: "slate",
    label: "Slate",
    description: "Enterprise underline sections",
    swatch: "linear-gradient(135deg,#334155,#0f172a)",
    primaryColor: "#334155",
    theme: {
      ...DEFAULT_EMAIL_THEME,
      presetId: "slate",
      sectionHeaderStyle: "underline",
      footerBackground: "#020617",
    },
  },
];

function num01(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1, Math.max(0, n));
}

export function normalizeEmailTheme(raw: unknown): EmailTemplateTheme {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_EMAIL_THEME };
  }
  const o = raw as Record<string, unknown>;
  const layouts: EmailHeaderLayout[] = [
    "hero_banner",
    "platform_banner",
    "custom_banner",
    "logo_bar",
    "minimal",
  ];
  const logoPositions: EmailLogoPosition[] = [
    "below_banner",
    "above_banner",
    "on_banner",
    "hidden",
  ];
  return {
    ...DEFAULT_EMAIL_THEME,
    presetId: typeof o.presetId === "string" ? o.presetId : DEFAULT_EMAIL_THEME.presetId,
    backgroundColor:
      typeof o.backgroundColor === "string" ? o.backgroundColor : DEFAULT_EMAIL_THEME.backgroundColor,
    contentBackground:
      typeof o.contentBackground === "string"
        ? o.contentBackground
        : DEFAULT_EMAIL_THEME.contentBackground,
    textColor: typeof o.textColor === "string" ? o.textColor : DEFAULT_EMAIL_THEME.textColor,
    mutedTextColor:
      typeof o.mutedTextColor === "string" ? o.mutedTextColor : DEFAULT_EMAIL_THEME.mutedTextColor,
    headerLayout: layouts.includes(o.headerLayout as EmailHeaderLayout)
      ? (o.headerLayout as EmailHeaderLayout)
      : DEFAULT_EMAIL_THEME.headerLayout,
    showPlatformHeader: o.showPlatformHeader !== false && o.showPlatformHeader !== "false",
    headerTagline: typeof o.headerTagline === "string" ? o.headerTagline : "",
    bannerTitle:
      typeof o.bannerTitle === "string" ? o.bannerTitle : DEFAULT_EMAIL_THEME.bannerTitle,
    bannerSubtitle: typeof o.bannerSubtitle === "string" ? o.bannerSubtitle : "",
    bannerTitleFontSize:
      typeof o.bannerTitleFontSize === "number" && Number.isFinite(o.bannerTitleFontSize)
        ? Math.min(48, Math.max(14, o.bannerTitleFontSize))
        : DEFAULT_EMAIL_THEME.bannerTitleFontSize,
    bannerOverlayColor:
      typeof o.bannerOverlayColor === "string"
        ? o.bannerOverlayColor
        : DEFAULT_EMAIL_THEME.bannerOverlayColor,
    bannerOverlayOpacity: num01(
      o.bannerOverlayOpacity,
      DEFAULT_EMAIL_THEME.bannerOverlayOpacity ?? 0.55,
    ),
    bannerTextColor:
      typeof o.bannerTextColor === "string"
        ? o.bannerTextColor
        : DEFAULT_EMAIL_THEME.bannerTextColor,
    logoPosition: logoPositions.includes(o.logoPosition as EmailLogoPosition)
      ? (o.logoPosition as EmailLogoPosition)
      : DEFAULT_EMAIL_THEME.logoPosition,
    globalIconStyle:
      o.globalIconStyle === "emoji" ||
      o.globalIconStyle === "symbol" ||
      o.globalIconStyle === "minimal" ||
      o.globalIconStyle === "mui"
        ? o.globalIconStyle
        : "mui",
    sectionHeaderStyle:
      o.sectionHeaderStyle === "underline" ||
      o.sectionHeaderStyle === "pill" ||
      o.sectionHeaderStyle === "bar"
        ? o.sectionHeaderStyle
        : "bar",
    footerBackground:
      typeof o.footerBackground === "string"
        ? o.footerBackground
        : DEFAULT_EMAIL_THEME.footerBackground,
    footerTextColor:
      typeof o.footerTextColor === "string"
        ? o.footerTextColor
        : DEFAULT_EMAIL_THEME.footerTextColor,
    footerNote: typeof o.footerNote === "string" ? o.footerNote : DEFAULT_EMAIL_THEME.footerNote,
    footerCompanyName:
      typeof o.footerCompanyName === "string" ? o.footerCompanyName : "",
    footerSupportEmail:
      typeof o.footerSupportEmail === "string" ? o.footerSupportEmail : "",
    showPoweredBy: o.showPoweredBy === true || o.showPoweredBy === "true",
  };
}

export function applyThemePreset(presetId: string): {
  primaryColor: string;
  theme: EmailTemplateTheme;
} {
  const preset =
    EMAIL_THEME_PRESETS.find((p) => p.id === presetId) ?? EMAIL_THEME_PRESETS[0];
  return {
    primaryColor: preset.primaryColor,
    theme: { ...preset.theme },
  };
}

export const EMAIL_HEADER_LAYOUT_OPTIONS: {
  value: EmailHeaderLayout;
  label: string;
  hint: string;
}[] = [
  { value: "hero_banner", label: "Hero banner + title", hint: "Image/gradient with overlay text (reference design)" },
  { value: "custom_banner", label: "Custom banner image", hint: "Your hero image only" },
  { value: "platform_banner", label: "Platform + banner", hint: "Platform strip plus optional banner" },
  { value: "logo_bar", label: "Logo bar", hint: "Solid accent bar with logo" },
  { value: "minimal", label: "Minimal", hint: "Logo only" },
];

export const EMAIL_LOGO_POSITION_OPTIONS: { value: EmailLogoPosition; label: string }[] = [
  { value: "below_banner", label: "Below banner" },
  { value: "above_banner", label: "Above banner" },
  { value: "on_banner", label: "On banner (centered)" },
  { value: "hidden", label: "Hidden" },
];

export const EMAIL_ICON_STYLE_OPTIONS: { value: EmailFieldIconStyle; label: string }[] = [
  { value: "mui", label: "Material icons (recommended)" },
  { value: "emoji", label: "Emoji icons" },
  { value: "symbol", label: "Bullet dots" },
  { value: "minimal", label: "No icons" },
];

export const EMAIL_SECTION_STYLE_OPTIONS: {
  value: EmailSectionHeaderStyle;
  label: string;
}[] = [
  { value: "bar", label: "Color bar (reference)" },
  { value: "underline", label: "Underline" },
  { value: "pill", label: "Pill badge" },
];
