export type TextMode = "auto" | "manual";

/** Cards, charts, KPI numbers — auto follows background + text; manual allows overrides */
export type DashboardContentUi = {
  mode: "auto" | "manual";
  cardBgHex?: string;
  cardBorderHex?: string;
  /** Lines, areas, default metric values */
  dataAccentHex?: string;
};

export type SidebarWidthPreset = "compact" | "standard" | "wide";

export type ShellGlassPreset = "light" | "medium" | "heavy";

export type GlassChrome = {
  /** backdrop-filter blur in px */
  blurPx: number;
  /** 0–1 opacity of the tinted frosted layer */
  fillOpacity: number;
  /** multiplied into the frosted tint */
  tintHex: string;
  /** 0–1 line opacity (white-based edge) */
  borderOpacity: number;
};

export type DashboardAccentTokens = {
  navLabelHex: string;
  navItemHex: string;
  navActiveIconHex: string;
  searchFillOpacity: number;
  searchBorderOpacity: number;
};

export type DashboardAppearance = {
  backgroundCss: string;
  textMode: TextMode;
  textPrimaryHex: string;
  textSecondaryHex: string;
  sidebarWidth: SidebarWidthPreset;
  shellGlassPreset: ShellGlassPreset;
  sidebarChrome: GlassChrome;
  headerChrome: GlassChrome;
  accents: DashboardAccentTokens;
  ui: DashboardContentUi;
};

export type DashboardAppearanceActions = {
  setBackgroundCss: (v: string) => void;
  setTextMode: (v: TextMode) => void;
  setTextPrimaryHex: (v: string) => void;
  setTextSecondaryHex: (v: string) => void;
  setSidebarWidth: (v: SidebarWidthPreset) => void;
  setShellGlassPreset: (v: ShellGlassPreset) => void;
  setSidebarChrome: (patch: Partial<GlassChrome>) => void;
  setHeaderChrome: (patch: Partial<GlassChrome>) => void;
  setAccents: (patch: Partial<DashboardAccentTokens>) => void;
  setUi: (patch: Partial<DashboardContentUi>) => void;
  resetToDefaults: () => void;
};

export type DashboardAppearanceContextValue = {
  appearance: DashboardAppearance;
} & DashboardAppearanceActions;
