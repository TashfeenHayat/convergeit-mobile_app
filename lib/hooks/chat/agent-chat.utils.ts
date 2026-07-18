import type { ChatMessage } from "@/services/chat/chat.types";
import { unwrapSocketMessagePayload } from "./chat-socket-delivery";

export function stableMessageDedupeKey(message: ChatMessage): string {
  if (message.id) return `id:${message.id}`;
  return `${message.conversationId}:${message.role}:${message.createdAt ?? ""}:${message.content}`;
}

export function conversationIdFromSocketPayload(payload: unknown): string | null {
  const unwrapped = unwrapSocketMessagePayload(payload);
  if (typeof unwrapped !== "object" || !unwrapped) return null;
  const o = unwrapped as Record<string, unknown>;
  const id = o.conversationId ?? o.conversation_id ?? o.chatId ?? o.chat_id;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

export function sortMessagesChronologically(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    if (ta !== tb) return ta - tb;
    return String(a.id ?? "").localeCompare(String(b.id ?? ""));
  });
}
