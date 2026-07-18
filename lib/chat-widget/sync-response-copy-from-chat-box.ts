import type { WidgetDraft } from "./widgetDraft";
import { defaultWidgetDraft } from "./widgetDraft";

/** Keep `config.response` aligned with Chat Box step copy (no duplicate wizard fields). */
export function syncResponseCopyFromChatBox(draft: WidgetDraft): Partial<WidgetDraft> {
  const def = defaultWidgetDraft;
  return {
    responseGreetingMessage:
      draft.greetingMessage?.trim() || def.responseGreetingMessage,
    responseWelcomeMessage:
      draft.greetingMessage?.trim() ||
      draft.firstMessage?.trim() ||
      def.responseWelcomeMessage,
    responseSendPlaceholder:
      draft.sendPlaceholder?.trim() ||
      draft.messagePlaceholder?.trim() ||
      def.responseSendPlaceholder,
    responseAiPromptHint:
      draft.responseAiPromptHint?.trim() || def.responseAiPromptHint,
    welcomeMessageBehavior:
      draft.greetingMessage?.trim() ||
      draft.firstMessage?.trim() ||
      draft.welcomeMessageBehavior?.trim() ||
      def.welcomeMessageBehavior,
  };
}
