import type { TypingPayload } from "@/services/chat/chat.types";
import {
  clearParticipantTyping,
  setParticipantTyping,
  type TypingParticipantKind,
} from "./conversation-typing-bus";

function resolveTypingKind(payload: TypingPayload): TypingParticipantKind {
  const role = payload.typingRole?.trim().toLowerCase();
  if (role === "supervisor" || role === "visitor" || role === "agent") {
    return role;
  }
  if (payload.userType === "visitor") return "visitor";
  return "agent";
}

export function applyTypingSocketPayload(payload: TypingPayload): void {
  const cid = payload.conversationId?.trim();
  if (!cid) return;
  const kind = resolveTypingKind(payload);
  setParticipantTyping(cid, kind, payload.draft, payload.userId);
}

export function applyStopTypingSocketPayload(payload: TypingPayload): void {
  const cid = payload.conversationId?.trim();
  if (!cid) return;
  const kind = resolveTypingKind(payload);
  clearParticipantTyping(cid, kind, payload.userId);
}
