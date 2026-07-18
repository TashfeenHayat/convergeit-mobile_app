import { APPEARANCE_PRESET_BY_ID, DEFAULT_THEME_GROUP_IDS, PICK_COLOR_PRESET_ID } from "./appearance-presets";
import type { AppearancePreset } from "./appearance-preset.types";
import { resolveAppearanceFromAccountBackgroundColor } from "./account-theme";
import {
  formatCustomGradientPair,
  normalizeHex,
  parseCustomGradientPair,
} from "./custom-accent-theme";

export function persistBackgroundColorHex(
  presetId: string,
  customAccentHex: string,
  customAccentEndHex: string,
): string {
  if (presetId === PICK_COLOR_PRESET_ID) {
    return formatCustomGradientPair(customAccentHex, customAccentEndHex);
  }
  const preset = APPEARANCE_PRESET_BY_ID[presetId];
  return preset ? normalizeHex(preset.previewBar) : formatCustomGradientPair(customAccentHex, customAccentEndHex);
}

export function parseBackgroundColor(raw: unknown): string | null {
  if (raw == null || String(raw).trim() === "") return null;
  const trimmed = String(raw).trim();
  const pair = parseCustomGradientPair(trimmed);
  if (pair) return formatCustomGradientPair(pair.startHex, pair.endHex);
  return normalizeHex(trimmed);
}

export function canonicalizeStoredBackgroundColor(raw: unknown): string | null {
  if (raw == null || String(raw).trim() === "") return null;
  const resolved = resolveAppearanceFromAccountBackgroundColor(String(raw).trim());
  if (!resolved) return parseBackgroundColor(raw);
  if (resolved.kind === "custom") {
    return formatCustomGradientPair(resolved.hex, resolved.endHex);
  }
  const preset = APPEARANCE_PRESET_BY_ID[resolved.id];
  return preset ? normalizeHex(preset.previewBar) : parseBackgroundColor(raw);
}

const defaultIdSet = new Set<string>(DEFAULT_THEME_GROUP_IDS);

export function getDefaultThemePresets(presets: AppearancePreset[]): AppearancePreset[] {
  return DEFAULT_THEME_GROUP_IDS.map((id) => presets.find((p) => p.id === id)).filter(
    (p): p is AppearancePreset => p != null,
  );
}

export function getSolidColorPresets(presets: AppearancePreset[]): AppearancePreset[] {
  return presets.filter((p) => !defaultIdSet.has(p.id) && p.id !== PICK_COLOR_PRESET_ID);
}
