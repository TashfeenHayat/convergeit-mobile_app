import {
  buildChatColorsFromDraftScalars,
  mixHex,
  pickReadableText,
} from "@/lib/widget-runtime/widget-color-tokens";
import type { WidgetDraft } from "./widgetDraft";

/** Mirrors `theme.designJson.chat.colors` (backend widget UI tokens). */
export interface WidgetChatColorsDraft {
  chatBodyText: string;
  chatMutedText: string;
  incomingMessageBg: string;
  incomingMessageText: string;
  outgoingMessageBg: string;
  outgoingMessageText: string;
  greetingBubbleBg: string;
  greetingBubbleText: string;
  inputBackground: string;
  inputText: string;
  inputBorderColor: string;
  inputPlaceholderColor: string;
  labelColor: string;
  inquiryPillBg: string;
  inquiryPillText: string;
  inquiryPillBorder: string;
  inquiryPillSelectedBg: string;
  inquiryPillSelectedText: string;
  talkToAgentButtonBg: string;
  talkToAgentButtonText: string;
  talkToAgentButtonBorder: string;
}

export type WidgetChatColorsDraftKey = keyof WidgetChatColorsDraft;

export const WIDGET_CHAT_COLOR_FIELD_GROUPS: Array<{
  title: string;
  description: string;
  fields: Array<{ key: WidgetChatColorsDraftKey; label: string }>;
}> = [
  {
    title: "Text & panel",
    description: "Body copy and muted helper text inside the widget panel.",
    fields: [
      { key: "chatBodyText", label: "Body text" },
      { key: "chatMutedText", label: "Muted text" },
    ],
  },
  {
    title: "Chat messages",
    description: "Visitor, assistant, and greeting bubble colors.",
    fields: [
      { key: "incomingMessageBg", label: "Incoming bubble background" },
      { key: "incomingMessageText", label: "Incoming bubble text" },
      { key: "outgoingMessageBg", label: "Outgoing bubble background" },
      { key: "outgoingMessageText", label: "Outgoing bubble text" },
      { key: "greetingBubbleBg", label: "Greeting bubble background" },
      { key: "greetingBubbleText", label: "Greeting bubble text" },
    ],
  },
  {
    title: "Pre-chat form inputs",
    description: "Labels and fields on the pre-chat / inquiry step.",
    fields: [
      { key: "labelColor", label: "Field label" },
      { key: "inputBackground", label: "Input background" },
      { key: "inputText", label: "Input text" },
      { key: "inputBorderColor", label: "Input border" },
      { key: "inputPlaceholderColor", label: "Placeholder text" },
    ],
  },
  {
    title: "Inquiry topic pills",
    description: "Billing / Technical / Sales chips before the form.",
    fields: [
      { key: "inquiryPillBg", label: "Idle background" },
      { key: "inquiryPillText", label: "Idle text" },
      { key: "inquiryPillBorder", label: "Idle border" },
      { key: "inquiryPillSelectedBg", label: "Selected background" },
      { key: "inquiryPillSelectedText", label: "Selected text" },
    ],
  },
  {
    title: "Talk to agent button",
    description: "“Talk to agent” control in hybrid chat mode.",
    fields: [
      { key: "talkToAgentButtonBg", label: "Background" },
      { key: "talkToAgentButtonText", label: "Text" },
      { key: "talkToAgentButtonBorder", label: "Border" },
    ],
  },
];

function str(v: unknown): string {
  return typeof v === "string" && v.trim() ? v.trim() : "";
}

/** Auto-fill color tokens from launcher + header + secondary + panel (step 1–2 scalars). */
export function deriveWidgetChatColorsDraft(
  draft: Pick<
    WidgetDraft,
    | "buttonColor"
    | "buttonHoverColor"
    | "iconColor"
    | "textColor"
    | "themeSecondaryColor"
    | "backgroundColor"
  >,
): WidgetChatColorsDraft {
  const panel = draft.backgroundColor?.trim() || "#ffffff";
  const headerText = draft.textColor?.trim() || "#0f172a";
  const secondary = draft.themeSecondaryColor?.trim() || "#64748b";
  const built = buildChatColorsFromDraftScalars({
    buttonColor: draft.buttonColor?.trim() || "#1E63D5",
    buttonHoverColor: draft.buttonHoverColor?.trim() || "#164EB0",
    iconColor: draft.iconColor?.trim() || "#ffffff",
    headerTextColor: headerText,
    secondaryColor: secondary,
    panelBackground: panel,
  });
  return mapApiChatColorsToDraft(built as Record<string, unknown>, headerText);
}

