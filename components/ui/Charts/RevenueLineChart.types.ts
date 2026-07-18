export interface RevenueLineChartDataPoint {
  day: number;
  value: number;
  value2: number;
}

export interface RevenueLineChartProps {
  data: RevenueLineChartDataPoint[];
  height?: number;
  /** Y-axis domain [min, max] */
  yDomain?: [number, number];
  /** Y-axis tick formatter, e.g. (v) => `${v}M` */
  yTickFormatter?: (value: number) => string;
  /** Tooltip value formatter */
  tooltipFormatter?: (value: number) => string;
  /** Tooltip label formatter (e.g. day to date string) */
  tooltipLabelFormatter?: (label: string | number) => string;
}
