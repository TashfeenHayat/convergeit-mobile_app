import type { CSSProperties } from "react";

export const revenueLineChartRoot = (height: number): CSSProperties => ({
  width: "100%",
  height,
  outline: "none",
});

export const revenueLineChartMargin = { top: 10, right: 10, left: 0, bottom: 0 };

export const revenueLineChartGrid: CSSProperties = {
  stroke: "#FFFFFF",
};

export const revenueLineChartXAxis = {
  stroke: "rgba(255,255,255,0.5)",
  tick: { fill: "rgba(255,255,255,0.7)", fontSize: 12 },
  tickLine: false,
  axisLine: { stroke: "rgba(255,255,255,0.15)" },
  ticks: [1, 5, 10, 15, 20, 25, 30] as number[],
};

export const revenueLineChartYAxis = {
  stroke: "rgba(255,255,255,0.5)",
  tick: { fill: "rgba(255,255,255,0.7)", fontSize: 12 },
  tickLine: false,
  axisLine: { stroke: "rgba(255,255,255,0.15)" },
};

export const revenueLineChartTooltipContent: CSSProperties = {
  background: "radial-gradient(50% 50% at 50% 50%, #09013F 0%, #00011A 100%)",
  boxShadow: "none",
  border: "0.51px solid #FFFFFF0F",
  borderRadius: 12,
};

export const revenueLineChartTooltipLabel: CSSProperties = {
  color: "#FFFFFF",
  fontWeight: 600,
};

export const revenueLineChartTooltipItem: CSSProperties = {
  color: "#FFFFFF",
};

export const revenueLineChartCursor = {
  stroke: "rgba(255,255,255,0.5)",
  strokeDasharray: "4 4",
};

export const revenueLineChartGradientStops = [
  { offset: "0%", stopColor: "rgba(255,255,255,0.18)", stopOpacity: 1 },
  { offset: "50%", stopColor: "rgba(168, 85, 247, 0.08)", stopOpacity: 1 },
  { offset: "100%", stopColor: "rgba(168, 85, 247, 0)", stopOpacity: 0 },
] as const;

export const revenueLineChartLine1 = {
  stroke: "#FFFFFF",
  strokeWidth: 2,
  dot: false,
  activeDot: { r: 6, fill: "#16123F", stroke: "#FFFFFF", strokeWidth: 2 },
};

export const revenueLineChartLine2 = {
  stroke: "#0048B7",
  strokeWidth: 2,
  dot: false,
  activeDot: { r: 6, fill: "#16123F", stroke: "#0048B7", strokeWidth: 2 },
};
