import { useMemo } from "react";

import { resolveRnCardFill } from "@/lib/theme/rn-surface";
import { useAppTheme } from "@/theme/ThemeProvider";

/**
 * Live color map from the active appearance preset — mirrors static `tokens.colors`
 * but updates when Theme / White / Nitro / custom accent changes (web `theme.app` parity).
 */
export function useThemeColors() {
  const theme = useAppTheme();
  const { app, paletteMode } = theme;
  const d = app.dashboard;
  const isLight = paletteMode === "light";

  return useMemo(
    () => ({
      isLight,
      paletteMode,
      backgroundTop: app.background.top,
      backgroundBottom: app.background.bottom,
      accentBlue: d.accentBlue,
      accentBlueDark: d.accentBlueDark,
      accentOrange: d.accentOrange,
      accentGreen: d.accentGreen,
      accentRed: d.accentRed,
      accentPink: d.accentPink,
      accentCyan: d.accentCyan,
      accentPurple: d.accentPurple,
      accentYellow: d.accentYellow,
      surface: d.surface,
      surfaceElevated: d.surfaceElevated,
      pillBg: d.pillBg,
      pillActive: d.pillActive,
      cardBg: d.cardBg,
      cardBorder: d.cardBorder,
      overlayBorder: d.overlayBorder ?? d.shellBorder,
      overlayLight: d.overlayLight,
      textPrimary: app.text.primary,
      textSecondary: app.text.secondary,
      textMuted: d.textMuted ?? app.text.muted,
      textPlaceholder: app.text.placeholder,
      border: app.border.divider,
      inputBorder: app.border.input,
      inputBorderFocus: app.border.inputFocus,
      danger: app.danger,
      disabled: app.disabled,
      sidebarBg: d.sidebarBg,
      headerBg: d.headerBg,
      navActiveBg: d.navActiveBg ?? d.navItemSelectedBg,
      navItemSelectedBg: d.navItemSelectedBg,
      modalOverlay: d.modalOverlay,
      backdropDark: d.backdropDark,
      gradientButtonText: d.gradientButtonText,
      /** Preset card tint (Forest bronze green glass, etc.) — not hardcoded purple */
      cardGlassFill: resolveRnCardFill(d.cardBg, d.surface || d.headerBg, isLight),
      cardRimHighlight: isLight ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.32)",
    }),
    [app, d, isLight, paletteMode],
  );
}

/** Hex `#RRGGBB` → `rgba(r,g,b,a)` — mirrors MUI `alpha` for RN styles. */
export function hexAlpha(hex: string, alpha: number): string {
  const raw = hex.replace("#", "").trim();
  if (raw.length !== 6 && raw.length !== 8) return hex;
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Web `dialogBackdropBackground` — accent-tinted scrim behind modals.
 * RN uses a solid approximaton of the gradient.
 */
export function dialogBackdropColor(accent: string, isLight: boolean, opacity = 0.42): string {
  if (isLight) {
    return hexAlpha("#0f172a", Math.min(0.55, opacity + 0.08));
  }
  return hexAlpha("#020617", Math.min(0.82, opacity + 0.2));
}
