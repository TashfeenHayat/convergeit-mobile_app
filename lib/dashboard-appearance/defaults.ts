import { mainBackgroundGradient } from "@/theme/theme";
import type { DashboardAppearance } from "./types";

export const DASHBOARD_APPEARANCE_STORAGE_KEY = "interchanges.dashboardAppearance.v1";

export const defaultDashboardAppearance: DashboardAppearance = {
  backgroundCss: mainBackgroundGradient,
  textMode: "auto",
  textPrimaryHex: "#F8FAFC",
  textSecondaryHex: "#94A3B8",
  sidebarWidth: "standard",
  shellGlassPreset: "medium",
  sidebarChrome: {
    blurPx: 30,
    fillOpacity: 0.4,
    tintHex: "#0B1220",
    borderOpacity: 0.11,
  },
  headerChrome: {
    blurPx: 20,
    fillOpacity: 0.42,
    tintHex: "#0F172A",
    borderOpacity: 0.1,
  },
  accents: {
    navLabelHex: "#A5B4FC",
    navItemHex: "#C4B5FD",
    navActiveIconHex: "#93C5FD",
    searchFillOpacity: 0.08,
    searchBorderOpacity: 0.14,
  },
  ui: {
    mode: "auto",
  },
};
