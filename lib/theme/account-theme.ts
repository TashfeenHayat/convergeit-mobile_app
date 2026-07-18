import { APPEARANCE_PRESETS } from "./appearance-presets";
import {
  normalizeHex,
  parseCustomGradientPair,
  deriveGradientEndFromAccent,
} from "./custom-accent-theme";

export type AccountThemeResolution =
  | { kind: "preset"; id: string }
  | { kind: "custom"; hex: string; endHex: string };

function isValidHexInput(s: string): boolean {
  const t = s.trim();
  const withHash = t.startsWith("#") ? t : `#${t}`;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(withHash);
}

/**
 * Maps API `backgroundColor` (e.g. from `/auth/me` or login `user.theme`) to a dashboard preset or custom accent.
 * Custom gradients persist as `#start+#end`; legacy single-hex customs get a derived end stop.
 */
export function resolveAppearanceFromAccountBackgroundColor(
  raw: string | null | undefined,
): AccountThemeResolution | null {
  if (raw == null || String(raw).trim() === "") return null;
  const trimmed = String(raw).trim();

  const pair = parseCustomGradientPair(trimmed);
  if (pair) {
    return { kind: "custom", hex: pair.startHex, endHex: pair.endHex };
  }

  if (!isValidHexInput(trimmed)) return null;

  const hex = normalizeHex(trimmed);
  const presetMatch = APPEARANCE_PRESETS.find(
    (p) => p.previewBar.toLowerCase() === hex.toLowerCase(),
  );
  if (presetMatch) return { kind: "preset", id: presetMatch.id };
  return { kind: "custom", hex, endHex: deriveGradientEndFromAccent(hex) };
}
