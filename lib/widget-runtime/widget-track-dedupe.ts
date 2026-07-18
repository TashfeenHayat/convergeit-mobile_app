const STORAGE_PREFIX = "converge:widget:track:v1";

function storageKey(
  eventType: string,
  sessionId: string,
  pageUrl?: string,
): string {
  const page = (pageUrl ?? "").trim();
  if (eventType === "widget_open") {
    return `${STORAGE_PREFIX}:widget_open:${sessionId}`;
  }
  return `${STORAGE_PREFIX}:page_view:${sessionId}:${page}`;
}

/** Skip duplicate widget analytics sends (StrictMode, JWT refresh, double socket+REST). */
export function shouldSkipWidgetTrack(params: {
  eventType: "page_view" | "widget_open" | "chat_started" | "lead_captured";
  sessionId: string;
  pageUrl?: string;
}): boolean {
  if (typeof sessionStorage === "undefined") return false;
  const sid = params.sessionId.trim();
  if (!sid) return false;
  try {
    return sessionStorage.getItem(storageKey(params.eventType, sid, params.pageUrl)) === "1";
  } catch {
    return false;
  }
}

export function markWidgetTrackSent(params: {
  eventType: "page_view" | "widget_open" | "chat_started" | "lead_captured";
  sessionId: string;
  pageUrl?: string;
}): void {
  if (typeof sessionStorage === "undefined") return;
  const sid = params.sessionId.trim();
  if (!sid) return;
  try {
    sessionStorage.setItem(storageKey(params.eventType, sid, params.pageUrl), "1");
  } catch {
    /* ignore quota */
  }
}
