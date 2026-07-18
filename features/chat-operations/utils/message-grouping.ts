import type { ChatMessage } from "@/services/chat/chat.types";

export type MessageGroupPosition = "single" | "first" | "middle" | "last";

const GROUP_GAP_MS = 2 * 60 * 1000;

function sameSender(a: ChatMessage, b: ChatMessage): boolean {
  if (a.role === "system" || b.role === "system") return false;
  if (a.role === "ai" || b.role === "ai") return a.role === "ai" && b.role === "ai";
  return a.role === b.role;
}

function withinGroupGap(a: ChatMessage, b: ChatMessage): boolean {
  if (!a.createdAt || !b.createdAt) return true;
  const ta = new Date(a.createdAt).getTime();
  const tb = new Date(b.createdAt).getTime();
  if (Number.isNaN(ta) || Number.isNaN(tb)) return true;
  return Math.abs(ta - tb) < GROUP_GAP_MS;
}

export function getMessageGroupPosition(index: number, messages: ChatMessage[]): MessageGroupPosition {
  const msg = messages[index];
  if (msg.role === "system") return "single";

  const prev = messages[index - 1];
  const next = messages[index + 1];

  const groupedWithPrev = prev && prev.role !== "system" && sameSender(msg, prev) && withinGroupGap(msg, prev);
  const groupedWithNext = next && next.role !== "system" && sameSender(msg, next) && withinGroupGap(msg, next);

  if (!groupedWithPrev && !groupedWithNext) return "single";
  if (!groupedWithPrev && groupedWithNext) return "first";
  if (groupedWithPrev && groupedWithNext) return "middle";
  return "last";
}

export function shouldShowMessageAvatar(message: ChatMessage, groupPosition: MessageGroupPosition): boolean {
  if (message.role === "system") return false;
  if (message.role === "agent") return false;
  if (message.role === "ai") {
    return groupPosition === "single" || groupPosition === "first";
  }
  return groupPosition === "single" || groupPosition === "first";
}

export function shouldShowMessageMeta(groupPosition: MessageGroupPosition): boolean {
  return groupPosition === "single" || groupPosition === "last";
}
