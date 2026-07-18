export type BarFillType = "first" | "second";

export interface ChatAnalyticsBarChartDataPoint {
  name: string;
  value: number;
  fill: BarFillType;
}

export interface ChatAnalyticsBarChartProps {
  data: ChatAnalyticsBarChartDataPoint[];
  height?: number;
  /** Y-axis domain [min, max] in same units as data values */
  yDomain?: [number, number];
  /** Y-axis tick formatter, e.g. (v) => `${v / 1000}M` */
  yTickFormatter?: (value: number) => string;
  /** Tooltip value formatter, e.g. (v) => `$${(v / 1000).toFixed(0)}k` */
  tooltipFormatter?: (value: number) => string;
}
