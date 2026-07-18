/**
 * ConvergeIT mobile color tokens — aligned with web `theme.app`.
 */
import { appColors } from '@/theme/theme';

const accentBlue = appColors.dashboard.accentBlue;

export const AppColors = {
  backgroundTop: appColors.background.top,
  backgroundBottom: appColors.background.bottom,
  accentBlue,
  accentOrange: appColors.dashboard.accentOrange,
  accentGreen: appColors.dashboard.accentGreen,
  accentRed: appColors.dashboard.accentRed,
  sidebarBg: appColors.dashboard.sidebarBg,
  headerBg: appColors.dashboard.headerBg,
  liveChatCard: appColors.dashboard.liveChat.cardBg,
  liveChatMessage: appColors.dashboard.liveChat.messageBg,
  textPrimary: appColors.text.primary,
  textSecondary: appColors.text.secondary,
  border: appColors.border.divider,
} as const;

export default {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: accentBlue,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: accentBlue,
  },
  dark: {
    text: AppColors.textPrimary,
    background: AppColors.backgroundBottom,
    tint: accentBlue,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: accentBlue,
  },
};