export function mapApiChatColorsToDraft(
  colors: Record<string, unknown>,
  fallbackHeaderText = "#0f172a",
): WidgetChatColorsDraft {
  return {
    chatBodyText: str(colors.bodyText) || fallbackHeaderText,
    chatMutedText: str(colors.mutedText) || "",
    incomingMessageBg: str(colors.incomingMessageBg) || str(colors.incoming_message_bg),
    incomingMessageText: str(colors.incomingMessageText) || str(colors.incoming_message_text),
    outgoingMessageBg: str(colors.outgoingMessageBg) || str(colors.outgoing_message_bg),
    outgoingMessageText: str(colors.outgoingMessageText) || str(colors.outgoing_message_text),
    greetingBubbleBg: str(colors.greetingBubbleBg) || str(colors.greeting_bubble_bg),
    greetingBubbleText: str(colors.greetingBubbleText) || str(colors.greeting_bubble_text),
    inputBackground: str(colors.inputBackground) || str(colors.input_background),
    inputText: str(colors.inputText) || str(colors.input_text),
    inputBorderColor: str(colors.inputBorderColor) || str(colors.input_border_color),
    inputPlaceholderColor:
      str(colors.inputPlaceholderColor) || str(colors.input_placeholder_color),
    labelColor: str(colors.labelColor) || str(colors.label_color),
    inquiryPillBg: str(colors.inquiryPillBg) || str(colors.inquiry_pill_bg),
    inquiryPillText: str(colors.inquiryPillText) || str(colors.inquiry_pill_text),
    inquiryPillBorder: str(colors.inquiryPillBorder) || str(colors.inquiry_pill_border),
    inquiryPillSelectedBg:
      str(colors.inquiryPillSelectedBg) || str(colors.inquiry_pill_selected_bg),
    inquiryPillSelectedText:
      str(colors.inquiryPillSelectedText) || str(colors.inquiry_pill_selected_text),
    talkToAgentButtonBg:
      str(colors.talkToAgentButtonBg) ||
      str(colors.handoverButtonBg) ||
      str(colors.handover_button_bg),
    talkToAgentButtonText:
      str(colors.talkToAgentButtonText) ||
      str(colors.handoverButtonText) ||
      str(colors.handover_button_text),
    talkToAgentButtonBorder:
      str(colors.talkToAgentButtonBorder) ||
      str(colors.handoverButtonBorder) ||
      str(colors.handover_button_border),
  };
}

