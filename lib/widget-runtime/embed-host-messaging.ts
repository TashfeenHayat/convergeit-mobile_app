import type { RuntimeChatAppearance } from "./widget-runtime-appearance";
import {
  EMBED_INNER_BASE_PAD_PX,
  estimatePillLauncherWidth,
  launcherFrameChromeInsets,
  TEXT_US_EMBED_LAUNCHER_HEIGHT_PX,
} from "./widget-runtime-appearance";

export const WIDGET_EMBED_RESIZE_MESSAGE = "converge-widget-embed-resize";

export type EmbedHostSurface = "chat" | "textUs";

export interface WidgetEmbedResizePayload {
  type: typeof WIDGET_EMBED_RESIZE_MESSAGE;
  open: boolean;
  width: number;
  height: number;
  position: "left" | "center" | "right";
  verticalAnchor?: "top" | "bottom";
  insetBottomPx: number;
  insetTopPx?: number;
  insetSidePx: number;
  /** Routes resize to the correct host iframe when chat + Text Us are split. */
  surface?: EmbedHostSurface;
}

export const EMBED_LAUNCHER_SIZE_PX = 58;
export { TEXT_US_EMBED_LAUNCHER_HEIGHT_PX };
/** @deprecated Use EMBED_INNER_BASE_PAD_PX from widget-runtime-appearance */
export const EMBED_INNER_EDGE_PAD_PX = EMBED_INNER_BASE_PAD_PX;
const PANEL_FAB_GAP_PX = 8;
const OPEN_PANEL_MIN_HEIGHT_PX = 280;
const CLOSED_INVITATION_GAP_PX = 8;
/** Conservative estimate for proactive teaser / unread preview above the FAB. */
const CLOSED_INVITATION_EST_HEIGHT_PX = 132;
const CLOSED_INVITATION_EST_WIDTH_PX = 300;

export type EmbedClosedChrome = {
  /** Invitation bubble or unread preview visible while the panel is closed. */
  hasInvitationBubble?: boolean;
  /** Unread / preview badge extends outside the launcher pill. */
  hasLauncherBadge?: boolean;
  /** Chat + Text Us BOTH: number of stacked launcher chips when closed. */
  stackedLauncherCount?: number;
  stackedLauncherGapPx?: number;
};

function estimateClosedLauncherContentSize(
  appearance: RuntimeChatAppearance,
  surface?: EmbedHostSurface,
): { width: number; height: number } {
  const { launcher } = appearance;
  const label = launcher.buttonLabel?.trim() ?? "";
  const isPill = surface === "textUs" || label.length > 0;
  if (isPill) {
    return {
      width: estimatePillLauncherWidth(
        label || (surface === "textUs" ? "Text Us" : "Chat"),
        launcher.iconEnabled !== false,
      ),
      height: TEXT_US_EMBED_LAUNCHER_HEIGHT_PX,
    };
  }
  return { width: EMBED_LAUNCHER_SIZE_PX, height: EMBED_LAUNCHER_SIZE_PX };
}

function closedChromeInsets(
  appearance: RuntimeChatAppearance,
  closedChrome?: EmbedClosedChrome,
) {
  return launcherFrameChromeInsets(appearance.launcher, {
    hasBadge: closedChrome?.hasLauncherBadge === true,
  });
}

/** Parent page viewport height (embed iframe may still be launcher-sized before resize). */
export function embedParentViewportHeight(): number {
  if (typeof window === "undefined") return 800;
  try {
    const parent = window.parent;
    if (parent && parent !== window && typeof parent.innerHeight === "number") {
      return parent.innerHeight;
    }
  } catch {
    // Cross-origin parent — fall back to iframe inner height.
  }
  return window.innerHeight || 800;
}

/** Host viewport height available to the embed iframe (accounts for page insets). */
export function embedHostViewportAvailableHeight(
  verticalAnchor: "top" | "bottom",
  insetTopPx: number,
  insetBottomPx: number,
  viewportHeight: number,
): number {
  const edge = verticalAnchor === "top" ? insetTopPx : insetBottomPx;
  return Math.max(OPEN_PANEL_MIN_HEIGHT_PX, viewportHeight - edge);
}

