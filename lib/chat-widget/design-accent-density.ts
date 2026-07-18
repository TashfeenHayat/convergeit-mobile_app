/** `theme.designJson.accent` — semantic highlight family for chips, borders, focus. */
export type DesignAccentId = "blue" | "green" | "purple" | "orange";

/** `theme.designJson.density` — spacing scale inside the chat panel. */
export type DesignDensityId = "comfortable" | "compact";

export interface AccentPalette {
  id: DesignAccentId;
  label: string;
  main: string;
  light: string;
  border: string;
}

export interface DensityTokens {
  id: DesignDensityId;
  label: string;
  panelPaddingPx: number;
  stackGapMultiplier: number;
  inputPaddingPx: number;
  chipPy: number;
  chipPx: number;
  messagePy: number;
}

const ACCENT_PALETTES: Record<DesignAccentId, AccentPalette> = {
  blue: {
    id: "blue",
    label: "Blue",
    main: "#2563eb",
    light: "#eff6ff",
    border: "#93c5fd",
  },
  green: {
    id: "green",
    label: "Green",
    main: "#16a34a",
    light: "#f0fdf4",
    border: "#86efac",
  },
  purple: {
    id: "purple",
    label: "Purple",
    main: "#9333ea",
    light: "#faf5ff",
    border: "#d8b4fe",
  },
  orange: {
    id: "orange",
    label: "Orange",
    main: "#ea580c",
    light: "#fff7ed",
    border: "#fdba74",
  },
};

const DENSITY_TOKENS: Record<DesignDensityId, DensityTokens> = {
  comfortable: {
    id: "comfortable",
    label: "Comfortable",
    panelPaddingPx: 16,
    stackGapMultiplier: 1,
    inputPaddingPx: 8,
    chipPy: 6,
    chipPx: 14,
    messagePy: 8,
  },
  compact: {
    id: "compact",
    label: "Compact",
    panelPaddingPx: 10,
    stackGapMultiplier: 0.65,
    inputPaddingPx: 6,
    chipPy: 4,
    chipPx: 10,
    messagePy: 5,
  },
};

export const DESIGN_ACCENT_SELECT_OPTIONS = Object.values(ACCENT_PALETTES).map((p) => ({
  label: p.label,
  value: p.id,
}));

export const DESIGN_DENSITY_SELECT_OPTIONS = Object.values(DENSITY_TOKENS).map((d) => ({
  label: d.label,
  value: d.id,
}));

export function normalizeDesignAccent(raw: string | undefined): DesignAccentId {
  const s = (raw ?? "blue").toLowerCase();
  if (s === "green" || s === "purple" || s === "orange") return s;
  return "blue";
}

export function normalizeDesignDensity(raw: string | undefined): DesignDensityId {
  return (raw ?? "comfortable").toLowerCase() === "compact" ? "compact" : "comfortable";
}

export function resolveAccentPalette(raw: string | undefined): AccentPalette {
  return ACCENT_PALETTES[normalizeDesignAccent(raw)];
}

export function resolveDensityTokens(raw: string | undefined): DensityTokens {
  return DENSITY_TOKENS[normalizeDesignDensity(raw)];
}
