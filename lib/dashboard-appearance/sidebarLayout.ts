import type { SidebarWidthPreset } from "./types";

export const SIDEBAR_WIDTH_STANDARD = 260;

export const SIDEBAR_WIDTH_BY_PRESET: Record<SidebarWidthPreset, number> = {
  compact: 232,
  standard: SIDEBAR_WIDTH_STANDARD,
  wide: 296,
};
