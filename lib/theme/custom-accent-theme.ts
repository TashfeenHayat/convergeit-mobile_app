const HEX_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function normalizeHex(hex: string): string {
  let h = hex.trim();
  if (!h.startsWith("#")) h = `#${h}`;
  const m = h.match(HEX_RE);
  if (!m) return "#ec4899";
  let body = m[1];
  if (body.length === 3) {
    body = body
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return `#${body.toLowerCase()}`;
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = normalizeHex(hex).slice(1);
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function mixChannel(c: number, target: number, t: number) {
  return clamp(c + (target - c) * t, 0, 255);
}

function rgb(r: number, g: number, b: number) {
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

function rgba(r: number, g: number, b: number, a: number) {
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
}

function toHexByte(n: number) {
  return Math.round(clamp(n, 0, 255))
    .toString(16)
    .padStart(2, "0");
}

export const DEFAULT_CUSTOM_ACCENT_HEX = "#ec4899";

/** Darker end stop derived from a start accent (legacy single-color custom themes). */
export function deriveGradientEndFromAccent(hex: string): string {
  const { r, g, b } = parseHex(hex);
  return `#${toHexByte(mixChannel(r, 0, 0.88))}${toHexByte(mixChannel(g, 0, 0.88))}${toHexByte(
    mixChannel(b, 0, 0.88),
  )}`;
}

export const DEFAULT_CUSTOM_ACCENT_END_HEX = deriveGradientEndFromAccent(DEFAULT_CUSTOM_ACCENT_HEX);

/** Persisted account / local value: `#aabbcc+#ddeeff` (start + end). */
export const CUSTOM_GRADIENT_PAIR_SEP = "+";

export function formatCustomGradientPair(startHex: string, endHex: string): string {
  return `${normalizeHex(startHex)}${CUSTOM_GRADIENT_PAIR_SEP}${normalizeHex(endHex)}`;
}

export function parseCustomGradientPair(
  raw: string,
): { startHex: string; endHex: string } | null {
  const trimmed = raw.trim();
  const sep = trimmed.indexOf(CUSTOM_GRADIENT_PAIR_SEP);
  if (sep <= 0) return null;
  const startRaw = trimmed.slice(0, sep).trim();
  const endRaw = trimmed.slice(sep + 1).trim();
  if (!HEX_RE.test(startRaw.startsWith("#") ? startRaw : `#${startRaw}`)) return null;
  if (!HEX_RE.test(endRaw.startsWith("#") ? endRaw : `#${endRaw}`)) return null;
  return { startHex: normalizeHex(startRaw), endHex: normalizeHex(endRaw) };
}

export function getCustomAccentTheme(startHex: string, endHex?: string) {
  const start = normalizeHex(startHex);
  const end = normalizeHex(endHex ?? deriveGradientEndFromAccent(start));
  const { r, g, b } = parseHex(start);
  const sidebar = rgb(mixChannel(r, 0, 0.62), mixChannel(g, 0, 0.62), mixChannel(b, 0, 0.62));
  const header = rgb(mixChannel(r, 0, 0.42), mixChannel(g, 0, 0.42), mixChannel(b, 0, 0.42));
  const previewTab = rgb(mixChannel(r, 0, 0.28), mixChannel(g, 0, 0.28), mixChannel(b, 0, 0.28));
  const previewBar = rgb(mixChannel(r, 100, 0.22), mixChannel(g, 100, 0.22), mixChannel(b, 120, 0.22));
  const accent = start;
  const card = rgba(mixChannel(r, 25, 0.5), mixChannel(g, 25, 0.5), mixChannel(b, 45, 0.5), 0.45);
  const appBackground = `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
  const border = `linear-gradient(90deg, ${accent} 0%, ${previewTab} 100%)`;

  return {
    appBackground,
    paletteMode: "dark" as const,
    previewBar,
    previewTab,
    startHex: start,
    endHex: end,
    patch: {
      dashboard: {
        headerBorderGradient: border,
        sidebarBg: sidebar,
        headerBg: header,
        contentBg: `linear-gradient(180deg, ${start} 0%, ${end} 100%)`,
        cardBg: card,
        cardBorder: "rgba(255, 255, 255, 0.1)",
        navItemSelectedBg: rgba(r, g, b, 0.35),
        navActiveBg: rgba(r, g, b, 0.28),
        accentBlue: accent,
        accentPurple: previewTab,
        menuSurfaceBg: header,
        pillBg: sidebar,
        pillActive: header,
        liveChat: {
          cardBg: header,
          messageBg: sidebar,
          avatarBg: accent,
          messageText: "rgba(248, 250, 252, 0.9)",
          cardGlass: "rgba(244, 244, 244, 0.02)",
        },
      },
    },
  };
}
