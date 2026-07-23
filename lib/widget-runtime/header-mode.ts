/**
 * Leaf module (no imports) so wizard save / appearance never hit
 * circular-bundle "is not a function" errors.
 */

export type WidgetHeaderMode = 'attached' | 'detached';

export const DEFAULT_HEADER_MIN_HEIGHT_PX = 44;
export const DEFAULT_HEADER_RADIUS_PX = 12;

export const WIDGET_HEADER_MODE_OPTIONS: {
  id: WidgetHeaderMode;
  label: string;
  description: string;
}[] = [
  {
    id: 'attached',
    label: 'Attached',
    description: 'Header bar fixed to the top of the chat panel',
  },
  {
    id: 'detached',
    label: 'Detached',
    description: 'Header floats above the panel with a gap',
  },
];

export function normalizeHeaderMode(raw: unknown): WidgetHeaderMode {
  const id = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');
  if (
    id === 'detached' ||
    id === 'float' ||
    id === 'floating' ||
    id === 'separate'
  ) {
    return 'detached';
  }
  return 'attached';
}

export function clampHeaderMinHeightPx(
  raw: unknown,
  fallback = DEFAULT_HEADER_MIN_HEIGHT_PX,
): number {
  const n =
    typeof raw === 'number' ? raw : Number.parseInt(String(raw ?? '').trim(), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(80, Math.max(36, Math.round(n)));
}

export function clampHeaderRadiusPx(
  raw: unknown,
  fallback = DEFAULT_HEADER_RADIUS_PX,
): number {
  const n =
    typeof raw === 'number' ? raw : Number.parseInt(String(raw ?? '').trim(), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(28, Math.max(0, Math.round(n)));
}

/** Host chrome reserved above the panel for a detached header (bar + gap). */
export function detachedHeaderChromePx(minHeightPx?: number): number {
  return clampHeaderMinHeightPx(minHeightPx) + 12;
}