/** Max panel body height so launcher + panel fit inside the host viewport. */
export function computeEmbedOpenPanelMaxHeightPx(
  appearance: RuntimeChatAppearance,
  surface?: EmbedHostSurface,
  viewportHeight?: number,
): number {
  const { chatBox, launcher } = appearance;
  const hideLauncherWhenOpen = surface === "textUs";
  const launcherContent = estimateClosedLauncherContentSize(appearance, surface);
  const insets = closedChromeInsets(appearance);
  const verticalAnchor = launcher.verticalAnchor === "top" ? "top" : "bottom";
  const launcherReserve = hideLauncherWhenOpen
    ? 0
    : launcherContent.height + PANEL_FAB_GAP_PX;
  const parentVh =
    typeof viewportHeight === "number"
      ? viewportHeight
      : embedParentViewportHeight();
  const availableInHost = embedHostViewportAvailableHeight(
    verticalAnchor,
    launcher.insetTopPx ?? launcher.insetBottomPx,
    launcher.insetBottomPx,
    parentVh,
  );
  const panelBudget =
    availableInHost - insets.top - insets.bottom - launcherReserve;
  return Math.min(
    chatBox.boxHeight,
    Math.max(OPEN_PANEL_MIN_HEIGHT_PX, panelBudget),
  );
}

function computeOpenEmbedHostFrameSize(
  appearance: RuntimeChatAppearance,
  surface?: EmbedHostSurface,
  viewportHeight?: number,
): { width: number; height: number } {
  const { chatBox } = appearance;
  const launcherContent = estimateClosedLauncherContentSize(appearance, surface);
  const insets = closedChromeInsets(appearance);
  const panelH = computeEmbedOpenPanelMaxHeightPx(
    appearance,
    surface,
    viewportHeight,
  );
  const hideLauncherWhenOpen = surface === "textUs";
  const stackH = hideLauncherWhenOpen
    ? panelH
    : panelH + launcherContent.height + PANEL_FAB_GAP_PX;
  return {
    width:
      Math.max(chatBox.boxWidth, launcherContent.width) +
      insets.left +
      insets.right,
    height: stackH + insets.top + insets.bottom,
  };
}

/** Closed host iframe size — fits pill FABs, badge overflow, and drop shadow. */
export function estimateClosedLauncherFrameSize(
  appearance: RuntimeChatAppearance,
  surface?: EmbedHostSurface,
  closedChrome?: EmbedClosedChrome,
): { width: number; height: number } {
  const content = estimateClosedLauncherContentSize(appearance, surface);
  const insets = closedChromeInsets(appearance, closedChrome);
  return {
    width: content.width + insets.left + insets.right,
    height: content.height + insets.top + insets.bottom,
  };
}

/**
 * Parent iframe size (transparent, tight fit).
 * Page offsets (`insetBottomPx` / `insetSidePx`) are applied by `widget.js`, not here.
 */
export function computeEmbedHostFrameSize(
  open: boolean,
  appearance: RuntimeChatAppearance,
  closedChrome?: EmbedClosedChrome,
  surface?: EmbedHostSurface,
): { width: number; height: number } {
  const stackedCount = Math.max(1, closedChrome?.stackedLauncherCount ?? 1);
  const stackedGapPx = closedChrome?.stackedLauncherGapPx ?? 8;
  const launcherContent = estimateClosedLauncherContentSize(appearance, surface);
  const launcherH = launcherContent.height;
  const insets = closedChromeInsets(appearance, closedChrome);

  if (!open) {
    if (!closedChrome?.hasInvitationBubble) {
      if (stackedCount <= 1) {
        return estimateClosedLauncherFrameSize(appearance, surface, closedChrome);
      }
      const stackH =
        stackedCount * launcherContent.height +
        (stackedCount - 1) * stackedGapPx;
      return {
        width: launcherContent.width + insets.left + insets.right,
        height: stackH + insets.top + insets.bottom,
      };
    }
    return {
      width:
        Math.max(CLOSED_INVITATION_EST_WIDTH_PX, launcherContent.width) +
        insets.left +
        insets.right,
      height:
        CLOSED_INVITATION_EST_HEIGHT_PX +
        CLOSED_INVITATION_GAP_PX +
        launcherContent.height +
        insets.top +
        insets.bottom,
    };
  }

  return computeOpenEmbedHostFrameSize(
    appearance,
    surface,
    embedParentViewportHeight(),
  );
}

