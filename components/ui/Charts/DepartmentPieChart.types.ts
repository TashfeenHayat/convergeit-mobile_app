export interface DepartmentPieChartDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface DepartmentPieChartProps {
  data: DepartmentPieChartDataPoint[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
  /** Label format, e.g. (name, value) => `${value}% ${name}` */
  labelFormatter?: (name: string, value: number) => string;
  /** Tooltip value formatter */
  tooltipFormatter?: (value: number) => string;
}
