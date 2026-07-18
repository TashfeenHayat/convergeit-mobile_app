/** Sellable module codes that belong to the Live Chat product family (ops + visitor widget). */
export const LIVE_CHAT_MODULE_CODE = "live_chat" as const;

export const WIDGET_SURFACE_MODULE_CODES = ["chat_widget", "text_us"] as const;

export const LIVE_CHAT_PRODUCT_FAMILY_CODES = [
  LIVE_CHAT_MODULE_CODE,
  ...WIDGET_SURFACE_MODULE_CODES,
] as const;

const LIVE_CHAT_FAMILY_SET = new Set<string>(LIVE_CHAT_PRODUCT_FAMILY_CODES);

export type WidgetSurfaceProduct = "off" | "chat" | "text" | "both";

export const WIDGET_SURFACE_PRODUCT_OPTIONS: ReadonlyArray<{
  value: WidgetSurfaceProduct;
  label: string;
  description: string;
}> = [
  {
    value: "off",
    label: "No widget",
    description: "Live chat ops only — no embeddable visitor widget.",
  },
  {
    value: "chat",
    label: "Chat widget",
    description: "Visitor live-chat launcher and pre-chat form.",
  },
  {
    value: "text",
    label: "Text Us",
    description: "SMS-style visitor form and Twilio replies.",
  },
  {
    value: "both",
    label: "Chat + Text Us",
    description: "One embed script — client picks chat, Text Us, or both at setup.",
  },
];

export function isLiveChatProductFamilyCode(code: string): boolean {
  return LIVE_CHAT_FAMILY_SET.has(code);
}

export function widgetSurfaceFromModuleSelection(selected: Record<string, boolean>): WidgetSurfaceProduct {
  const chat = Boolean(selected.chat_widget);
  const text = Boolean(selected.text_us);
  if (chat && text) return "both";
  if (chat) return "chat";
  if (text) return "text";
  return "off";
}

export function applyWidgetSurfaceProduct(
  selected: Record<string, boolean>,
  surface: WidgetSurfaceProduct,
): Record<string, boolean> {
  const next = { ...selected };
  next.chat_widget = surface === "chat" || surface === "both";
  next.text_us = surface === "text" || surface === "both";
  return next;
}