export function readWidgetChatColorsFromDraft(draft: Partial<WidgetDraft>): WidgetChatColorsDraft {
  const panel = draft.backgroundColor?.trim() || "#f8fafc";
  const derived = deriveWidgetChatColorsDraft({
    buttonColor: draft.buttonColor ?? "#1E63D5",
    buttonHoverColor: draft.buttonHoverColor ?? "#164EB0",
    iconColor: draft.iconColor ?? "#ffffff",
    textColor: draft.textColor ?? "#0f172a",
    themeSecondaryColor: draft.themeSecondaryColor ?? "#64748b",
    backgroundColor: panel,
  });

  const panelSafe = (explicit: string | undefined, fallback: string) =>
    pickReadableText(panel, explicit?.trim() || fallback);

  return {
    chatBodyText: panelSafe(draft.chatBodyText, derived.chatBodyText),
    chatMutedText: draft.chatMutedText?.trim() || derived.chatMutedText,
    incomingMessageBg: draft.incomingMessageBg?.trim() || derived.incomingMessageBg,
    incomingMessageText: draft.incomingMessageText?.trim() || derived.incomingMessageText,
    outgoingMessageBg: draft.outgoingMessageBg?.trim() || derived.outgoingMessageBg,
    outgoingMessageText: draft.outgoingMessageText?.trim() || derived.outgoingMessageText,
    greetingBubbleBg: draft.greetingBubbleBg?.trim() || derived.greetingBubbleBg,
    greetingBubbleText: draft.greetingBubbleText?.trim() || derived.greetingBubbleText,
    inputBackground: draft.inputBackground?.trim() || derived.inputBackground,
    inputText: draft.inputText?.trim() || derived.inputText,
    inputBorderColor: draft.inputBorderColor?.trim() || derived.inputBorderColor,
    inputPlaceholderColor:
      draft.inputPlaceholderColor?.trim() || derived.inputPlaceholderColor,
    labelColor: panelSafe(draft.labelColor, derived.labelColor),
    inquiryPillBg: draft.inquiryPillBg?.trim() || derived.inquiryPillBg,
    inquiryPillText: draft.inquiryPillText?.trim() || derived.inquiryPillText,
    inquiryPillBorder: draft.inquiryPillBorder?.trim() || derived.inquiryPillBorder,
    inquiryPillSelectedBg:
      draft.inquiryPillSelectedBg?.trim() || derived.inquiryPillSelectedBg,
    inquiryPillSelectedText:
      draft.inquiryPillSelectedText?.trim() || derived.inquiryPillSelectedText,
    talkToAgentButtonBg: draft.talkToAgentButtonBg?.trim() || derived.talkToAgentButtonBg,
    talkToAgentButtonText: draft.talkToAgentButtonText?.trim() || derived.talkToAgentButtonText,
    talkToAgentButtonBorder:
      draft.talkToAgentButtonBorder?.trim() || derived.talkToAgentButtonBorder,
  };
}

export function widgetChatColorsDraftToPatch(
  colors: WidgetChatColorsDraft,
): Partial<WidgetDraft> {
  return { ...colors };
}

/** Publish payload for `theme.designJson.chat.colors`. */
export function buildChatColorsFromWidgetDraft(draft: WidgetDraft): Record<string, string> {
  const panel = draft.backgroundColor?.trim() || "#ffffff";
  const headerText = draft.textColor?.trim() || "#0f172a";
  const secondary = draft.themeSecondaryColor?.trim() || "#64748b";
  const button = draft.buttonColor?.trim() || "#1E63D5";
  const icon = draft.iconColor?.trim() || "#ffffff";
  const c = readWidgetChatColorsFromDraft(draft);

  const incomingBg =
    c.incomingMessageBg || mixHex(secondary, panel, 22);
  const incomingText =
    c.incomingMessageText || pickReadableText(incomingBg, headerText);

  return {
    button,
    buttonHover: draft.buttonHoverColor?.trim() || button,
    icon,
    headerText,
    secondary,
    panelBackground: panel,
    bodyText: c.chatBodyText || pickReadableText(panel, headerText),
    mutedText: c.chatMutedText || mixHex(c.chatBodyText || pickReadableText(panel, headerText), panel, 62),
    incomingMessageBg: incomingBg,
    incomingMessageText: incomingText,
    outgoingMessageBg: c.outgoingMessageBg || button,
    outgoingMessageText: c.outgoingMessageText || pickReadableText(button, icon),
    greetingBubbleBg: c.greetingBubbleBg || incomingBg,
    greetingBubbleText: c.greetingBubbleText || incomingText,
    inputBackground: c.inputBackground || "#ffffff",
    inputText: c.inputText || pickReadableText(c.inputBackground || "#ffffff", headerText),
    inputBorderColor: c.inputBorderColor || mixHex(secondary, panel, 55),
    inputPlaceholderColor: c.inputPlaceholderColor || c.chatMutedText,
    labelColor: c.labelColor || pickReadableText(panel, headerText),
    inquiryPillBg: c.inquiryPillBg || panel,
    inquiryPillText: c.inquiryPillText || pickReadableText(panel, headerText),
    inquiryPillBorder: c.inquiryPillBorder || mixHex(secondary, panel, 70),
    inquiryPillSelectedBg: c.inquiryPillSelectedBg || button,
    inquiryPillSelectedText:
      c.inquiryPillSelectedText || pickReadableText(button, icon),
    talkToAgentButtonBg: c.talkToAgentButtonBg || panel,
    talkToAgentButtonText: c.talkToAgentButtonText || pickReadableText(panel, headerText),
    talkToAgentButtonBorder: c.talkToAgentButtonBorder || button,
  };
}
