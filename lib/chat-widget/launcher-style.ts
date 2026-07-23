export type WidgetLauncherStyleId = 'solid' | 'gradient' | 'glass' | 'glow';

export const WIDGET_LAUNCHER_STYLE_OPTIONS: {
  id: WidgetLauncherStyleId;
  label: string;
  description: string;
}[] = [
  { id: 'solid', label: 'Solid', description: 'Flat brand color' },
  { id: 'gradient', label: 'Gradient', description: 'Two-tone shine' },
  { id: 'glass', label: 'Glass', description: 'Frosted translucent' },
  { id: 'glow', label: 'Glow', description: 'Soft colored halo' },
];

export function normalizeLauncherStyle(value: unknown): WidgetLauncherStyleId {
  const s = String(value ?? '').toLowerCase();
  if (s === 'gradient' || s === 'glass' || s === 'glow') return s;
  return 'solid';
}

/** Panel shell — glow is not offered in the wizard; keep legacy configs on solid. */
export function normalizePanelSurfaceStyle(value: unknown): WidgetLauncherStyleId {
  const style = normalizeLauncherStyle(value);
  return style === 'glow' ? 'solid' : style;
}

export function launcherShapeRadius(shape: string): number {
  if (shape === 'square') return 10;
  if (shape === 'rounded') return 16;
  return 999;
}
