import type { ConversationSummary } from "@/services/chat/chat.types";

function extractTextFromMessageLike(raw: unknown): string | null {
  if (typeof raw === "string") {
    const t = raw.trim();
    return t || null;
  }
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  for (const key of ["content", "message", "text", "body"]) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/** Last message preview for inbox rows (supports common API field shapes). */
export function getConversationPreview(conversation: ConversationSummary, fallback: string): string {
  const o = conversation as Record<string, unknown>;
  for (const key of ["lastMessage", "last_message", "preview", "lastMessagePreview"]) {
    const text = extractTextFromMessageLike(o[key]);
    if (text) return text.length > 72 ? `${text.slice(0, 72)}…` : text;
  }
  const messages = o.messages;
  if (Array.isArray(messages) && messages.length > 0) {
    const last = messages[messages.length - 1] ?? messages[0];
    const text = extractTextFromMessageLike(last);
    if (text) return text.length > 72 ? `${text.slice(0, 72)}…` : text;
  }
  const firstMessage = extractTextFromMessageLike(o.firstMessage);
  if (firstMessage) {
    return firstMessage.length > 72 ? `${firstMessage.slice(0, 72)}…` : firstMessage;
  }
  return fallback;
}
