/** Shared hex → RGB for shell / theme UI (keeps `theme.ts` imports stable). */

function expandShortHex(h: string): string {
  if (h.length === 3) return h.split("").map((c) => c + c).join("");
  return h;
}

export function parseHexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.exec(hex.trim());
  if (!m) return { r: 15, g: 23, b: 42 };
  const full = expandShortHex(m[1]!);
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function hexToRgbaString(hex: string, alpha: number): string {
  const { r, g, b } = parseHexToRgb(hex);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
