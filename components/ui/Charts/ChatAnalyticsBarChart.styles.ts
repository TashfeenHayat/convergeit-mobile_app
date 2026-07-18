import type { CSSProperties } from "react";

export const chatAnalyticsBarChartRoot = (height: number): CSSProperties => ({
  width: "100%",
  height,
  outline: "none",
});

export const chatAnalyticsBarChartMargin = { top: 24, right: 16, left: 8, bottom: 8 };

export const chatAnalyticsBarChartGrid = {
  stroke: "#FFFFFF",
  strokeOpacity: 0.12,
  strokeDasharray: "0",
  vertical: false,
};

export const chatAnalyticsBarChartXAxis = {
  axisLine: { stroke: "rgba(255,255,255,0.2)" },
  tickLine: false,
  tick: { fill: "#FFFFFF", fontSize: 12 },
};

export const chatAnalyticsBarChartYAxis = {
  axisLine: { stroke: "rgba(255,255,255,0.2)" },
  tickLine: false,
  tick: { fill: "#FFFFFF", fontSize: 12 },
};

export const chatAnalyticsBarChartTooltipContent: CSSProperties = {
  background: "radial-gradient(50% 50% at 50% 50%, #09013F 0%, #00011A 100%)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  boxShadow: "none",
  color: "#FFFFFF",
  padding: "4px 10px",
  fontWeight: 500,
  lineHeight: 1.3,
};

export const chatAnalyticsBarChartTooltipItem: CSSProperties = {
  color: "#FFFFFF",
  padding: 0,
};

export const chatAnalyticsBarChartTooltipLabel: CSSProperties = {
  display: "none",
  margin: 0,
  padding: 0,
  height: 0,
  overflow: "hidden",
};

export const chatAnalyticsBarChartCursor = { fill: "transparent" };

export const chatAnalyticsBarChartBar = {
  radius: [6, 6, 0, 0] as [number, number, number, number],
  maxBarSize: 48,
};

export const chatAnalyticsBarChartGradientFirst = {
  topColor: "#E4C9FF",
  bottomColor: "#0B0D11",
  bottomOffset: "100%",
};

export const chatAnalyticsBarChartGradientSecond = {
  topColor: "#B2EDD3",
  bottomColor: "#0B0D11",
  bottomOffset: "88.89%",
};
