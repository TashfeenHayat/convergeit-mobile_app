import type { WidgetKind } from "./widgetDraft";

export type WebsiteWidgetSummary = {
  widgetKey: string;
  widgetType: string;
  widgetTypeLabel?: string;
};

function apiTypeHasChat(widgetType: string): boolean {
  const t = widgetType.toUpperCase();
  return t === "CHAT" || t === "BOTH";
}

function apiTypeHasTextUs(widgetType: string): boolean {
  const t = widgetType.toUpperCase();
  return t === "TEXT_US" || t === "BOTH";
}

function kindHasChat(kind: WidgetKind): boolean {
  return kind === "chat" || kind === "both";
}

function kindHasTextUs(kind: WidgetKind): boolean {
  return kind === "text" || kind === "both";
}

/** True when a new widget of `kind` overlaps surfaces with an existing API widget type. */
export function widgetTypesOverlap(kind: WidgetKind, existingApiType: string): boolean {
  const existing = existingApiType.toUpperCase();
  if (existing === "BOTH") return true;
  if (kind === "both") return existing === "CHAT" || existing === "TEXT_US" || existing === "BOTH";
  if (kind === "chat") return apiTypeHasChat(existing);
  if (kind === "text") return apiTypeHasTextUs(existing);
  return false;
}

export function findConflictingWebsiteWidgets(
  existing: WebsiteWidgetSummary[],
  selectedKind: WidgetKind,
  excludeWidgetKey?: string,
): WebsiteWidgetSummary[] {
  const exclude = excludeWidgetKey?.trim();
  return existing.filter((row) => {
    const key = row.widgetKey.trim();
    if (!key) return false;
    if (exclude && key === exclude) return false;
    return widgetTypesOverlap(selectedKind, row.widgetType);
  });
}

export function widgetKindToHumanLabel(kind: WidgetKind): string {
  if (kind === "text") return "Text Us";
  if (kind === "both") return "Chat + Text Us";
  return "Chat";
}

export function apiWidgetTypeToHumanLabel(apiType: string): string {
  const t = apiType.toUpperCase();
  if (t === "TEXT_US") return "Text Us";
  if (t === "BOTH") return "Chat + Text Us";
  if (t === "CHAT") return "Chat";
  return apiType || "Widget";
}

export function wizardEntryPathForKind(kind: WidgetKind, editWidgetKey?: string): string {
  const base =
    kind === "text"
      ? "/dashboard/chat-widget/add/text"
      : "/dashboard/chat-widget/add/chat/button";
  const k = editWidgetKey?.trim();
  if (!k) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}edit=${encodeURIComponent(k)}`;
}
