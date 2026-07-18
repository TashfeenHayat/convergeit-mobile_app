export interface ChatVolumeChartDataPoint {
  day: number;
  value: number;
}

export interface ChatVolumeChartProps {
  data: ChatVolumeChartDataPoint[];
  height?: number;
  yDomain?: [number, number];
  yTickFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;
  tooltipLabelFormatter?: (label: string | number) => string;
}
