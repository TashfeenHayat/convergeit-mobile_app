import { hexToRgbaString } from "@/lib/theme/shellChrome";
import type { GlassChrome } from "./types";

export type GlassPanelEdges = {
  borderRight?: boolean;
  borderBottom?: boolean;
  /** Full perimeter — floating glass card (e.g. sidebar) */
  surround?: boolean;
  borderRadius?: number | string;
};

/**
 * Layered glass: specular highlight + tinted frost + strong backdrop blur.
 * Matches modern “frosted panel” SaaS sidebars (heavy blur, ~1px soft rim).
 */
export function glassChromeLayerSx(chrome: GlassChrome, edges: GlassPanelEdges = {}) {
  const line = Math.max(0, Math.min(1, chrome.borderOpacity));
  const rim = `rgba(255,255,255, ${line})`;

  const top = hexToRgbaString(chrome.tintHex, chrome.fillOpacity * 0.96);
  const bottom = hexToRgbaString(chrome.tintHex, Math.max(0.04, chrome.fillOpacity * 0.62));
  const specular =
    "linear-gradient(180deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.04) 42%, rgba(255,255,255,0) 72%)";
  const frost = `linear-gradient(168deg, ${top} 0%, ${bottom} 100%)`;
  const vignette = "radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 55%)";
  const background = `${specular}, ${vignette}, ${frost}`;

  const blur = chrome.blurPx;
  const backdrop = `blur(${blur}px) saturate(190%) brightness(1.02)`;

  const highlight = Math.min(0.26, line + 0.08);
  const innerRim = `inset 0 0 0 1px rgba(255,255,255, ${line * 0.4})`;

  if (edges.surround) {
    const br = edges.borderRadius ?? 6;
    return {
      background,
      backdropFilter: backdrop,
      WebkitBackdropFilter: backdrop,
      border: `1px solid ${rim}`,
      borderRadius: br,
      boxShadow: `0 0 0 1px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255, ${highlight}), ${innerRim}`,
    } as const;
  }

  const edge = `1px solid ${rim}`;
  return {
    background,
    backdropFilter: backdrop,
    WebkitBackdropFilter: backdrop,
    ...(edges.borderRight ? { borderRight: edge } : {}),
    ...(edges.borderBottom ? { borderBottom: edge } : {}),
    boxShadow: `inset 0 1px 0 rgba(255,255,255, ${Math.min(0.2, highlight)}), ${innerRim}`,
  } as const;
}
