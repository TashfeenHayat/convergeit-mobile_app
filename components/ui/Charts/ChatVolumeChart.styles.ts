import type { CSSProperties } from "react";

const CHAT_VOLUME_LINE_COLOR = "#000080";

export const chatVolumeChartRoot = (height: number): CSSProperties => ({
  width: "100%",
  height,
  outline: "none",
});

export const chatVolumeChartGrid = {
  stroke: "rgba(255,255,255,0.12)",
  strokeOpacity: 1,
  vertical: false,
};

export const chatVolumeChartXAxis = {
  stroke: "rgba(255,255,255,0.5)",
  tick: { fill: "rgba(255,255,255,0.7)", fontSize: 12 },
  tickLine: false,
  axisLine: { stroke: "rgba(255,255,255,0.15)" },
};

export const chatVolumeChartYAxis = {
  stroke: "rgba(255,255,255,0.5)",
  tick: { fill: "rgba(255,255,255,0.7)", fontSize: 12 },
  tickLine: false,
  axisLine: { stroke: "rgba(255,255,255,0.15)" },
};

export const chatVolumeChartTooltipContent: CSSProperties = {
  background: "radial-gradient(50% 50% at 50% 50%, #09013F 0%, #00011A 100%)",
  boxShadow: "none",
  border: "0.51px solid #FFFFFF0F",
  borderRadius: 12,
};

export const chatVolumeChartTooltipLabel: CSSProperties = {
  color: "#FFFFFF",
  fontWeight: 600,
};

export const chatVolumeChartTooltipItem: CSSProperties = {
  color: "#FFFFFF",
};

export const chatVolumeChartCursor = {
  stroke: "rgba(255,255,255,0.2)",
  strokeDasharray: "4 4",
};

export const chatVolumeChartLine = {
  stroke: CHAT_VOLUME_LINE_COLOR,
  strokeWidth: 2.62,
  dot: {
    r: 4,
    fill: CHAT_VOLUME_LINE_COLOR,
    stroke: "#FFFFFF",
    strokeWidth: 1,
  },
  activeDot: {
    r: 6,
    fill: CHAT_VOLUME_LINE_COLOR,
    stroke: "#FFFFFF",
    strokeWidth: 1,
  },
};

export const chatVolumeChartGradientStops = [
  { offset: "0%", stopColor: "rgba(90, 103, 216, 0.25)", stopOpacity: 1 },
  { offset: "100%", stopColor: "rgba(90, 103, 216, 0)", stopOpacity: 0 },
] as const;
