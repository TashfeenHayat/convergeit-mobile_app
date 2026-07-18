import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearGuestSession,
  guestSessionFromExchange,
  hydrateGuestSession,
  loadGuestSession,
  saveGuestSession,
  type StoredGuestSession,
} from "@/lib/chat/guest-session";
import {
  conversationIdFromSocketPayload,
  sortMessagesChronologically,
  stableMessageDedupeKey,
} from "@/lib/hooks/chat/agent-chat.utils";
import {
  CHAT_DISCONNECTED_SYNC_MS,
  CHAT_RECONNECT_SYNC_DEBOUNCE_MS,
  normalizeSocketMessage,
  scheduleJoinRoomRetries,
  unwrapSocketMessagePayload,
} from "@/lib/hooks/chat/chat-socket-delivery";
import {
  exchangeGuestLinkToken,
  getGuestTranscript,
  type GuestSocketClient,
} from "@/services/chat/guest.api";
import {
  applyStopTypingSocketPayload,
  applyTypingSocketPayload,
} from "@/lib/hooks/chat/apply-typing-socket-payload";
import { createChatSocketClient } from "@/services/chat/chatSocket";
import type { ChatMessage, TypingPayload } from "@/services/chat/chat.types";
import type { GuestTranscriptResponse } from "@/services/chat/guest.types";

export type GuestChatPhase = "loading" | "ready" | "error" | "no_access";

