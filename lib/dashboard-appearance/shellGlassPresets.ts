import type { GlassChrome, ShellGlassPreset } from "./types";

type Pair = { sidebar: GlassChrome; header: GlassChrome };

/** Fewer knobs for users: one “glass strength” updates sidebar + header together. */
export const SHELL_GLASS_PRESETS: Record<ShellGlassPreset, Pair> = {
  light: {
    sidebar: { blurPx: 14, fillOpacity: 0.28, tintHex: "#0B1220", borderOpacity: 0.09 },
    header: { blurPx: 12, fillOpacity: 0.3, tintHex: "#0F172A", borderOpacity: 0.08 },
  },
  medium: {
    sidebar: { blurPx: 28, fillOpacity: 0.4, tintHex: "#0B1220", borderOpacity: 0.11 },
    header: { blurPx: 22, fillOpacity: 0.42, tintHex: "#0F172A", borderOpacity: 0.1 },
  },
  heavy: {
    sidebar: { blurPx: 38, fillOpacity: 0.58, tintHex: "#0B1220", borderOpacity: 0.14 },
    header: { blurPx: 32, fillOpacity: 0.55, tintHex: "#0F172A", borderOpacity: 0.12 },
  },
};

export function inferShellGlassPreset(sidebar: GlassChrome): ShellGlassPreset {
  let best: ShellGlassPreset = "medium";
  let bestScore = Infinity;
  (Object.keys(SHELL_GLASS_PRESETS) as ShellGlassPreset[]).forEach((key) => {
    const s = SHELL_GLASS_PRESETS[key].sidebar;
    const score =
      Math.abs(s.blurPx - sidebar.blurPx) * 2 + Math.abs(s.fillOpacity - sidebar.fillOpacity) * 120;
    if (score < bestScore) {
      bestScore = score;
      best = key;
    }
  });
  return best;
}
