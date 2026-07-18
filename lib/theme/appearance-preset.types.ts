export type AppearancePreset = {
  id: string;
  label: string;
  /** Mini browser chrome preview (legacy) / swatch fallback */
  previewBar: string;
  previewTab: string;
  appBackground: string;
  paletteMode: "light" | "dark";
  /** Nested partial merged into default `app` tokens */
  patch: Record<string, unknown>;
};
