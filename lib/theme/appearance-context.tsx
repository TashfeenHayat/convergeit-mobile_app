import { createContext, useContext } from "react";
import type { AppearancePreset } from "./appearance-presets";

export type AppearanceContextValue = {
  /** False until SecureStore appearance has been read. */
  ready: boolean;
  presetId: string;
  setPresetId: (id: string) => void;
  presets: AppearancePreset[];
  /** Gradient start + primary accent. */
  customAccentHex: string;
  setCustomAccentHex: (hex: string) => void;
  /** Gradient end color (client-set). */
  customAccentEndHex: string;
  setCustomAccentEndHex: (hex: string) => void;
  /**
   * Apply saved account color from API (`user.theme.backgroundColor`).
   * Accepts single hex or `#start+#end`. No-op when null/empty/invalid.
   */
  applyAccountTheme: (backgroundColor: string | null | undefined) => void;
};

export const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function useAppearance() {
  const v = useContext(AppearanceContext);
  if (!v) {
    throw new Error("useAppearance must be used within ThemeRegistry");
  }
  return v;
}
