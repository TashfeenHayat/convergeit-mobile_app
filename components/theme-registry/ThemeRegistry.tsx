import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { useColorScheme } from "@/components/useColorScheme";
import {
  APPEARANCE_PRESET_BY_ID,
  APPEARANCE_PRESETS,
  DEFAULT_APPEARANCE_PRESET_ID,
  PICK_COLOR_PRESET_ID,
  SYSTEM_DARK_PRESET_ID,
  resolveEffectiveAppearancePresetId,
} from "@/lib/theme/appearance-presets";
import { AppearanceContext } from "@/lib/theme/appearance-context";
import { resolveAppearanceFromAccountBackgroundColor } from "@/lib/theme/account-theme";
import {
  loadStoredAppearance,
  persistAppearancePresetId,
  persistCustomAccentEndHex,
  persistCustomAccentHex,
} from "@/lib/theme/appearance-storage";
import {
  DEFAULT_CUSTOM_ACCENT_END_HEX,
  DEFAULT_CUSTOM_ACCENT_HEX,
  deriveGradientEndFromAccent,
  getCustomAccentTheme,
  normalizeHex,
} from "@/lib/theme/custom-accent-theme";
import { mergeAppColors } from "@/lib/theme/merge-app-colors";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { createAppTheme, defaultAppColors } from "@/theme/theme";

/**
 * RN port of web `ThemeRegistry` — dynamic appearance presets + account theme sync.
 * When preset is "System", the active palette follows the device light/dark setting.
 */
export default function ThemeRegistry({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();
  const [mounted, setMounted] = useState(false);
  const [presetId, setPresetIdState] = useState(DEFAULT_APPEARANCE_PRESET_ID);
  const [customAccentHex, setCustomAccentHexState] = useState(DEFAULT_CUSTOM_ACCENT_HEX);
  const [customAccentEndHex, setCustomAccentEndHexState] = useState(DEFAULT_CUSTOM_ACCENT_END_HEX);
  const accountThemeAppliedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stored = await loadStoredAppearance();
        if (cancelled) return;
        if (stored.presetId && APPEARANCE_PRESET_BY_ID[stored.presetId]) {
          setPresetIdState(stored.presetId);
        }
        if (stored.customHex) {
          const start = normalizeHex(stored.customHex);
          setCustomAccentHexState(start);
          setCustomAccentEndHexState(
            stored.customEndHex ? normalizeHex(stored.customEndHex) : deriveGradientEndFromAccent(start),
          );
        } else if (stored.customEndHex) {
          setCustomAccentEndHexState(normalizeHex(stored.customEndHex));
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setMounted(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setPresetId = useCallback((id: string) => {
    if (!APPEARANCE_PRESET_BY_ID[id]) return;
    setPresetIdState(id);
    void persistAppearancePresetId(id);
  }, []);

  const selectPickColorPreset = useCallback(() => {
    setPresetIdState(PICK_COLOR_PRESET_ID);
    void persistAppearancePresetId(PICK_COLOR_PRESET_ID);
  }, []);

  const setCustomAccentHex = useCallback(
    (hex: string) => {
      const next = normalizeHex(hex);
      setCustomAccentHexState(next);
      selectPickColorPreset();
      void persistCustomAccentHex(next);
    },
    [selectPickColorPreset],
  );

  const setCustomAccentEndHex = useCallback(
    (hex: string) => {
      const next = normalizeHex(hex);
      setCustomAccentEndHexState(next);
      selectPickColorPreset();
      void persistCustomAccentEndHex(next);
    },
    [selectPickColorPreset],
  );

  const applyAccountTheme = useCallback(
    (backgroundColor: string | null | undefined) => {
      const resolved = resolveAppearanceFromAccountBackgroundColor(backgroundColor);
      if (!resolved) return;
      accountThemeAppliedRef.current = true;
      if (resolved.kind === "custom") {
        setCustomAccentHex(resolved.hex);
        setCustomAccentEndHex(resolved.endHex);
        return;
      }
      setPresetId(resolved.id);
    },
    [setCustomAccentHex, setCustomAccentEndHex, setPresetId],
  );

  const activePresetId = mounted ? presetId : DEFAULT_APPEARANCE_PRESET_ID;
  const effectivePresetId = resolveEffectiveAppearancePresetId(activePresetId, colorScheme);
  const activeCustomHex = mounted ? customAccentHex : DEFAULT_CUSTOM_ACCENT_HEX;
  const activeCustomEndHex = mounted ? customAccentEndHex : DEFAULT_CUSTOM_ACCENT_END_HEX;

  const preset =
    APPEARANCE_PRESET_BY_ID[effectivePresetId] ?? APPEARANCE_PRESET_BY_ID[SYSTEM_DARK_PRESET_ID];

  const themeProps = useMemo(() => {
    let appBackground = preset.appBackground;
    let paletteMode = preset.paletteMode;
    let patch: Record<string, unknown> = preset.patch;

    if (activePresetId === PICK_COLOR_PRESET_ID || preset.id === PICK_COLOR_PRESET_ID) {
      const custom = getCustomAccentTheme(activeCustomHex, activeCustomEndHex);
      appBackground = custom.appBackground;
      paletteMode = custom.paletteMode;
      patch = custom.patch;
    }

    const appColors = mergeAppColors(defaultAppColors, patch);
    return { appColors, appBackground, paletteMode };
  }, [preset, activePresetId, activeCustomHex, activeCustomEndHex]);

  const appearanceValue = useMemo(
    () => ({
      ready: mounted,
      presetId,
      setPresetId,
      presets: APPEARANCE_PRESETS,
      customAccentHex,
      setCustomAccentHex,
      customAccentEndHex,
      setCustomAccentEndHex,
      applyAccountTheme,
    }),
    [
      mounted,
      presetId,
      setPresetId,
      customAccentHex,
      setCustomAccentHex,
      customAccentEndHex,
      setCustomAccentEndHex,
      applyAccountTheme,
    ],
  );

  return (
    <AppearanceContext.Provider value={appearanceValue}>
      <ThemeProvider
        appColors={themeProps.appColors}
        appBackground={themeProps.appBackground}
        paletteMode={themeProps.paletteMode}
      >
        {children}
      </ThemeProvider>
    </AppearanceContext.Provider>
  );
}
