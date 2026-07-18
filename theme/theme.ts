/**
 * Design tokens mirrored from
 * `converge_saas_frontend/theme/theme.ts` → `theme.app`.
 * No MUI — React Native StyleSheet / LinearGradient consumers only.
 * Access via `useAppTheme().app` (same mental model as web).
 */

/** CSS string kept for parity with web; prefer `mainBackgroundGradientStops` on RN. */
export const mainBackgroundGradient =
  'linear-gradient(180deg, #050508 0%, #0a0a2c 100%)';

/** Expo / RN LinearGradient-friendly stops (same colors as web midnight gradient). */
export const mainBackgroundGradientStops = {
  colors: ['#050508', '#0a0a2c'] as const,
  locations: [0, 1] as const,
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

/** Design tokens: app palette. Single source of truth; access via theme.app. */
const appColors = {
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(203, 213, 225, 0.8)',
    link: 'rgba(203, 213, 225, 0.9)',
    or: 'rgba(148, 163, 184, 0.8)',
    placeholder: '#CFC6C6',
    iconMuted: 'rgba(255, 255, 255, 0.7)',
    /** Mobile alias — maps to dashboard textSubtleMuted / muted chrome labels. */
    muted: 'rgba(255, 255, 255, 0.5)',
  },
  border: {
    divider: 'rgba(148, 163, 184, 0.3)',
    input: 'rgba(255, 255, 255, 0.23)',
    inputFocus: 'rgba(255, 255, 255, 0.4)',
  },
  shadow: {
    inputFocus: 'rgba(255, 255, 255, 0.2)',
    buttonHoverBg: 'rgba(255, 255, 255, 0.04)',
  },
  grey: {
    checkboxBorder: '#CCCCCC',
    inputShadowLight: '#F2F2F2',
    inputShadowWhite: '#FFFFFF',
    inputShadowWhite80: 'rgba(255, 255, 255, 0.5)',
    inputShadowDark: '#262626',
    inputShadowDarker: '#333333',
    socialButtonDark: '#333331',
  },
  /** RN-only solid stops for screens that cannot use CSS gradients. */
  background: {
    top: '#050508',
    bottom: '#0a0a2c',
    loaderCenter: '#09013F',
    loaderEdge: '#00011A',
  },
  dashboard: {
    headerBorderGradient: 'linear-gradient(90deg, #202225 0%, #5865f2 100%)',
    shellBorder: 'rgba(255, 255, 255, 0.1)',
    /** Numeric radius for StyleSheet (web uses `"28px"`). */
    shellRadius: 28,
    navItemSelectedBg: 'rgba(88, 101, 242, 0.22)',
    navSelectedInsetShadow: undefined as string | undefined,
    searchChromeBorder: '#181818',
    textSubtleMuted: 'rgba(255, 255, 255, 0.5)',
    menuSurfaceBg: '#1e1f22',
    mobileSearchBarBg: 'rgba(43, 45, 49, 0.96)',
    mobileSearchBackdrop: 'rgba(0, 0, 0, 0.4)',
    white80: 'rgba(255, 255, 255, 0.8)',
    white90: 'rgba(255, 255, 255, 0.9)',
    mobileSearchBarShadow: undefined as string | undefined,
    sidebarBg: '#2b2d31',
    headerBg: '#1e1f22',
    contentBg: 'linear-gradient(180deg, #1e1f22 0%, #2b2d31 100%)',
    contentBgStops: ['#1e1f22', '#2b2d31'] as const,
    cardBg: 'rgba(26, 28, 36, 0.36)',
    cardBackdropBlur: undefined as string | undefined,
    sidebarBackdropBlur: 'none' as const,
    headerBackdropBlur: 'none' as const,
    mainBackdropBlur: 'none' as const,
    cardBorder: 'rgba(255, 255, 255, 0.22)',
    navActiveBg: 'rgba(88, 101, 242, 0.24)',
    sidebarNavIconMuted: 'rgba(255, 255, 255, 0.72)',
    accentBlue: '#5865F2',
    /** Darker press/hover for primary CTAs (RN — no MUI darken). */
    accentBlueDark: '#4752C4',
    accentOrange: '#F97316',
    accentPink: '#EC4899',
    accentPurple: '#A855F7',
    accentGreen: '#22C55E',
    accentRed: '#EF4444',
    accentCyan: '#67E8F9',
    accentViolet: '#A78BFA',
    accentIndigo: '#6366F1',
    accentYellow: '#EAB308',
    accentRedLight: '#FCA5A5',
    accentGreenLight: '#4ADE80',
    accentPinkLight: '#F9A8D4',
    blueTint: '#93C5FD',
    blueTintBg: 'rgba(59, 130, 246, 0.16)',
    pinkTintBg: 'rgba(244, 114, 182, 0.16)',
    successTintBg: 'rgba(22, 163, 74, 0.12)',
    errorTintBg: 'rgba(239, 68, 68, 0.12)',
    buttonIndigo: '#4F46E5',
    tableDivider: '#838080',
    iconMuted: '#E5E7EB',
    textMuted: 'rgba(148, 163, 184, 0.9)',
    textMuted95: 'rgba(148, 163, 184, 0.95)',
    overlayLight: 'rgba(255, 255, 255, 0.06)',
    overlayMedium: 'rgba(255, 255, 255, 0.08)',
    overlayBorder: 'rgba(255, 255, 255, 0.2)',
    modalOverlay: 'rgba(33, 33, 33, 0.8)',
    backdropDark: 'rgba(0, 0, 0, 0.55)',
    white60: 'rgba(255, 255, 255, 0.6)',
    white65: 'rgba(255, 255, 255, 0.65)',
    white7: 'rgba(255, 255, 255, 0.7)',
    white95: 'rgba(255, 255, 255, 0.95)',
    surfaceDark: 'rgba(15, 23, 42, 0.9)',
    closeIconDanger: '#C22E2E',
    radioActiveBorder: 'rgba(34, 197, 94, 0.6)',
    radioInactiveBorder: 'rgba(148, 163, 184, 0.6)',
    radioActiveRing: 'rgba(34, 197, 94, 0.35)',
    glassGradient: undefined as string | undefined,
    glassShadow: undefined as string | undefined,
    cardGlassShadow: 'none' as const,
    liveChat: {
      cardBg: '#0f1220',
      messageBg: '#3A3B3C',
      avatarBg: '#0084FF',
      messageText: '#FFFFFF',
      cardGlass: 'rgba(255,255,255,0.08)',
    },
    chartPurple: '#3A3258',
    chartViolet: '#6B46C1',
    pillBg: '#2b2d31',
    pillActive: '#1e1f22',
    primaryTint: '#0048B70A',
    gradientButton: 'linear-gradient(135deg, #1F2937 0%, #020617 100%)',
    gradientButtonStops: ['#1F2937', '#020617'] as const,
    gradientButtonText: 'rgba(248, 250, 252, 0.98)',
    gradientIcon: 'radial-gradient(100% 100% at 50% 0%, #A855F7 0%, #312E81 100%)',
    /** Mobile surface aliases used by existing StyleSheets. */
    surface: '#1e1f22',
    surfaceElevated: '#2b2d31',
  },
  danger: '#EF4444',
  disabled: 'rgba(255, 255, 255, 0.35)',
} as const;

