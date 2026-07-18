const VISIT_SEEN_PREFIX = "ic.widget.visitSeen.";
const AUTO_OPEN_DISMISS_PREFIX = "ic.widget.autoOpenDismiss.";

export function visitSeenStorageKey(widgetKey: string): string {
  return `${VISIT_SEEN_PREFIX}${widgetKey}`;
}

export function autoOpenDismissStorageKey(widgetKey: string): string {
  return `${AUTO_OPEN_DISMISS_PREFIX}${widgetKey}`;
}

export function hasWidgetReturnVisit(widgetKey: string): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(visitSeenStorageKey(widgetKey)) === "1";
}

export function markWidgetReturnVisit(widgetKey: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(visitSeenStorageKey(widgetKey), "1");
}

export function dismissWidgetAutoOpenForSession(widgetKey: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(autoOpenDismissStorageKey(widgetKey), "1");
}

export function isWidgetAutoOpenDismissed(widgetKey: string): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(autoOpenDismissStorageKey(widgetKey)) === "1";
}

export function shouldRunWidgetAutoOpen(params: {
  widgetKey: string;
  autoOpenEnabled: boolean;
  autoOpenDelaySeconds: number;
  autoOpenOnReturnVisit: boolean;
  hasPersistedConversation: boolean;
}): boolean {
  if (!params.autoOpenEnabled || params.autoOpenDelaySeconds <= 0) return false;
  if (isWidgetAutoOpenDismissed(params.widgetKey)) return false;
  if (params.hasPersistedConversation) return false;
  if (hasWidgetReturnVisit(params.widgetKey)) {
    return params.autoOpenOnReturnVisit;
  }
  return true;
}
