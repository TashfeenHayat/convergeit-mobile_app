import type { ChatMessage } from "@/services/chat/chat.types";

const AGENT_ONLY_MESSAGE_TYPES = new Set([
  "close_form_link",
  "distribution_link",
  "distribution_setup_required",
]);

const AGENT_DASHBOARD_LINK = /\/dashboard\/chat-operations/i;
const LEGACY_WRAP_UP_QUERY = /[?&]wrapUp=1\b/i;

function readMessageType(message: ChatMessage): string | undefined {
  const mt = message.metadata?.messageType;
  return typeof mt === "string" ? mt : undefined;
}

function isAgentOnlyTranscriptContent(content: string): boolean {
  if (AGENT_DASHBOARD_LINK.test(content)) return true;
  if (LEGACY_WRAP_UP_QUERY.test(content)) return true;
  if (/complete the wrap-up form/i.test(content)) return true;
  if (/open the distribution form/i.test(content)) return true;
  if (/email distribution is not set up/i.test(content)) return true;
  if (/please set up.*distribution/i.test(content)) return true;
  return false;
}

/** Auto nudge/fallback/close notices from close policy — visible even after human handoff. */
export function isVisitorPolicyNoticeMessage(message: ChatMessage): boolean {
  const messageType = readMessageType(message);
  return (
    messageType === "policy_fallback" ||
    messageType === "policy_nudge" ||
    messageType === "policy_close"
  );
}

/** Messages that must never appear in the public embed widget. */
export function isHiddenFromVisitorWidget(message: ChatMessage): boolean {
  const messageType = readMessageType(message);
  if (messageType && AGENT_ONLY_MESSAGE_TYPES.has(messageType)) {
    return true;
  }
  const content = message.content?.trim() ?? "";
  if (content && isAgentOnlyTranscriptContent(content)) {
    return true;
  }
  return false;
}

export function filterVisitorWidgetMessages(
  messages: ChatMessage[],
): ChatMessage[] {
  return messages.filter((m) => !isHiddenFromVisitorWidget(m));
}