/** Exported for appearance presets / dynamic theme merge. */
export const defaultAppColors = appColors;
export { appColors };

export type AppColors = typeof appColors;
export type PaletteMode = 'light' | 'dark';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  screen: 16,
  screenLg: 20,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 28,
  pill: 9999,
} as const;

export const typography = {
  medium: { fontSize: 14, fontWeight: '400' as const, letterSpacing: 0.3, lineHeight: 20 },
  medium16: { fontSize: 16, fontWeight: '500' as const, letterSpacing: 0.2, lineHeight: 22 },
  mediumLarge: { fontSize: 20, fontWeight: '500' as const, letterSpacing: 0.2, lineHeight: 26 },
  small: { fontSize: 12, fontWeight: '400' as const, letterSpacing: 0.3, lineHeight: 16 },
  boldLarge: { fontSize: 23, fontWeight: '700' as const, letterSpacing: 0.3, lineHeight: 28 },
  regularLarge: { fontSize: 22, fontWeight: '400' as const, letterSpacing: 0.1, lineHeight: 26 },
  button: { fontSize: 15, fontWeight: '600' as const, letterSpacing: 0.2, lineHeight: 20 },
  label: { fontSize: 16, fontWeight: '500' as const, letterSpacing: 0.2, lineHeight: 22 },
  screenTitle: { fontSize: 18, fontWeight: '600' as const, letterSpacing: 0.2, lineHeight: 24 },
} as const;