export function postEmbedHostResize(
  open: boolean,
  appearance: RuntimeChatAppearance,
  closedChrome?: EmbedClosedChrome,
  surface?: EmbedHostSurface,
): void {
  if (typeof window === "undefined" || window.parent === window) return;

  const { width, height } = computeEmbedHostFrameSize(
    open,
    appearance,
    closedChrome,
    surface,
  );
  const { launcher } = appearance;
  const verticalAnchor = launcher.verticalAnchor === "top" ? "top" : "bottom";

  const payload: WidgetEmbedResizePayload = {
    type: WIDGET_EMBED_RESIZE_MESSAGE,
    open,
    width: Math.ceil(width),
    height: Math.ceil(height),
    position: launcher.position,
    verticalAnchor,
    insetBottomPx: launcher.insetBottomPx,
    insetTopPx: launcher.insetTopPx ?? launcher.insetBottomPx,
    insetSidePx: launcher.insetSidePx,
    ...(surface ? { surface } : {}),
  };

  window.parent.postMessage(payload, "*");
}

const DEFAULT_INSET_BOTTOM_PX = 16;
const DEFAULT_INSET_SIDE_PX = 16;

/** Mirror `widget.js` iframe layout — used by `/test/widget` preview host page. */
export function applyEmbedHostFrameLayout(
  frame: HTMLElement,
  payload: Partial<WidgetEmbedResizePayload>,
): void {
  const pos = payload.position === "left" || payload.position === "center"
    ? payload.position
    : "right";
  const verticalAnchor = payload.verticalAnchor === "top" ? "top" : "bottom";
  const bottom =
    typeof payload.insetBottomPx === "number"
      ? payload.insetBottomPx
      : DEFAULT_INSET_BOTTOM_PX;
  const top =
    typeof payload.insetTopPx === "number"
      ? payload.insetTopPx
      : bottom;
  const side =
    typeof payload.insetSidePx === "number"
      ? payload.insetSidePx
      : DEFAULT_INSET_SIDE_PX;
  let width =
    typeof payload.width === "number" && payload.width > 0
      ? payload.width
      : EMBED_LAUNCHER_SIZE_PX;
  let height =
    typeof payload.height === "number" && payload.height > 0
      ? payload.height
      : EMBED_LAUNCHER_SIZE_PX;

  const vw = typeof window !== "undefined" ? window.innerWidth || width : width;
  const vh = typeof window !== "undefined" ? window.innerHeight || height : height;
  const maxHeight = embedHostViewportAvailableHeight(
    verticalAnchor,
    top,
    bottom,
    vh,
  );
  width = Math.min(Math.ceil(width), vw);
  height = Math.min(Math.ceil(height), maxHeight);

  const style = frame.style;
  style.position = "fixed";
  style.border = "none";
  style.margin = "0";
  style.padding = "0";
  style.background = "transparent";
  style.colorScheme = "normal";
  style.zIndex = "2147483000";
  style.width = `${width}px`;
  style.height = `${height}px`;
  if (verticalAnchor === "top") {
    style.top = `${top}px`;
    style.bottom = "auto";
  } else {
    style.bottom = `${bottom}px`;
    style.top = "auto";
  }
  style.maxWidth = "100vw";
  style.maxHeight = "100vh";
  style.overflow = "hidden";
  style.pointerEvents = "auto";

  if (pos === "left") {
    style.left = `${side}px`;
    style.right = "auto";
    style.transform = "";
  } else if (pos === "center") {
    style.left = "50%";
    style.right = "auto";
    style.transform = "translateX(-50%)";
  } else {
    style.right = `${side}px`;
    style.left = "auto";
    style.transform = "";
  }
}
