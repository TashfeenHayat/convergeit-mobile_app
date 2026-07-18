import type { ChatMessage, ChatParticipantRole } from "./chat.types";

/** Raw message payloads from Socket.IO / history (Prisma-style or transitional). */
export type RawChatMessagePayload = Record<string, unknown>;

function coerceString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

const POLICY_SYSTEM_MESSAGE_TYPES = new Set([
  "policy_nudge",
  "policy_fallback",
  "policy_close",
  "distribution_link",
  "close_form_link",
  "distribution_setup_required",
]);

function readMessageType(payload: Record<string, unknown>): string {
  const direct =
    coerceString(payload.messageType) || coerceString(payload.message_type);
  if (direct) return direct;
  const meta = payload.metadata;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return coerceString((meta as Record<string, unknown>).messageType);
  }
  return "";
}

function inferRole(payload: Record<string, unknown>): ChatParticipantRole {
  const messageType = readMessageType(payload);
  if (POLICY_SYSTEM_MESSAGE_TYPES.has(messageType)) {
    return "system";
  }

  const explicitRole = coerceString(payload.role).toLowerCase();
  if (explicitRole === "ai") return "ai";
  if (
    explicitRole === "visitor" ||
    explicitRole === "agent" ||
    explicitRole === "system" ||
    explicitRole === "assistant"
  ) {
    return explicitRole === "assistant" ? "ai" : (explicitRole as ChatParticipantRole);
  }

  const roleRaw = explicitRole;
  const senderTypeRaw = coerceString(
    payload.senderType ?? payload.sender_type,
  ).toLowerCase();
  const userTypeRaw = coerceString(
    (payload.userType ?? payload.authorType) as unknown,
  ).toLowerCase();

  if (senderTypeRaw === "system") return "system";
  if (senderTypeRaw === "visitor") return "visitor";
  if (senderTypeRaw === "agent") return "agent";
  if (senderTypeRaw === "ai") return "ai";

  if (userTypeRaw === "visitor") return "visitor";
  if (userTypeRaw === "agent") return "agent";
  if (
    userTypeRaw === "staff" ||
    userTypeRaw === "operator" ||
    userTypeRaw === "human" ||
    userTypeRaw === "support" ||
    userTypeRaw === "advisor"
  ) {
    return "agent";
  }
  if (userTypeRaw === "ai") return "ai";
  const senderRaw = coerceString(payload.sender ?? payload.sentBy ?? payload.messageSender).toLowerCase();
  if (senderRaw.includes("visitor")) return "visitor";
  if (senderRaw.includes("agent") && !senderRaw.includes("ai")) return "agent";
  if (senderRaw.includes("ai") || senderRaw.includes("assistant")) return "ai";
  if (senderRaw.includes("system")) return "system";
  return "visitor";
}

/**
 * Normalize backend message payloads (REST history + Socket.IO) into {@link ChatMessage}.
 */
export function normalizeServerMessage(payload: unknown): ChatMessage | null {
  if (!payload || typeof payload !== "object") return null;
  const pl = payload as RawChatMessagePayload;

  const conversationId = coerceString(
    pl.conversationId ?? pl.conversation_id ?? pl.chatId ?? pl.chat_id,
  );
  if (!conversationId) return null;

  const content =
    coerceString(pl.message) ||
    coerceString(pl.content) ||
    coerceString(pl.text) ||
    coerceString(pl.body);

  const id =
    (typeof pl.id === "string" && pl.id) ||
    (typeof pl.messageId === "string" && pl.messageId) ||
    undefined;

  const createdAtRaw = pl.createdAt ?? pl.created_at ?? pl.timestamp;
  const createdAt =
    typeof createdAtRaw === "string"
      ? createdAtRaw
      : createdAtRaw instanceof Date
        ? createdAtRaw.toISOString()
        : typeof createdAtRaw === "number" && Number.isFinite(createdAtRaw)
          ? new Date(createdAtRaw).toISOString()
          : undefined;

  const senderId =
    (typeof pl.senderId === "string" && pl.senderId) ||
    (typeof pl.userId === "string" && pl.userId) ||
    (typeof pl.agentId === "string" && pl.agentId) ||
    (typeof pl.visitorId === "string" && pl.visitorId) ||
    undefined;

  const senderName =
    (typeof pl.senderName === "string" && pl.senderName) ||
    (typeof pl.name === "string" && pl.name) ||
    undefined;

  const meta =
    typeof pl.metadata === "object" && pl.metadata !== null
      ? (pl.metadata as Record<string, unknown>)
      : typeof pl.meta === "object" && pl.meta !== null
        ? (pl.meta as Record<string, unknown>)
        : undefined;

  const messageType =
    (typeof pl.messageType === "string" && pl.messageType) ||
    (typeof pl.message_type === "string" && pl.message_type) ||
    undefined;

  const attachmentMetadata =
    typeof pl.attachmentMetadata === "object" && pl.attachmentMetadata !== null
      ? (pl.attachmentMetadata as Record<string, unknown>)
      : typeof pl.attachment_metadata === "object" && pl.attachment_metadata !== null
        ? (pl.attachment_metadata as Record<string, unknown>)
        : undefined;

  const role = inferRole(pl as Record<string, unknown>);

  const mergedMetadata: Record<string, unknown> = {
    ...(meta ?? {}),
    ...(messageType ? { messageType } : {}),
    ...(attachmentMetadata ? { attachmentMetadata } : {}),
  };
  if (attachmentMetadata) {
    if (attachmentMetadata.sentBySupervisor === true) {
      mergedMetadata.sentBySupervisor = true;
    }
    const richCard = attachmentMetadata.richCard;
    if (richCard && typeof richCard === "object" && !Array.isArray(richCard)) {
      mergedMetadata.richCard = richCard;
    }
    if (typeof attachmentMetadata.path === "string") {
      mergedMetadata.path = attachmentMetadata.path;
    }
    if (typeof attachmentMetadata.href === "string") {
      mergedMetadata.href = attachmentMetadata.href;
    }
    if (typeof attachmentMetadata.label === "string") {
      mergedMetadata.label = attachmentMetadata.label;
    }
    if (typeof attachmentMetadata.category === "string") {
      mergedMetadata.category = attachmentMetadata.category;
    }
  }

  return {
    id,
    conversationId,
    content,
    role,
    senderId,
    senderName,
    createdAt,
    ...(Object.keys(mergedMetadata).length ? { metadata: mergedMetadata } : {}),
  };
}
