import type { CSSProperties } from "react";

export const departmentPieChartRoot = (height: number): CSSProperties => ({
  width: "100%",
  height,
  outline: "none",
});

export const departmentPieChartTooltipContent: CSSProperties = {
  backgroundColor: "#1a1a2e",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
};
