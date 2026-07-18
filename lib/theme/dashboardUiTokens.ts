import type { DashboardContentUi } from "@/lib/dashboard-appearance/types";
import { blendHex, isDarkAppearanceBackground } from "./backgroundTextContrast";
import { hexToRgbaString, parseHexToRgb } from "./shellChrome";

/** Visual tokens for cards, charts, and KPI numbers — stay aligned with body text colours. */
export type DashboardUiTokens = {
  cardBg: string;
  cardBorder: string;
  chartGrid: string;
  chartAxis: string;
  chartTick: string;
  chartCursor: string;
  chartLine1: string;
  chartLine2: string;
  chartAreaStopTop: string;
  chartAreaStopMid: string;
  chartAreaStopBottom: string;
  chartTooltipBg: string;
  chartTooltipBorder: string;
  chartTooltipLabel: string;
  metricValue: string;
};

function mergeUiManual(derived: DashboardUiTokens, manual: Pick<DashboardContentUi, "cardBgHex" | "cardBorderHex" | "dataAccentHex">): DashboardUiTokens {
  const accent = manual.dataAccentHex?.trim();
  const line2 = accent ? blendHex(accent, "#3B82F6", 0.35) : derived.chartLine2;
  return {
    ...derived,
    cardBg: manual.cardBgHex?.trim() ? manual.cardBgHex.trim() : derived.cardBg,
    cardBorder: manual.cardBorderHex?.trim() ? manual.cardBorderHex.trim() : derived.cardBorder,
    chartLine1: accent || derived.chartLine1,
    chartLine2: accent ? line2 : derived.chartLine2,
    metricValue: accent || derived.metricValue,
    chartAreaStopTop: accent ? hexToRgbaString(accent, 0.28) : derived.chartAreaStopTop,
    chartAreaStopMid: accent ? hexToRgbaString(accent, 0.1) : derived.chartAreaStopMid,
  };
}

export function deriveDashboardUiTokens(
  css: string,
  primaryHex: string,
  secondaryHex: string,
  manual?: DashboardContentUi
): DashboardUiTokens {
  const dark = isDarkAppearanceBackground(css);
  const p = parseHexToRgb(primaryHex);
  const s = parseHexToRgb(secondaryHex);

  const chartTick = `rgba(${s.r},${s.g},${s.b},0.88)`;
  const chartAxis = `rgba(${s.r},${s.g},${s.b},0.35)`;
  const chartGrid = dark ? `rgba(${p.r},${p.g},${p.b},0.09)` : `rgba(${p.r},${p.g},${p.b},0.12)`;
  const chartCursor = `rgba(${s.r},${s.g},${s.b},0.45)`;

  const line1 = dark ? blendHex(primaryHex, "#A78BFA", 0.22) : blendHex(primaryHex, "#6366F1", 0.42);
  const line2 = dark ? blendHex(secondaryHex, "#38BDF8", 0.55) : blendHex(primaryHex, "#0EA5E9", 0.35);
  const metricValue = dark ? blendHex(primaryHex, "#818CF8", 0.32) : blendHex(primaryHex, "#4F46E5", 0.45);

  const cardBg = dark ? hexToRgbaString(primaryHex, 0.07) : hexToRgbaString(primaryHex, 0.06);
  const cardBorder = dark ? hexToRgbaString(secondaryHex, 0.16) : hexToRgbaString(secondaryHex, 0.3);

  const tooltipBg = dark ? "rgba(15, 23, 42, 0.92)" : "rgba(255, 255, 255, 0.96)";
  const tooltipBorder = dark ? hexToRgbaString(secondaryHex, 0.22) : hexToRgbaString(secondaryHex, 0.18);
  const tooltipLabel = primaryHex;

  const derived: DashboardUiTokens = {
    cardBg,
    cardBorder,
    chartGrid,
    chartAxis,
    chartTick,
    chartCursor,
    chartLine1: line1,
    chartLine2: line2,
    chartAreaStopTop: hexToRgbaString(line1, dark ? 0.22 : 0.18),
    chartAreaStopMid: hexToRgbaString(line1, dark ? 0.08 : 0.07),
    chartAreaStopBottom: hexToRgbaString(line1, 0),
    chartTooltipBg: tooltipBg,
    chartTooltipBorder: tooltipBorder,
    chartTooltipLabel: tooltipLabel,
    metricValue,
  };

  if (manual?.mode === "manual") {
    return mergeUiManual(derived, {
      cardBgHex: manual.cardBgHex,
      cardBorderHex: manual.cardBorderHex,
      dataAccentHex: manual.dataAccentHex,
    });
  }

  return derived;
}
