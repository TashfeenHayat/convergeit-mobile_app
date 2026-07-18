import { defaultDashboardAppearance, DASHBOARD_APPEARANCE_STORAGE_KEY } from "./defaults";
import { inferShellGlassPreset } from "./shellGlassPresets";
import type { DashboardAppearance, DashboardContentUi, ShellGlassPreset, SidebarWidthPreset } from "./types";
import { safeLocalGet, safeLocalSet } from "@/lib/storage/safe-web-storage";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pickGlass(raw: unknown, fallback: DashboardAppearance["sidebarChrome"]) {
  if (!isRecord(raw)) return fallback;
  return {
    blurPx: typeof raw.blurPx === "number" ? raw.blurPx : fallback.blurPx,
    fillOpacity: typeof raw.fillOpacity === "number" ? raw.fillOpacity : fallback.fillOpacity,
    tintHex: typeof raw.tintHex === "string" ? raw.tintHex : fallback.tintHex,
    borderOpacity: typeof raw.borderOpacity === "number" ? raw.borderOpacity : fallback.borderOpacity,
  };
}

type Chrome = DashboardAppearance["sidebarChrome"];

function pickSidebarWidth(raw: unknown, fallback: SidebarWidthPreset): SidebarWidthPreset {
  return raw === "compact" || raw === "wide" || raw === "standard" ? raw : fallback;
}

function pickShellGlassPreset(raw: unknown, sidebar: Chrome): ShellGlassPreset {
  if (raw === "light" || raw === "medium" || raw === "heavy") return raw;
  return inferShellGlassPreset(sidebar);
}

function pickUi(raw: unknown, fallback: DashboardContentUi): DashboardContentUi {
  if (!isRecord(raw)) return fallback;
  const mode = raw.mode === "manual" ? "manual" : "auto";
  return {
    mode,
    cardBgHex: typeof raw.cardBgHex === "string" ? raw.cardBgHex : fallback.cardBgHex,
    cardBorderHex: typeof raw.cardBorderHex === "string" ? raw.cardBorderHex : fallback.cardBorderHex,
    dataAccentHex: typeof raw.dataAccentHex === "string" ? raw.dataAccentHex : fallback.dataAccentHex,
  };
}

function pickAccents(raw: unknown, fallback: DashboardAppearance["accents"]) {
  if (!isRecord(raw)) return fallback;
  return {
    navLabelHex: typeof raw.navLabelHex === "string" ? raw.navLabelHex : fallback.navLabelHex,
    navItemHex: typeof raw.navItemHex === "string" ? raw.navItemHex : fallback.navItemHex,
    navActiveIconHex: typeof raw.navActiveIconHex === "string" ? raw.navActiveIconHex : fallback.navActiveIconHex,
    searchFillOpacity: typeof raw.searchFillOpacity === "number" ? raw.searchFillOpacity : fallback.searchFillOpacity,
    searchBorderOpacity: typeof raw.searchBorderOpacity === "number" ? raw.searchBorderOpacity : fallback.searchBorderOpacity,
  };
}

export function parseStoredDashboardAppearance(raw: string | null): DashboardAppearance {
  const fb = defaultDashboardAppearance;
  if (!raw) return fb;
  try {
    const j = JSON.parse(raw) as unknown;
    if (!isRecord(j)) return fb;
    const textMode = j.textMode === "manual" ? "manual" : "auto";
    const sidebarChrome = pickGlass(j.sidebarChrome, fb.sidebarChrome);
    const headerChrome = pickGlass(j.headerChrome, fb.headerChrome);
    return {
      backgroundCss: typeof j.backgroundCss === "string" ? j.backgroundCss : fb.backgroundCss,
      textMode,
      textPrimaryHex: typeof j.textPrimaryHex === "string" ? j.textPrimaryHex : fb.textPrimaryHex,
      textSecondaryHex: typeof j.textSecondaryHex === "string" ? j.textSecondaryHex : fb.textSecondaryHex,
      sidebarWidth: pickSidebarWidth(j.sidebarWidth, fb.sidebarWidth),
      shellGlassPreset: pickShellGlassPreset(j.shellGlassPreset, sidebarChrome),
      sidebarChrome,
      headerChrome,
      accents: pickAccents(j.accents, fb.accents),
      ui: pickUi(j.ui, fb.ui),
    };
  } catch {
    return fb;
  }
}

export function loadDashboardAppearanceFromStorage(): DashboardAppearance {
  return parseStoredDashboardAppearance(safeLocalGet(DASHBOARD_APPEARANCE_STORAGE_KEY));
}

export function saveDashboardAppearanceToStorage(next: DashboardAppearance) {
  safeLocalSet(DASHBOARD_APPEARANCE_STORAGE_KEY, JSON.stringify(next));
}
