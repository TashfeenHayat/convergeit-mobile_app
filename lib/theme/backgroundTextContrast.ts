/**
 * Sample a representative RGB from any CSS `background` string and derive
 * primary / secondary text hexes with WCAG-minded contrast on that sample.
 */

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => clamp255(x).toString(16).padStart(2, "0")).join("")}`;
}

function expandShortHex(h: string): string {
  if (h.length === 3) return h.split("").map((c) => c + c).join("");
  return h;
}

function parseHexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.exec(hex.trim());
  if (!m) return null;
  const full = expandShortHex(m[1]);
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function parseRgbFuncInner(inner: string): { r: number; g: number; b: number; a: number } | null {
  const parts = inner.split(",").map((p) => p.trim());
  if (parts.length < 3) return null;
  const r = Number(parts[0]);
  const g = Number(parts[1]);
  const b = Number(parts[2]);
  const a = parts[3] !== undefined ? Number(parts[3]) : 1;
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return { r, g, b, a: Number.isNaN(a) ? 1 : a };
}

/** Pulls hex + rgb/rgba stops from gradients / layers and weights by alpha. */
export function sampleBackgroundRgb(css: string): { r: number; g: number; b: number } {
  const s = css.trim();
  const solo = parseHexToRgb(s);
  if (solo) return solo;

  const samples: { r: number; g: number; b: number; w: number }[] = [];
  for (const m of s.matchAll(/#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/g)) {
    const rgb = parseHexToRgb("#" + m[1]);
    if (rgb) samples.push({ ...rgb, w: 1 });
  }
  for (const m of s.matchAll(/rgba?\(([^)]+)\)/gi)) {
    const p = parseRgbFuncInner(m[1]!);
    if (!p) continue;
    samples.push({ r: p.r, g: p.g, b: p.b, w: Math.max(0, Math.min(1, p.a)) });
  }

  if (samples.length === 0) return { r: 8, g: 8, b: 18 };

  let tw = 0;
  let tr = 0;
  let tg = 0;
  let tb = 0;
  for (const q of samples) {
    tr += q.r * q.w;
    tg += q.g * q.w;
    tb += q.b * q.w;
    tw += q.w;
  }
  if (tw < 1e-6) return { r: 8, g: 8, b: 18 };
  return { r: Math.round(tr / tw), g: Math.round(tg / tw), b: Math.round(tb / tw) };
}

/** Brightest colour stop in the CSS string — layered gradients often include light stops that must pull UI toward dark ink. */
export function brightestStopLuminance(css: string): number {
  const s = css.trim();
  let maxL = 0;
  const solo = parseHexToRgb(s);
  if (solo) return relativeLuminance(solo);
  for (const m of s.matchAll(/#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/g)) {
    const rgb = parseHexToRgb("#" + m[1]);
    if (rgb) maxL = Math.max(maxL, relativeLuminance(rgb));
  }
  for (const m of s.matchAll(/rgba?\(([^)]+)\)/gi)) {
    const p = parseRgbFuncInner(m[1]!);
    if (!p || p.a < 0.08) continue;
    const w = p.a;
    const L = relativeLuminance({ r: p.r, g: p.g, b: p.b });
    maxL = Math.max(maxL, L * (0.35 + 0.65 * w));
  }
  return maxL;
}

function channelLin(c: number): number {
  const x = c / 255;
  return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const R = channelLin(rgb.r);
  const G = channelLin(rgb.g);
  const B = channelLin(rgb.b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/** True when the current canvas reads as dark — use for adaptive settings / chrome surfaces. */
export function isDarkAppearanceBackground(css: string, threshold = 0.485): boolean {
  const L = relativeLuminance(sampleBackgroundRgb(css));
  const bright = brightestStopLuminance(css);
  const canvasReadsLight = L > 0.42 || (bright > 0.68 && L > 0.22);
  if (canvasReadsLight) return false;
  return L < threshold;
}

export function contrastRatio(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number }
): number {
  const La = relativeLuminance(a);
  const Lb = relativeLuminance(b);
  const light = Math.max(La, Lb);
  const dark = Math.min(La, Lb);
  return (light + 0.05) / (dark + 0.05);
}

/** Grayscale (R=G=B=v) stepped until contrast vs bg reaches minRatio. */
function pickGrayscaleLevel(bgRgb: { r: number; g: number; b: number }, minRatio: number, lightText: boolean): number {
  if (lightText) {
    let v = 255;
    for (let i = 0; i < 48; i++) {
      const fg = { r: v, g: v, b: v };
      if (contrastRatio(bgRgb, fg) >= minRatio) return v;
      v -= 3;
      if (v < 140) break;
    }
    return 248;
  }
  let v = 12;
  for (let i = 0; i < 48; i++) {
    const fg = { r: v, g: v, b: v };
    if (contrastRatio(bgRgb, fg) >= minRatio) return v;
    v += 3;
    if (v > 220) break;
  }
  return 23;
}

function secondaryRgbFromPrimary(
  pr: number,
  pg: number,
  pb: number,
  lightText: boolean
): { r: number; g: number; b: number } {
  if (lightText) {
    const sr = 148;
    const sg = 163;
    const sb = 184;
    return {
      r: Math.round(pr * 0.45 + sr * 0.55),
      g: Math.round(pg * 0.45 + sg * 0.55),
      b: Math.round(pb * 0.45 + sb * 0.55),
    };
  }
  const sr = 71;
  const sg = 85;
  const sb = 105;
  return {
    r: Math.round(pr * 0.5 + sr * 0.5),
    g: Math.round(pg * 0.5 + sg * 0.5),
    b: Math.round(pb * 0.5 + sb * 0.5),
  };
}

/**
 * Returns `#rrggbb` pair tuned for the sampled background (body text ~6:1, muted ~4.5:1 where possible).
 */
