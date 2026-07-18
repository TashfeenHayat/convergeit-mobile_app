import { PAGE } from "@/lib/permissions/permission-constants";
import type { WidgetKind } from "./widgetDraft";

/** Widget kinds the tenant may create from sellable modules (`chat_widget`, `text_us`). */
export function resolveAllowedWidgetKinds(
  hasPage: (permission: string) => boolean,
): WidgetKind[] {
  const hasChat = hasPage(PAGE.CHAT_WIDGET);
  const hasText = hasPage(PAGE.PHONE_NUMBER_SETUP);
  const allowed: WidgetKind[] = [];
  if (hasChat) allowed.push("chat");
  if (hasText) allowed.push("text");
  if (hasChat && hasText) allowed.push("both");
  return allowed;
}

export function pickDefaultWidgetKind(allowed: readonly WidgetKind[]): WidgetKind | null {
  if (!allowed.length) return null;
  if (allowed.includes("both")) return "both";
  return allowed[0] ?? null;
}

export function clampWidgetKind(
  kind: WidgetKind,
  allowed: readonly WidgetKind[],
): WidgetKind | null {
  if (!allowed.length) return null;
  if (allowed.includes(kind)) return kind;
  return pickDefaultWidgetKind(allowed);
}

export function isWidgetKindAllowed(
  kind: WidgetKind,
  allowed: readonly WidgetKind[],
): boolean {
  return allowed.includes(kind);
}
