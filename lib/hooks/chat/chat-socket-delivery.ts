import { normalizeServerMessage } from "@/services/chat/normalize-message";
import type { ChatMessage } from "@/services/chat/chat.types";

function coerceNestedRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** Flatten common backend envelopes before normalization. */
export function unwrapSocketMessagePayload(payload: unknown): unknown {
  if (payload == null) return payload;

  let cur: unknown = payload;
  for (let depth = 0; depth < 4; depth++) {
    const o = coerceNestedRecord(cur);
    if (!o) break;

    const nested =
      o.visitorMessage ??
      o.agentMessage ??
      o.aiMessage ??
      o.messageRow ??
      o.message;

    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const inner = nested as Record<string, unknown>;
      cur = {
        ...inner,
        conversationId:
          inner.conversationId ??
          inner.conversation_id ??
          o.conversationId ??
          o.conversation_id,
      };
      continue;
    }

    if (
      (o.success === true || o.success === "true") &&
      o.data &&
      typeof o.data === "object"
    ) {
      cur = o.data;
      continue;
    }

    break;
  }

  return cur;
}

/** Normalize socket payload; inject active conversation id when backend omits it. */
export function normalizeSocketMessage(
  payload: unknown,
  fallbackConversationId: string | null,
): ChatMessage | null {
  const unwrapped = unwrapSocketMessagePayload(payload);
  let normalized = normalizeServerMessage(unwrapped);
  if (!normalized && fallbackConversationId && unwrapped && typeof unwrapped === "object") {
    normalized = normalizeServerMessage({
      ...(unwrapped as Record<string, unknown>),
      conversationId: fallbackConversationId,
    });
  }
  return normalized;
}

/** Nest/socket handlers may return the payload directly or wrapped in { success, data }. */
export function unwrapSocketAckPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }
  const o = payload as Record<string, unknown>;
  if (o.success === true && o.data != null && typeof o.data === "object") {
    return o.data;
  }
  return payload;
}

/** Debounced REST gap-fill only after reconnect or unparseable socket payload. */
export const CHAT_RECONNECT_SYNC_DEBOUNCE_MS = 400;

/** Slow REST poll only while chat socket is disconnected (recovery safety net). */
export const CHAT_DISCONNECTED_SYNC_MS = 90_000;

/** Staggered join_room retries while socket handshake completes. */
export const CHAT_JOIN_ROOM_RETRY_MS = [250, 1000, 2500] as const;

export function scheduleJoinRoomRetries(
  join: (conversationId: string) => void,
  conversationId: string,
  isActive: () => boolean,
): () => void {
  const timers = CHAT_JOIN_ROOM_RETRY_MS.map((delay) =>
    window.setTimeout(() => {
      if (isActive()) join(conversationId);
    }, delay),
  );
  return () => timers.forEach((t) => window.clearTimeout(t));
}

type RoomJoinSocket = {
  joinRoomWithAck: (payload: { conversationId: string }) => Promise<void>;
  joinRoom: (payload: { conversationId: string }) => void;
};

/** Prefer acked join; fall back to emit + staggered retries. */
export function ensureConversationRoomJoin(
  socketClient: RoomJoinSocket,
  conversationId: string,
  isActive: () => boolean,
): () => void {
  let retryCleanup: (() => void) | undefined;
  const joinWithAck = (cid: string) =>
    socketClient.joinRoomWithAck({ conversationId: cid });
  const fallbackJoin = (cid: string) =>
    socketClient.joinRoom({ conversationId: cid });

  void joinWithAck(conversationId).catch(() => {
    fallbackJoin(conversationId);
    retryCleanup = scheduleJoinRoomRetries(
      (cid) => {
        void joinWithAck(cid).catch(() => fallbackJoin(cid));
      },
      conversationId,
      isActive,
    );
  });

  return () => retryCleanup?.();
}

export function conversationIdFromNotificationPayload(
  notification: { payload?: Record<string, unknown> | null; href?: string | null },
): string | null {
  const pl = notification.payload;
  if (pl && typeof pl === "object") {
    const direct =
      (typeof pl.conversationId === "string" && pl.conversationId.trim()) ||
      (typeof pl.conversation_id === "string" && pl.conversation_id.trim()) ||
      (typeof pl.chatId === "string" && pl.chatId.trim());
    if (direct) return direct.trim();
  }
  const href = notification.href?.trim();
  if (href) {
    try {
      const url = href.startsWith("http")
        ? new URL(href)
        : new URL(href, "http://local");
      const fromQuery = url.searchParams.get("conversationId")?.trim();
      if (fromQuery) return fromQuery;
    } catch {
      /* ignore malformed href */
    }
    const match = href.match(/conversationId=([0-9a-f-]{36})/i);
    if (match?.[1]) return match[1];
  }
  return null;
}