function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: { message?: string | string[] } } }).response?.data;
    const msg = data?.message;
    if (typeof msg === "string") return msg;
    if (Array.isArray(msg) && msg[0]) return String(msg[0]);
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function sameConversationId(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function isGuestOptimisticMessageId(id: string | undefined): boolean {
  if (!id) return false;
  return id.startsWith("optimistic-") || id.startsWith("guest-local-");
}

/** Drop temporary supervisor send rows when the real message arrives. */
function stripMatchingGuestOptimistic(
  map: Map<string, ChatMessage>,
  confirmed: ChatMessage,
): void {
  if (!confirmed.id || isGuestOptimisticMessageId(confirmed.id)) return;
  for (const [k, existing] of map) {
    if (
      isGuestOptimisticMessageId(existing.id) &&
      existing.role === confirmed.role &&
      existing.content === confirmed.content &&
      sameConversationId(existing.conversationId, confirmed.conversationId)
    ) {
      map.delete(k);
    }
  }
}

export function useGuestChatSession(
  emailToken: string | null,
  supervisorEmail: string | null = null,
) {
  const socketClient = useMemo(() => createChatSocketClient(), []);
  const [phase, setPhase] = useState<GuestChatPhase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<StoredGuestSession | null>(null);
  const [transcript, setTranscript] = useState<GuestTranscriptResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messageMapRef = useRef(new Map<string, ChatMessage>());
  const connectedTokenRef = useRef<string | null>(null);
  const sessionRef = useRef<StoredGuestSession | null>(null);
  const phaseRef = useRef<GuestChatPhase>("loading");
  const reconnectSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncMessagesFromMap = useCallback(() => {
    setMessages(sortMessagesChronologically(Array.from(messageMapRef.current.values())));
  }, []);

  const upsertMessage = useCallback(
    (message: ChatMessage) => {
      stripMatchingGuestOptimistic(messageMapRef.current, message);
      messageMapRef.current.set(stableMessageDedupeKey(message), message);
      syncMessagesFromMap();
    },
    [syncMessagesFromMap],
  );

  const applyTranscriptEnvelope = useCallback(
    (data: GuestTranscriptResponse, opts?: { replaceAll?: boolean }) => {
      setTranscript(data);
      if (opts?.replaceAll) {
        messageMapRef.current.clear();
      }
      for (const msg of data.messages ?? []) {
        stripMatchingGuestOptimistic(messageMapRef.current, msg);
        messageMapRef.current.set(stableMessageDedupeKey(msg), msg);
      }
      syncMessagesFromMap();
    },
    [syncMessagesFromMap],
  );

  const mergeTranscriptGapFill = useCallback(async (s: StoredGuestSession) => {
    if (!s.permissions.viewTranscript) return;
    const data = await getGuestTranscript(
      s.conversationId,
      s.accessToken,
      s.websiteId,
      socketClient,
    );
    applyTranscriptEnvelope(data);
  }, [applyTranscriptEnvelope, socketClient]);

  const loadTranscript = useCallback(
    async (s: StoredGuestSession) => {
      if (!s.permissions.viewTranscript) {
        setPhase("no_access");
        setError("This guest link does not include transcript access.");
        return;
      }
      socketClient.connect({ authToken: s.accessToken, forceNew: true });
      await socketClient.waitUntilSocketReady(12_000);
      const data = await getGuestTranscript(
        s.conversationId,
        s.accessToken,
        s.websiteId,
        socketClient,
      );
      applyTranscriptEnvelope(data, { replaceAll: true });
      setPhase("ready");
    },
    [applyTranscriptEnvelope, socketClient],
  );

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const scheduleReconnectSync = useCallback(() => {
    const s = sessionRef.current;
    if (!s || phaseRef.current !== "ready") return;
    if (reconnectSyncTimerRef.current) clearTimeout(reconnectSyncTimerRef.current);
    reconnectSyncTimerRef.current = setTimeout(() => {
      reconnectSyncTimerRef.current = null;
      void mergeTranscriptGapFill(s);
    }, CHAT_RECONNECT_SYNC_DEBOUNCE_MS);
  }, [mergeTranscriptGapFill]);

  const deliverIncomingMessage = useCallback(
    (
      payload: unknown,
      options?: { forcedRole?: ChatMessage["role"]; trustActiveConversation?: boolean },
    ) => {
      const openId = sessionRef.current?.conversationId ?? null;
      if (!openId) return;

      let normalized = normalizeSocketMessage(payload, openId);
      if (!normalized && openId) {
        const payloadCid = conversationIdFromSocketPayload(payload);
        if (
          payloadCid &&
          (options?.trustActiveConversation ||
            sameConversationId(payloadCid, openId))
        ) {
          const unwrapped = unwrapSocketMessagePayload(payload);
          if (unwrapped && typeof unwrapped === "object") {
            normalized = normalizeSocketMessage(
              {
                ...(unwrapped as Record<string, unknown>),
                conversationId: openId,
              },
              openId,
            );
          }
        }
      }
      if (!normalized && openId && options?.trustActiveConversation) {
        const unwrapped = unwrapSocketMessagePayload(payload);
        if (unwrapped && typeof unwrapped === "object") {
          normalized = normalizeSocketMessage(
            { ...(unwrapped as Record<string, unknown>), conversationId: openId },
            openId,
          );
        }
      }
      if (!normalized) {
        scheduleReconnectSync();
        return;
      }
      if (options?.forcedRole) {
        normalized = { ...normalized, role: options.forcedRole };
      }
      if (
        openId &&
        !sameConversationId(normalized.conversationId, openId) &&
        options?.trustActiveConversation
      ) {
        normalized = { ...normalized, conversationId: openId };
      }
      if (!sameConversationId(normalized.conversationId, openId)) return;
      upsertMessage(normalized);
    },
    [scheduleReconnectSync, upsertMessage],
  );

  const bootstrap = useCallback(async () => {
    setPhase("loading");
    setError(null);

    try {
      if (emailToken?.trim()) {
        const exchanged = await exchangeGuestLinkToken(
          emailToken.trim(),
          supervisorEmail,
        );
        const stored = guestSessionFromExchange(exchanged);
        saveGuestSession(stored);
        setSession(stored);
        await loadTranscript(stored);
        return;
      }

      await hydrateGuestSession();
      const stored = loadGuestSession();
      if (!stored) {
        setPhase("error");
        setError("Open the secure link from your email to view this chat.");
        return;
      }

      setSession(stored);
      await loadTranscript(stored);
    } catch (err) {
      await hydrateGuestSession();
      const stored = loadGuestSession();
      if (!emailToken?.trim() && stored) {
        try {
          setSession(stored);
          await loadTranscript(stored);
          return;
        } catch {
          clearGuestSession();
        }
      }
      setPhase("error");
      setError(
        errorMessage(
          err,
          "This guest link is invalid, expired, or was already used. Request a new link from your team.",
        ),
      );
    }
  }, [emailToken, supervisorEmail, loadTranscript]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!session || phase !== "ready" || !session.permissions.viewTranscript) {
      return;
    }

    const tokenChanged = connectedTokenRef.current !== session.accessToken;
    if (tokenChanged) {
      connectedTokenRef.current = session.accessToken;
      socketClient.connect({ authToken: session.accessToken, forceNew: true });
    } else {
      socketClient.connect({ authToken: session.accessToken });
    }

    let clearJoinRetries: (() => void) | undefined;
    const joinRoomWithRetries = () => {
      socketClient.joinRoom({ conversationId: session.conversationId });
      clearJoinRetries?.();
      clearJoinRetries = scheduleJoinRoomRetries(
        (cid) => socketClient.joinRoom({ conversationId: cid }),
        session.conversationId,
        () =>
          phaseRef.current === "ready" &&
          sameConversationId(sessionRef.current?.conversationId, session.conversationId),
      );
    };

    const resyncAfterReconnect = () => {
      setIsConnected(true);
      joinRoomWithRetries();
      scheduleReconnectSync();
    };

    joinRoomWithRetries();
    setIsConnected(socketClient.isConnected());
    scheduleReconnectSync();

    const offSocketConnect = socketClient.onSocketConnect(resyncAfterReconnect);
    const offSocketDisconnect = socketClient.onSocketDisconnect(() => {
      setIsConnected(false);
    });
    const offConnected = socketClient.onConnected(resyncAfterReconnect);

    const offVisitorMessage = socketClient.onVisitorMessageRaw((payload) => {
      deliverIncomingMessage(payload, {
        forcedRole: "visitor",
        trustActiveConversation: true,
      });
    });
    const offAgentMessage = socketClient.onAgentMessageRaw((payload) => {
      deliverIncomingMessage(payload, {
        forcedRole: "agent",
        trustActiveConversation: true,
      });
    });
    const offAiMessage = socketClient.onAiMessageRaw((payload) => {
      deliverIncomingMessage(payload, {
        forcedRole: "system",
        trustActiveConversation: true,
      });
    });
    const offMonitorLive = socketClient.onMonitorLiveUpdate((update) => {
      if (!sameConversationId(update.conversationId, session.conversationId)) return;
      const event = String(update.event ?? "").toLowerCase();
      if (event === "typing" || event === "stop_typing") {
        const payload =
          update.payload && typeof update.payload === "object"
            ? ({
                ...(update.payload as Record<string, unknown>),
                conversationId:
                  (update.payload as { conversationId?: string }).conversationId ??
                  update.conversationId,
              } as TypingPayload)
            : ({ conversationId: update.conversationId } as TypingPayload);
        if (event === "typing") {
          applyTypingSocketPayload(payload);
        } else {
          applyStopTypingSocketPayload(payload);
        }
        return;
      }
      if (event.includes("typing") && !event.includes("stop")) {
        applyTypingSocketPayload({
          conversationId: update.conversationId,
          ...(update.payload && typeof update.payload === "object"
            ? (update.payload as TypingPayload)
            : {}),
        });
        return;
      }
      if (event.includes("stop_typing")) {
        applyStopTypingSocketPayload({
          conversationId: update.conversationId,
          ...(update.payload && typeof update.payload === "object"
            ? (update.payload as TypingPayload)
            : {}),
        });
        return;
      }
      if (
        event !== "visitor_message" &&
        event !== "agent_message" &&
        event !== "ai_message" &&
        !event.includes("message")
      ) {
        if (
          event.includes("supervisor") ||
          event.includes("control") ||
          event.includes("talk_to_agent") ||
          event.includes("handover") ||
          event.includes("assigned")
        ) {
          scheduleReconnectSync();
        }
        return;
      }
      const forcedRole: ChatMessage["role"] | undefined =
        event === "agent_message" || event.includes("agent")
          ? "agent"
          : event === "ai_message" || event.includes("ai")
            ? "system"
            : event === "visitor_message" || event.includes("visitor")
              ? "visitor"
              : undefined;
      const payload =
        update.payload && typeof update.payload === "object"
          ? {
              ...(update.payload as Record<string, unknown>),
              conversationId:
                (update.payload as { conversationId?: string }).conversationId ??
                update.conversationId,
            }
          : update.payload;
      deliverIncomingMessage(payload, {
        forcedRole,
        trustActiveConversation: true,
      });
    });
    const offSupervisorControl = socketClient.onSupervisorControl((payload) => {
      if (!sameConversationId(conversationIdFromSocketPayload(payload), session.conversationId)) {
        return;
      }
      scheduleReconnectSync();
    });
    const offTyping = socketClient.onTyping((payload) => {
      if (!sameConversationId(payload.conversationId, session.conversationId)) return;
      applyTypingSocketPayload(payload);
    });
    const offStopTyping = socketClient.onStopTyping((payload) => {
      if (!sameConversationId(payload.conversationId, session.conversationId)) return;
      applyStopTypingSocketPayload(payload);
    });
    const markClosed = (payload: unknown) => {
      if (!sameConversationId(conversationIdFromSocketPayload(payload), session.conversationId)) {
        return;
      }
      setTranscript((prev) =>
        prev ? { ...prev, chatCompleted: true, status: "closed" } : prev,
      );
    };
    const offChatClosed = socketClient.onChatClosed(markClosed);
    const offChatCompleted = socketClient.onChatCompleted(markClosed);

    return () => {
      if (reconnectSyncTimerRef.current) clearTimeout(reconnectSyncTimerRef.current);
      reconnectSyncTimerRef.current = null;
      clearJoinRetries?.();
      offSocketConnect();
      offSocketDisconnect();
      offConnected();
      offVisitorMessage();
      offAgentMessage();
      offAiMessage();
      offMonitorLive();
      offSupervisorControl();
      offTyping();
      offStopTyping();
      offChatClosed();
      offChatCompleted();
      socketClient.leaveRoom({ conversationId: session.conversationId });
    };
  }, [
    deliverIncomingMessage,
    phase,
    scheduleReconnectSync,
    session,
    socketClient,
  ]);

  useEffect(
    () => () => {
      if (reconnectSyncTimerRef.current) clearTimeout(reconnectSyncTimerRef.current);
    },
    [],
  );

  /** Gap-fill when socket is down — avoid aggressive polling while connected. */
  useEffect(() => {
    if (!session || phase !== "ready" || isConnected) return;
    const isClosed =
      transcript?.chatCompleted === true ||
      String(transcript?.status ?? "").toLowerCase() === "closed";
    if (isClosed) return;

    const tick = () => {
      void mergeTranscriptGapFill(session);
    };
    tick();
    const interval = setInterval(tick, CHAT_DISCONNECTED_SYNC_MS);
    return () => clearInterval(interval);
  }, [
    isConnected,
    mergeTranscriptGapFill,
    phase,
    session,
    transcript?.chatCompleted,
    transcript?.status,
  ]);

  const refreshTranscript = useCallback(async () => {
    if (!session) return;
    setRefreshing(true);
    try {
      await mergeTranscriptGapFill(session);
    } catch (err) {
      setError(errorMessage(err, "Could not refresh transcript."));
    } finally {
      setRefreshing(false);
    }
  }, [mergeTranscriptGapFill, session]);

  const appendOptimisticMessage = useCallback(
    (content: string, role: ChatMessage["role"] = "agent") => {
      const s = sessionRef.current;
      if (!s || !content.trim()) return;
      upsertMessage({
        id: `optimistic-${Date.now()}`,
        conversationId: s.conversationId,
        content: content.trim(),
        role,
        createdAt: new Date().toISOString(),
      });
    },
    [upsertMessage],
  );

  const signOutGuest = useCallback(() => {
    clearGuestSession();
    setSession(null);
    setTranscript(null);
    messageMapRef.current.clear();
    setMessages([]);
    setPhase("error");
    setError("Session ended. Use your email link again to reconnect.");
  }, []);

  const emitLiveTyping = useCallback(
    (draft?: string) => {
      const s = sessionRef.current;
      if (!s) return;
      const text = typeof draft === "string" ? draft : "";
      const userId = s.involvementUserId?.trim();
      if (!text.trim()) {
        socketClient.emitStopTyping({
          conversationId: s.conversationId,
          userType: "agent",
          ...(userId ? { userId } : {}),
        });
        return;
      }
      socketClient.emitTyping({
        conversationId: s.conversationId,
        userType: "agent",
        ...(userId ? { userId } : {}),
        draft: text,
      });
    },
    [socketClient],
  );

  return {
    phase,
    error,
    session,
    transcript,
    messages,
    refreshing,
    isConnected,
    refreshTranscript,
    appendOptimisticMessage,
    emitLiveTyping,
    signOutGuest,
    guestSocket: socketClient as GuestSocketClient,
  };
}
