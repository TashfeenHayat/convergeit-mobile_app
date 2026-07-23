/**
 * RN helpers for appearance `cardBg` / CSS gradients (web uses full CSS; mobile needs solids).
 */

/** First `#RRGGBB` or `rgba(...)` found in a CSS color / gradient string. */
export function extractCssColor(value: string | undefined, fallback: string): string {
  if (!value || typeof value !== "string") return fallback;
  const rgba = value.match(/rgba?\([^)]+\)/i);
  if (rgba) return rgba[0];
  const hex = value.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/);
  if (hex) return hex[0];
  return fallback;
}

/**
 * Card fill for RN — prefer preset `cardBg` (Forest bronze green glass, etc.).
 * CSS multi-layer gradients fall back to a readable solid so purple LiquidGlass never paints over themed BGs.
 */
export function resolveRnCardFill(
  cardBg: string | undefined,
  surface: string,
  isLight: boolean,
): string {
  const fallback = isLight ? "rgba(255, 255, 255, 0.92)" : surface;
  if (!cardBg) return fallback;

  if (cardBg.includes("gradient") || cardBg.includes("blur(")) {
    // Discord default multi-layer glass — opaque-enough solid for RN
    return isLight ? "rgba(255, 255, 255, 0.88)" : "rgba(26, 28, 36, 0.92)";
  }

  const color = extractCssColor(cardBg, fallback);
  // Boost very translucent theme cards so background gradient does not muddy text
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i);
  if (m) {
    const a = m[4] !== undefined ? Number(m[4]) : 1;
    if (a < 0.72) {
      return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${Math.max(0.78, a + 0.32)})`;
    }
  }
  return color;
}

/** Diagonal page gradient stops — mirrors web `appBackground` 135deg for nitro themes. */
export function resolveScreenGradientStops(
  top: string,
  bottom: string,
  contentStops?: readonly [string, string] | string[],
): [string, string, string] {
  const a = contentStops?.[0] ?? top;
  const b = contentStops?.[1] ?? bottom;
  // Mid blend so 135deg feel reads on a simple 3-stop LinearGradient
  return [a, a, b];
}