export function deriveReadableTextHexesFromBackground(css: string): { primaryHex: string; secondaryHex: string } {
  const bgRgb = sampleBackgroundRgb(css);
  const L = relativeLuminance(bgRgb);
  const bright = brightestStopLuminance(css);
  /**
   * “Light canvas” → dark body copy. Use average luminance, but also a bright stop so pale / white
   * gradients never keep lavender-tinted light text (common failure mode).
   */
  const canvasReadsLight = L > 0.42 || (bright > 0.68 && L > 0.22);
  const lightText = !canvasReadsLight;

  const base = pickGrayscaleLevel(bgRgb, lightText ? 6.2 : 6, lightText);
  let pr = base;
  let pg = base;
  let pb = base;
  if (lightText) {
    pr = clamp255(base + 2);
    pg = clamp255(base + 4);
    pb = clamp255(base + 10);
  } else {
    pr = clamp255(base - 1);
    pg = clamp255(base);
    pb = clamp255(base + 1);
  }

  let sec = secondaryRgbFromPrimary(pr, pg, pb, lightText);
  let guard = 0;
  while (contrastRatio(bgRgb, sec) < 4.25 && guard < 24) {
    if (lightText) {
      sec = { r: clamp255(sec.r + 4), g: clamp255(sec.g + 4), b: clamp255(sec.b + 4) };
    } else {
      sec = { r: clamp255(sec.r - 4), g: clamp255(sec.g - 4), b: clamp255(sec.b - 4) };
    }
    guard++;
  }

  return {
    primaryHex: rgbToHex(pr, pg, pb),
    secondaryHex: rgbToHex(sec.r, sec.g, sec.b),
  };
}

export function blendHex(from: string, toward: string, amount: number): string {
  const A = parseHexToRgb(from);
  const B = parseHexToRgb(toward);
  if (!A || !B) return from;
  const t = Math.max(0, Math.min(1, amount));
  return rgbToHex(
    A.r + (B.r - A.r) * t,
    A.g + (B.g - A.g) * t,
    A.b + (B.b - A.b) * t
  );
}

/**
 * Menu + icon tint on the shell when the user leaves contrast on Auto.
 * Updates when `backgroundCss` changes.
 */
export function deriveNavAccentsFromBackground(css: string): {
  navLabelHex: string;
  navItemHex: string;
  navActiveIconHex: string;
} {
  const dark = isDarkAppearanceBackground(css);
  const { primaryHex, secondaryHex } = deriveReadableTextHexesFromBackground(css);
  if (dark) {
    return {
      navLabelHex: blendHex(secondaryHex, "#94A3B8", 0.45),
      navItemHex: blendHex(secondaryHex, "#C4B5FD", 0.5),
      navActiveIconHex: blendHex("#93C5FD", primaryHex, 0.12),
    };
  }
  return {
    navLabelHex: blendHex(secondaryHex, "#475569", 0.22),
    navItemHex: blendHex(primaryHex, "#334155", 0.12),
    navActiveIconHex: blendHex("#2563EB", primaryHex, 0.35),
  };
}

/**
 * Body copy for MUI theme: manual colours that are unreadable on the current canvas fall back to Auto.
 */
export function resolveBodyTextForTheme(
  css: string,
  mode: "auto" | "manual",
  manualPrimaryHex: string,
  manualSecondaryHex: string
): { primaryHex: string; secondaryHex: string } {
  const derived = deriveReadableTextHexesFromBackground(css);
  if (mode === "auto") return derived;
  const canvasLight = !isDarkAppearanceBackground(css);
  const pParsed = parseHexToRgb(manualPrimaryHex);
  const sParsed = parseHexToRgb(manualSecondaryHex);
  if (!pParsed || !sParsed) return derived;
  const lumP = relativeLuminance(pParsed);
  const lumS = relativeLuminance(sParsed);
  if (canvasLight && lumP > 0.38) {
    return derived;
  }
  if (!canvasLight && lumP < 0.35 && lumS < 0.4) {
    return derived;
  }
  return { primaryHex: manualPrimaryHex, secondaryHex: manualSecondaryHex };
}
