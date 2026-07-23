/**
 * Prefer `@/theme` for RN ThemeProvider + tokens.
 * This path exists to mirror web `@/lib/theme` imports.
 */
export {
  appTheme,
  appColors,
  tokens,
  spacing,
  radii,
  typography,
  ThemeProvider,
  useAppTheme,
  useTheme,
} from '@/theme';
export type { AppTheme, AppColors, Tokens } from '@/theme';
export { useThemeColors, hexAlpha, dialogBackdropColor } from './use-theme-colors';
export { resolveRnCardFill, extractCssColor } from './rn-surface';