function clampByte(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

/** Lightweight hex darken (MUI `darken` stand-in for accent CTAs). */
export function darkenHex(hex: string, amount: number): string {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return hex;
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  const f = 1 - amount;
  return `#${[r, g, b]
    .map((c) => clampByte(c * f).toString(16).padStart(2, '0'))
    .join('')}`;
}

function accentCtaGradientStops(accent: string): readonly [string, string] {
  return [darkenHex(accent, 0.32), darkenHex(accent, 0.58)] as const;
}

/**
 * Resolve palette mode overrides (mirrors web `createAppMuiTheme` token merge,
 * without MUI component styleOverrides).
 */
export function createAppTheme(
  app: typeof appColors = appColors,
  appBackground: string = mainBackgroundGradient,
  paletteMode: PaletteMode = 'dark',
) {
  const accent = app.dashboard.accentBlue;
  const normalizedTextMuted =
    paletteMode === 'light' ? 'rgba(15, 23, 42, 0.82)' : 'rgba(226, 232, 240, 0.88)';
  const normalizedTextMuted95 =
    paletteMode === 'light' ? 'rgba(15, 23, 42, 0.92)' : 'rgba(226, 232, 240, 0.95)';
  const d = app.dashboard;
  const ctaStops = accentCtaGradientStops(accent);

  const appResolved = {
    ...app,
    dashboard: {
      ...d,
      gradientButton: `linear-gradient(135deg, ${ctaStops[0]} 0%, ${ctaStops[1]} 100%)`,
      gradientButtonStops: ctaStops,
      accentBlueDark: darkenHex(accent, 0.15),
      textMuted: normalizedTextMuted,
      textMuted95: normalizedTextMuted95,
      liveChat: {
        ...d.liveChat,
        cardBg: d.sidebarBg || d.headerBg || d.liveChat.cardBg,
        messageBg: d.liveChat.messageBg,
        avatarBg: accent,
        messageText: app.text.primary,
        cardGlass: d.overlayLight,
      },
    },
  } as unknown as typeof appColors;

  return {
    app: appResolved,
    appBackground,
    paletteMode,
    spacing,
    radii,
    typography,
  };
}

export type AppTheme = ReturnType<typeof createAppTheme>;

/** Static default; runtime theme may be overridden by `ThemeProvider` / ThemeRegistry. */
export const theme = createAppTheme(appColors, mainBackgroundGradient, 'dark');
export const appTheme: AppTheme = theme;

/**
 * Flat token map used by many StyleSheets.
 * Prefer `useAppTheme().app` for new code — kept for gradual migration.
 */
export const tokens = {
  colors: {
    backgroundTop: appColors.background.top,
    backgroundBottom: appColors.background.bottom,
    loaderCenter: appColors.background.loaderCenter,
    loaderEdge: appColors.background.loaderEdge,
    accentBlue: appColors.dashboard.accentBlue,
    accentBlueDark: appColors.dashboard.accentBlueDark,
    accentOrange: appColors.dashboard.accentOrange,
    accentGreen: appColors.dashboard.accentGreen,
    accentRed: appColors.dashboard.accentRed,
    accentPink: appColors.dashboard.accentPink,
    accentCyan: appColors.dashboard.accentCyan,
    accentPurple: appColors.dashboard.accentPurple,
    accentYellow: appColors.dashboard.accentYellow,
    surface: appColors.dashboard.surface,
    surfaceElevated: appColors.dashboard.surfaceElevated,
    /** Soft pill chrome (slightly translucent vs raw web hex). */
    pillBg: 'rgba(43, 45, 49, 0.9)',
    pillActive: appColors.dashboard.navItemSelectedBg,
    cardBorder: appColors.dashboard.cardBorder,
    overlayBorder: appColors.dashboard.shellBorder,
    textPrimary: appColors.text.primary,
    textSecondary: appColors.text.secondary,
    textMuted: appColors.text.muted,
    textPlaceholder: appColors.text.placeholder,
    border: appColors.border.divider,
    inputBorder: appColors.border.input,
    inputBorderFocus: appColors.border.inputFocus,
    danger: appColors.danger,
    disabled: appColors.disabled,
    liveChatMessage: appColors.dashboard.liveChat.messageBg,
    liveChatCard: appColors.dashboard.liveChat.cardBg,
  },
  radius: radii,
  space: spacing,
  typography,
} as const;

export type Tokens = typeof tokens;
