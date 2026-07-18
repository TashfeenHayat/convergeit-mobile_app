import { Platform, type ViewStyle } from 'react-native';

/** Shared liquid-glass visual tokens (reference: frosted panels + purple/blue accents). */
export const glassUi = {
  radius: {
    sm: 14,
    md: 20,
    lg: 24,
    pill: 999,
  },
  border: {
    light: 'rgba(255, 255, 255, 0.34)',
    subtle: 'rgba(255, 255, 255, 0.18)',
  },
  fill: {
    panel: 'rgba(255, 255, 255, 0.12)',
    panelStrong: 'rgba(255, 255, 255, 0.18)',
    activeNav: 'rgba(255, 255, 255, 0.14)',
  },
  gradient: {
    /** Soft tint under drawer blur — keep translucent so frost reads as glass. */
    sidebar: ['rgba(18, 22, 48, 0.55)', 'rgba(28, 34, 72, 0.42)', 'rgba(12, 14, 36, 0.58)'] as const,
    headerSheen: ['rgba(110, 142, 251, 0.12)', 'rgba(167, 119, 227, 0.08)', 'transparent'] as const,
    hero: ['#6e8efb', '#a777e3'] as const,
  },
  shadow: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#1f2687',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28,
      shadowRadius: 18,
    },
    android: { elevation: 8 },
    default: {},
  }),
  shadowSoft: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
    default: {},
  }),
} as const;
