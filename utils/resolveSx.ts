import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import type { AppTheme } from '@/theme/theme';

export type ThemeStyle = StyleProp<ViewStyle | TextStyle>;

export type ThemeStyleInput =
  | ThemeStyle
  | ((theme: AppTheme) => ThemeStyle)
  | null
  | undefined;

/**
 * Resolves a style prop when it is a function of theme.
 * RN stand-in for web `utils/resolveSx` (MUI `sx`).
 * Callers can pass either a style object/array or `(theme) => style`.
 */
export function resolveSx(sx: ThemeStyleInput, theme: AppTheme): ThemeStyle {
  if (sx == null) return {};
  if (typeof sx === 'function') return sx(theme);
  return sx;
}

/** Alias preferred for new RN code. */
export const resolveStyle = resolveSx;
