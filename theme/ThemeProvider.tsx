import { createContext, useContext, useMemo, type ReactNode } from 'react';

import {
  appTheme,
  createAppTheme,
  defaultAppColors,
  mainBackgroundGradient,
  type AppTheme,
  type PaletteMode,
} from '@/theme/theme';

const ThemeContext = createContext<AppTheme>(appTheme);

export type ThemeProviderProps = {
  children: ReactNode;
  /** Optional palette override (appearance presets). */
  appColors?: typeof defaultAppColors;
  appBackground?: string;
  paletteMode?: PaletteMode;
};

/** Mirrors web ThemeRegistry — provides `theme.app` tokens to the tree. */
export function ThemeProvider({
  children,
  appColors,
  appBackground = mainBackgroundGradient,
  paletteMode = 'dark',
}: ThemeProviderProps) {
  const value = useMemo(
    () =>
      appColors
        ? createAppTheme(appColors, appBackground, paletteMode)
        : appTheme,
    [appColors, appBackground, paletteMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): AppTheme {
  return useContext(ThemeContext);
}

/** Alias matching web `useTheme()` mental model. */
export function useTheme(): AppTheme {
  return useAppTheme();
}
