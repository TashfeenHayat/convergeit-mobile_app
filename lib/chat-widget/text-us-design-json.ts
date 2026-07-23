import type { WidgetInstallationAssetUrls } from "./build-widget-install-body";
import { textUsFormFieldsToApiPayload } from "./text-us-form-defaults";
import type { WidgetDraft } from "./widgetDraft";
import {
  clampHeaderMinHeightPx,
  clampHeaderRadiusPx,
  normalizeHeaderMode,
} from "@/lib/widget-runtime/header-mode";

function isHttpAssetUrl(value: string | undefined): boolean {
  const v = value?.trim();
  return Boolean(v && (v.startsWith("http://") || v.startsWith("https://")));
}

function mergeDraftAssetUrls(
  draft: WidgetDraft,
  assetUrls?: WidgetInstallationAssetUrls,
): WidgetInstallationAssetUrls {
  const merged: WidgetInstallationAssetUrls = { ...(assetUrls ?? {}) };
  if (!merged.textUsHeaderLogoPublicUrl && isHttpAssetUrl(draft.textUsHeaderLogoDataUrl)) {
    merged.textUsHeaderLogoPublicUrl = draft.textUsHeaderLogoDataUrl!.trim();
  }
  return merged;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function normalizeTextUsHeaderAlign(raw: unknown): "left" | "center" | "right" {
  const s = String(raw ?? "").toLowerCase();
  if (s === "center" || s === "right") return s;
  return "left";
}

/** Build `theme.designJson.textUs` from wizard draft. */
export function buildTextUsDesignJsonFromDraft(
  draft: WidgetDraft,
  assetUrls?: WidgetInstallationAssetUrls,
): Record<string, unknown> {
  const urls = mergeDraftAssetUrls(draft, assetUrls);
  const textUs: Record<string, unknown> = {
    buttonColor: draft.textUsButtonColor?.trim() || "#1E63D5",
    position: draft.textUsPosition?.trim() || "right",
    verticalAnchor: draft.textUsVerticalAnchor === "top" ? "top" : "bottom",
    insetBottomPx: clamp(draft.textUsInsetBottomPx ?? 28, 0, 480),
    insetTopPx: clamp(draft.textUsInsetTopPx ?? 28, 0, 480),
    insetSidePx: clamp(draft.textUsInsetSidePx ?? 28, 0, 480),
    boxWidth: clamp(draft.textUsBoxWidth ?? 360, 280, 520),
    boxHeight: clamp(draft.textUsBoxHeight ?? 480, 320, 640),
    headerTitle:
      draft.textUsHeaderTitleEnabled === false
        ? ""
        : draft.textUsHeaderTitle?.trim() || "Text Us",
    welcomeMessage: draft.textUsWelcomeMessage?.trim() || "",
  };

  if (draft.textUsHeaderTitleEnabled === false) {
    textUs.headerTitleEnabled = false;
  } else if (draft.textUsHeaderTitleEnabled === true) {
    textUs.headerTitleEnabled = true;
  }

  const buttonLabel = draft.textUsButtonLabel?.trim();
  if (buttonLabel) textUs.buttonLabel = buttonLabel;

  const hover = draft.textUsButtonHoverColor?.trim();
  if (hover) textUs.buttonHoverColor = hover;

  const iconColor = draft.textUsIconColor?.trim();
  if (iconColor) textUs.iconColor = iconColor;

  if (draft.textUsMotionEnabled === false) textUs.motionEnabled = false;
  else if (draft.textUsMotionEnabled === true) textUs.motionEnabled = true;

  const panelBg = draft.textUsPanelBackground?.trim();
  if (panelBg) textUs.panelBackground = panelBg;

  const logoUrl =
    urls.textUsHeaderLogoPublicUrl?.trim() ||
    (draft.textUsHeaderLogoDataUrl?.startsWith("http")
      ? draft.textUsHeaderLogoDataUrl.trim()
      : "");
  if (logoUrl) textUs.headerLogoUrl = logoUrl;

  const logoHeight = draft.textUsHeaderLogoHeightPx ?? 28;
  textUs.headerLogoHeightPx = clamp(logoHeight, 16, 96);
  textUs.headerLogoMaxWidthPx = clamp(draft.textUsHeaderLogoMaxWidthPx ?? 96, 48, 200);
  textUs.headerAlign = normalizeTextUsHeaderAlign(draft.textUsHeaderAlign);
  textUs.headerMode = normalizeHeaderMode(draft.textUsHeaderMode);
  textUs.headerMinHeightPx = clampHeaderMinHeightPx(draft.textUsHeaderMinHeightPx);
  textUs.headerRadiusPx = clampHeaderRadiusPx(draft.textUsHeaderRadiusPx);

  const launcher: Record<string, unknown> = {};
  if (draft.textUsLauncherIconEnabled === false) {
    launcher.iconEnabled = false;
  } else {
    launcher.iconEnabled = true;
    if (draft.textUsLauncherIconPreset?.trim()) {
      launcher.iconPreset = draft.textUsLauncherIconPreset.trim();
    }
  }
  if (draft.textUsLauncherStyle?.trim()) {
    launcher.style = draft.textUsLauncherStyle.trim();
  }
  const glowColor = draft.textUsGlowColor?.trim();
  if (glowColor) launcher.glowColor = glowColor;
  if (Object.keys(launcher).length > 0) textUs.launcher = launcher;

  const accent = draft.textUsAccent?.trim() || draft.themeDesignJsonAccent?.trim();
  if (accent) textUs.accent = accent;

  const density = draft.textUsDensity?.trim() || draft.themeDesignJsonDensity?.trim();
  if (density) textUs.density = density;

  textUs.fields = textUsFormFieldsToApiPayload(draft.textUsFormFields);

  return textUs;
}

export type TextUsThemePreviewInput = {
  buttonColor: string;
  buttonHoverColor?: string;
  iconColor?: string;
  position: string;
  verticalAnchor: string;
  insetBottomPx: number;
  insetTopPx: number;
  insetSidePx: number;
  boxWidth: number;
  boxHeight: number;
  headerTitle: string;
  headerTitleEnabled?: boolean;
  welcomeMessage: string;
  buttonLabel?: string;
  headerLogoUrl?: string;
  headerLogoHeightPx?: number;
  headerLogoMaxWidthPx?: number;
  headerAlign?: string;
  headerMode?: "attached" | "detached";
  headerMinHeightPx?: number;
  headerRadiusPx?: number;
  motionEnabled?: boolean;
  panelBackground?: string;
  launcherIconPreset?: string;
  launcherIconEnabled?: boolean;
  launcherStyle?: string;
  launcherGlowColor?: string;
  accent?: string;
  density?: string;
};

export function textUsThemePreviewPayload(input: TextUsThemePreviewInput): Record<string, unknown> {
  const theme: Record<string, unknown> = {
    buttonColor: input.buttonColor,
    position: input.position,
    verticalAnchor: input.verticalAnchor,
    insetBottomPx: input.insetBottomPx,
    insetTopPx: input.insetTopPx,
    insetSidePx: input.insetSidePx,
    boxWidth: input.boxWidth,
    boxHeight: input.boxHeight,
    headerTitle: input.headerTitleEnabled === false ? "" : input.headerTitle.trim() || "Text Us",
  };
  if (input.headerTitleEnabled === false) theme.headerTitleEnabled = false;
  else if (input.headerTitleEnabled === true) theme.headerTitleEnabled = true;
  if (input.buttonHoverColor?.trim()) theme.buttonHoverColor = input.buttonHoverColor.trim();
  if (input.iconColor?.trim()) theme.iconColor = input.iconColor.trim();
  const welcome = input.welcomeMessage.trim();
  if (welcome) theme.welcomeMessage = welcome;
  if (input.buttonLabel?.trim()) theme.buttonLabel = input.buttonLabel.trim();
  if (input.headerLogoUrl?.trim()) theme.headerLogoUrl = input.headerLogoUrl.trim();
  if (input.headerLogoHeightPx != null) theme.headerLogoHeightPx = input.headerLogoHeightPx;
  if (input.headerLogoMaxWidthPx != null) theme.headerLogoMaxWidthPx = input.headerLogoMaxWidthPx;
  if (input.headerAlign?.trim()) theme.headerAlign = normalizeTextUsHeaderAlign(input.headerAlign);
  theme.headerMode = normalizeHeaderMode(input.headerMode);
  theme.headerMinHeightPx = clampHeaderMinHeightPx(input.headerMinHeightPx);
  theme.headerRadiusPx = clampHeaderRadiusPx(input.headerRadiusPx);
  if (input.motionEnabled === false) theme.motionEnabled = false;
  if (input.panelBackground?.trim()) theme.panelBackground = input.panelBackground.trim();
  if (
    input.launcherIconPreset?.trim() ||
    input.launcherStyle?.trim() ||
    input.launcherIconEnabled === false ||
    input.launcherGlowColor?.trim()
  ) {
    theme.launcher = {
      ...(input.launcherIconEnabled === false ? { iconEnabled: false } : { iconEnabled: true }),
      ...(input.launcherIconPreset?.trim() ? { iconPreset: input.launcherIconPreset.trim() } : {}),
      ...(input.launcherStyle?.trim() ? { style: input.launcherStyle.trim() } : {}),
      ...(input.launcherGlowColor?.trim() ? { glowColor: input.launcherGlowColor.trim() } : {}),
    };
  }
  if (input.accent?.trim()) theme.accent = input.accent.trim();
  if (input.density?.trim()) theme.density = input.density.trim();
  return theme;
}
