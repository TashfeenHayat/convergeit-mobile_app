import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createWidgetConversation,
  fetchWidgetTranscript,
  postWidgetTalkToAgent,
  sendWidgetVisitorMessage,
  type WidgetTalkToAgentResult,
} from "@/services/chat/widget-visitor.api";
import { createChatSocketClient } from "@/services/chat/chatSocket";
import { normalizeServerMessage } from "@/services/chat/normalize-message";
import {
  CHAT_DISCONNECTED_SYNC_MS,
  CHAT_RECONNECT_SYNC_DEBOUNCE_MS,
  normalizeSocketMessage,
  ensureConversationRoomJoin,
  unwrapSocketAckPayload,
  unwrapSocketMessagePayload,
} from "./chat-socket-delivery";
import { conversationIdFromSocketPayload } from "./agent-chat.utils";
import {
  filterVisitorWidgetMessages,
  isHiddenFromVisitorWidget,
} from "./visitor-widget-messages";
import type {
  ChatMessage,
  TypingPayload,
  VisitorCreateConversationPayload,
  VisitorCreateConversationResponse,
} from "@/services/chat/chat.types";
import type { WidgetTranscriptMessage, WidgetTranscriptResult } from "@/services/chat/widget-visitor.api";

export interface UseVisitorChatOptions {
  autoConnect?: boolean;
  /** Widget session JWT (`POST /widget/session`). Required for authenticated Socket.IO in production. */
  widgetSessionToken?: string | null;
  websiteId?: string | null;
  getCurrentPageUrl?: () => string;
  onChatAssigned?: () => void;
  onChatQueued?: () => void;
  /** Fired when a supervisor takes/releases direct control (takeover). */
  onSupervisorControl?: () => void;
  /** When true, ignore server-persisted AI rows (HYBRID after “Talk to agent”). */
  getSkipServerAiReply?: () => boolean;
  /** Agent/AI socket replies (for launcher badge + browser notify when panel closed). */
  onIncomingReply?: (message: ChatMessage) => void;
}

export interface UseVisitorChatReturn {
  conversationId: string | null;
  visitorId: string | null;
  assigned: boolean;
  messages: ChatMessage[];
  isConnected: boolean;
  /** True when an agent is emitting typing for the active conversation. */
  agentTypingSeen: boolean;
  /** True while the server is generating an AI reply (before/during stream). */
  botReplying: boolean;
  /** Streaming AI reply text (grows token-by-token via `ai_reply_delta`). */
  botStreamingText: string;
  startConversation: (
    payload: VisitorCreateConversationPayload,
  ) => Promise<VisitorCreateConversationResponse>;
  /** Restore socket + messages after embed reload (localStorage conversation id). */
  resumeConversation: (params: {
    conversationId: string;
    visitorId?: string | null;
    status?: string;
    messages: WidgetTranscriptMessage[];
  }) => void;
  sendMessage: (
    content: string,
    options?: { messageType?: string },
  ) => Promise<void>;
  emitTyping: (draft?: string) => void;
  emitStopTyping: () => void;
  joinRoom: (conversationId: string) => void;
  leaveRoom: (conversationId: string) => void;
  /** Reload messages (socket-first; REST only when socket unavailable). */
  refreshTranscript: () => Promise<void>;
  /** Load transcript for any conversation id (resume on reload, etc.). */
  loadTranscript: (
    targetConversationId: string,
  ) => Promise<
    { ok: true; data: WidgetTranscriptResult } | { ok: false; message: string }
  >;
  /** HYBRID: request human agent (socket-first). */
  requestTalkToAgent: () => Promise<
    { ok: true; data: WidgetTalkToAgentResult } | { ok: false; message: string }
  >;
}

function stableMessageDedupeKey(message: ChatMessage): string {
  if (message.id) return `id:${message.id}`;
  return `${message.conversationId}:${message.role}:${message.createdAt ?? ""}:${message.content}`;
}

export function useVisitorChat(
  options?: UseVisitorChatOptions,
): UseVisitorChatReturn {
  const socketClient = useMemo(() => createChatSocketClient(), []);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [assigned, setAssigned] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [agentTypingFromOther, setAgentTypingFromOther] = useState(false);
  const [botReplying, setBotReplying] = useState(false);
  const [botStreamingText, setBotStreamingText] = useState("");

  const clearBotStream = useCallback(() => {
    setBotReplying(false);
    setBotStreamingText("");
  }, []);
  const messageMapRef = useRef(new Map<string, ChatMessage>());
  const conversationIdRef = useRef<string | null>(null);
  const widgetTokenRef = useRef<string | null | undefined>(
    options?.widgetSessionToken,
  );
  const optionsRef = useRef(options);
  const refreshTranscriptRef = useRef<(() => Promise<void>) | null>(null);
  const reconnectSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectedWidgetTokenRef = useRef<string | null>(null);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    widgetTokenRef.current = options?.widgetSessionToken;
  }, [options?.widgetSessionToken]);

  const reconnectSocket = useCallback(
    async (forceNew: boolean) => {
      const token = widgetTokenRef.current;
      if (!token) {
        setIsConnected(false);
        return;
      }
      socketClient.connect({
        authToken: token,
        forceNew,
      });
      const ready = await socketClient.waitUntilConnected(12_000);
      setIsConnected(ready && socketClient.isConnected());
      const cid = conversationIdRef.current;
      if (cid && socketClient.isConnected()) {
        socketClient.joinRoom({ conversationId: cid });
      }
    },
    [socketClient],
  );

  useEffect(() => {
    const token = options?.widgetSessionToken?.trim();
    if (!token) return undefined;
    const tokenChanged = connectedWidgetTokenRef.current !== token;
    connectedWidgetTokenRef.current = token;
    void reconnectSocket(tokenChanged);
    return undefined;
  }, [options?.widgetSessionToken, reconnectSocket]);

  const resolvePageUrl = useCallback(() => {
    const fromOpt = options?.getCurrentPageUrl?.();
    if (fromOpt) return fromOpt;
    if (typeof window !== "undefined") return window.location.href;
    return "";
  }, [options]);

  const upsertMessage = useCallback((message: ChatMessage) => {
    const openId = conversationIdRef.current;
    if (
      openId &&
      message.conversationId.toLowerCase() !== openId.toLowerCase()
    ) {
      return;
    }

    const key = stableMessageDedupeKey(message);

    if (message.id && !message.id.startsWith("optimistic-")) {
      const toDelete: string[] = [];
      for (const [k, existing] of messageMapRef.current) {
        if (
          existing.id?.startsWith("optimistic-") &&
          existing.role === message.role &&
          existing.content === message.content &&
          existing.conversationId === message.conversationId
        ) {
          toDelete.push(k);
        }
      }
      toDelete.forEach((k) => messageMapRef.current.delete(k));
    }

    messageMapRef.current.set(key, message);
    setMessages(Array.from(messageMapRef.current.values()));
  }, []);

  const loadTranscript = useCallback(
    async (
      targetConversationId: string,
    ): Promise<
      { ok: true; data: WidgetTranscriptResult } | { ok: false; message: string }
    > => {
      const wid = optionsRef.current?.websiteId?.trim();
      if (!wid) return { ok: false, message: "Missing websiteId" };
      const token = widgetTokenRef.current;
      if (token) {
        socketClient.connect({ authToken: token });
        await socketClient.waitUntilSocketReady(12_000);
      }
      return fetchWidgetTranscript(
        targetConversationId,
        wid,
        token ?? undefined,
        socketClient,
      );
    },
    [socketClient],
  );

  const refreshTranscript = useCallback(async () => {
    const cid = conversationIdRef.current;
    const wid = optionsRef.current?.websiteId?.trim();
    if (!cid || !wid) return;
    const res = await loadTranscript(cid);
    if (!res.ok) return;
    messageMapRef.current.clear();
    for (const row of res.data.messages) {
      const normalized = normalizeServerMessage({
        id: row.id,
        conversationId: cid,
        content: row.content,
        senderType: row.senderType,
        messageType: row.messageType,
        attachmentMetadata: row.attachmentMetadata,
        createdAt: row.createdAt,
      });
      if (normalized && !isHiddenFromVisitorWidget(normalized)) {
        messageMapRef.current.set(stableMessageDedupeKey(normalized), normalized);
      }
    }
    setMessages(filterVisitorWidgetMessages(Array.from(messageMapRef.current.values())));
    setAssigned(Boolean(res.data.assignedAgentId) || res.data.status === "assigned");
  }, [loadTranscript]);

  /** Merge new rows without clearing optimistic / socket state. */
  const mergeTranscriptGapFill = useCallback(async () => {
    const cid = conversationIdRef.current;
    const wid = optionsRef.current?.websiteId?.trim();
    if (!cid || !wid) return;
    const res = await loadTranscript(cid);
    if (!res.ok) return;
    let changed = false;
    for (const row of res.data.messages) {
      const normalized = normalizeServerMessage({
        id: row.id,
        conversationId: cid,
        content: row.content,
        senderType: row.senderType,
        messageType: row.messageType,
        attachmentMetadata: row.attachmentMetadata,
        createdAt: row.createdAt,
      });
      if (!normalized || isHiddenFromVisitorWidget(normalized)) continue;
      const key = stableMessageDedupeKey(normalized);
      if (!messageMapRef.current.has(key)) {
        messageMapRef.current.set(key, normalized);
        changed = true;
      }
    }
    if (changed) {
      setMessages(filterVisitorWidgetMessages(Array.from(messageMapRef.current.values())));
    }
    if (res.data.assignedAgentId || res.data.status === "assigned") {
      setAssigned(true);
    }
  }, [loadTranscript]);

  useEffect(() => {
    refreshTranscriptRef.current = mergeTranscriptGapFill;
  }, [mergeTranscriptGapFill]);

  const scheduleReconnectSync = useCallback(() => {
    if (reconnectSyncTimerRef.current) clearTimeout(reconnectSyncTimerRef.current);
    reconnectSyncTimerRef.current = setTimeout(() => {
      reconnectSyncTimerRef.current = null;
      void mergeTranscriptGapFill();
    }, CHAT_RECONNECT_SYNC_DEBOUNCE_MS);
  }, [mergeTranscriptGapFill]);

  const deliverIncomingMessage = useCallback(
    (
      payload: unknown,
      options?: { forcedRole?: ChatMessage["role"]; trustActiveConversation?: boolean },
    ) => {
      const openId = conversationIdRef.current;
      let normalized = normalizeSocketMessage(payload, openId);
      if (!normalized && openId) {
        const payloadCid = conversationIdFromSocketPayload(payload);
        if (
          payloadCid &&
          (options?.trustActiveConversation ||
            payloadCid.toLowerCase() === openId.toLowerCase())
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
      if (isHiddenFromVisitorWidget(normalized)) {
        return;
      }
      if (options?.forcedRole) {
        normalized = { ...normalized, role: options.forcedRole };
      }
      if (
        openId &&
        normalized.conversationId.toLowerCase() !== openId.toLowerCase() &&
        options?.trustActiveConversation
      ) {
        normalized = { ...normalized, conversationId: openId };
      }
      upsertMessage(normalized);
      if (normalized.role === "agent") {
        setAssigned(true);
        optionsRef.current?.onIncomingReply?.(normalized);
      } else if (normalized.role === "ai" || normalized.role === "system") {
        clearBotStream();
        if (optionsRef.current?.getSkipServerAiReply?.() !== true) {
          optionsRef.current?.onIncomingReply?.(normalized);
        }
      }
    },
    [clearBotStream, scheduleReconnectSync, upsertMessage],
  );

  useEffect(() => {
    if (!conversationId) return undefined;
    const hasLocalMessages = messageMapRef.current.size > 0;
    if (!socketClient.isConnected() || !hasLocalMessages) {
      void refreshTranscript();
    }
    const clearJoinRetries = ensureConversationRoomJoin(
      socketClient,
      conversationId,
      () =>
        conversationIdRef.current?.toLowerCase() === conversationId.toLowerCase(),
    );
    if (socketClient.isConnected()) return clearJoinRetries;
    const poll = window.setInterval(() => {
      if (socketClient.isConnected()) return;
      void refreshTranscriptRef.current?.();
    }, CHAT_DISCONNECTED_SYNC_MS);
    return () => {
      clearJoinRetries();
      window.clearInterval(poll);
    };
  }, [conversationId, refreshTranscript, socketClient]);

  useEffect(
    () => () => {
      if (reconnectSyncTimerRef.current) clearTimeout(reconnectSyncTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    let clearJoinRetries: (() => void) | undefined;

    const resyncAfterReconnect = () => {
      setIsConnected(true);
      clearJoinRetries?.();
      clearJoinRetries = undefined;
      const cid = conversationIdRef.current;
      if (cid) {
        clearJoinRetries = ensureConversationRoomJoin(
          socketClient,
          cid,
          () => conversationIdRef.current?.toLowerCase() === cid.toLowerCase(),
        );
      }
      scheduleReconnectSync();
    };

    setIsConnected(socketClient.isConnected());

    const offSocketConnect = socketClient.onSocketConnect(resyncAfterReconnect);
    const offSocketDisconnect = socketClient.onSocketDisconnect(() =>
      setIsConnected(false),
    );
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
    const offSupervisorControl = socketClient.onSupervisorControl((payload) => {
      const cid = conversationIdRef.current;
      if (
        !cid ||
        typeof payload !== "object" ||
        !payload ||
        (payload as { conversationId?: string }).conversationId !== cid
      ) {
        return;
      }
      const released = (payload as { released?: boolean }).released === true;
      if (!released) {
        setAssigned(true);
        optionsRef.current?.onChatAssigned?.();
      }
      optionsRef.current?.onSupervisorControl?.();
    });
    const offAiMessage = socketClient.onAiMessageRaw((payload) => {
      if (optionsRef.current?.getSkipServerAiReply?.() === true) return;
      clearBotStream();
      deliverIncomingMessage(payload, {
        forcedRole: "system",
        trustActiveConversation: true,
      });
    });

    const offAiReplyStart = socketClient.onAiReplyStart((payload) => {
      const cid = conversationIdRef.current;
      if (
        !cid ||
        typeof payload !== "object" ||
        !payload ||
        (payload as { conversationId?: string }).conversationId !== cid
      ) {
        return;
      }
      if (optionsRef.current?.getSkipServerAiReply?.() === true) return;
      setBotReplying(true);
      setBotStreamingText("");
    });

    const offAiReplyDelta = socketClient.onAiReplyDelta((payload) => {
      const cid = conversationIdRef.current;
      if (
        !cid ||
        typeof payload !== "object" ||
        !payload ||
        (payload as { conversationId?: string }).conversationId !== cid
      ) {
        return;
      }
      if (optionsRef.current?.getSkipServerAiReply?.() === true) return;
      const delta = (payload as { delta?: string }).delta;
      if (!delta) return;
      setBotReplying(true);
      setBotStreamingText((prev) => prev + delta);
    });

    const offMonitorLive = socketClient.onMonitorLiveUpdate((update) => {
      const openId = conversationIdRef.current;
      const event = String(update.event ?? "").toLowerCase();
      if (
        openId &&
        update.conversationId?.toLowerCase() === openId.toLowerCase() &&
        (event === "visitor_message" ||
          event === "agent_message" ||
          event === "ai_message")
      ) {
        return;
      }
      if (
        event !== "visitor_message" &&
        event !== "agent_message" &&
        event !== "ai_message" &&
        !event.includes("message")
      ) {
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

    const offHandover = socketClient.onChatHandover((payload: unknown) => {
      const cid = conversationIdRef.current;
      if (
        cid &&
        typeof payload === "object" &&
        payload &&
        (payload as { conversationId?: string }).conversationId === cid
      ) {
        scheduleReconnectSync();
      }
    });

    const offTyping = socketClient.onTyping((payload: TypingPayload) => {
      const cid = conversationIdRef.current;
      if (!cid || payload.conversationId !== cid) return;
      const isRemoteAgent =
        payload.userType === "agent" ||
        payload.typingRole === "agent" ||
        payload.typingRole === "supervisor";
      if (isRemoteAgent) {
        setAgentTypingFromOther(true);
      }
    });
    const offStopTyping = socketClient.onStopTyping((payload: TypingPayload) => {
      const cid = conversationIdRef.current;
      if (!cid || payload.conversationId !== cid) return;
      if (
        payload.userType === "agent" ||
        payload.typingRole === "agent" ||
        payload.typingRole === "supervisor"
      ) {
        setAgentTypingFromOther(false);
        scheduleReconnectSync();
      }
    });

    const offAssigned = socketClient.onChatAssigned((payload: unknown) => {
      const cid = conversationIdRef.current;
      if (
        cid &&
        typeof payload === "object" &&
        payload &&
        (payload as { conversationId?: string }).conversationId === cid
      ) {
        setAssigned(true);
        optionsRef.current?.onChatAssigned?.();
        scheduleReconnectSync();
      }
    });
    const offQueued = socketClient.onChatQueued((payload: unknown) => {
      const cid = conversationIdRef.current;
      if (
        cid &&
        typeof payload === "object" &&
        payload &&
        (payload as { conversationId?: string }).conversationId === cid
      ) {
        optionsRef.current?.onChatQueued?.();
      }
    });
    const offClosed = socketClient.onChatClosed(() => {
      setAssigned(false);
      setAgentTypingFromOther(false);
    });

    return () => {
      clearJoinRetries?.();
      clearJoinRetries = undefined;
      offConnected();
      offSocketConnect();
      offSocketDisconnect();
      offVisitorMessage();
      offAgentMessage();
      offSupervisorControl();
      offAiMessage();
      offAiReplyStart();
      offAiReplyDelta();
      offMonitorLive();
      offHandover();
      offTyping();
      offStopTyping();
      offAssigned();
      offQueued();
      offClosed();
    };
  }, [clearBotStream, deliverIncomingMessage, scheduleReconnectSync, socketClient]);

  const joinRoom = useCallback(
    (roomConversationId: string) => {
      socketClient.joinRoom({ conversationId: roomConversationId });
    },
    [socketClient],
  );

  const leaveRoom = useCallback(
    (roomConversationId: string) => {
      socketClient.leaveRoom({ conversationId: roomConversationId });
    },
    [socketClient],
  );

  const startConversation = useCallback(
    async (
      payload: VisitorCreateConversationPayload,
    ): Promise<VisitorCreateConversationResponse> => {
      const token = widgetTokenRef.current;
      if (token) {
        socketClient.connect({ authToken: token });
        await socketClient.waitUntilSocketReady(
          socketClient.isConnected() ? 3_000 : 12_000,
        );
      }

      let created: VisitorCreateConversationResponse | null = null;

      if (socketClient.isConnected()) {
        try {
          const ack = await socketClient.startConversationWithAck(payload, 20_000);
          const body = unwrapSocketAckPayload(ack);
          if (
            body &&
            typeof body === "object" &&
            "conversationId" in body &&
            typeof (body as { conversationId?: unknown }).conversationId === "string"
          ) {
            created = body as VisitorCreateConversationResponse;
          }
        } catch {
          /* REST fallback below */
        }
      }

      if (!created) {
        created = await createWidgetConversation(
          payload,
          widgetTokenRef.current ?? undefined,
        );
      }
      setConversationId(created.conversationId);
      conversationIdRef.current = created.conversationId;
      setVisitorId(created.visitorId ?? null);
      setAssigned(created.status === "assigned");
      if (created.firstVisitorMessage) {
        const visitorRow = normalizeServerMessage({
          ...created.firstVisitorMessage,
          conversationId: created.conversationId,
          senderType: created.firstVisitorMessage.senderType ?? "visitor",
        });
        if (visitorRow && !isHiddenFromVisitorWidget(visitorRow)) {
          upsertMessage(visitorRow);
        }
      }
      const skipAi = optionsRef.current?.getSkipServerAiReply?.() === true;
      if (!skipAi && created.aiMessage?.content?.trim()) {
        const aiRow = normalizeServerMessage({
          ...created.aiMessage,
          conversationId: created.conversationId,
          senderType: created.aiMessage.senderType ?? "ai",
        });
        if (aiRow && !isHiddenFromVisitorWidget(aiRow)) {
          upsertMessage(aiRow);
        }
      }
      ensureConversationRoomJoin(
        socketClient,
        created.conversationId,
        () =>
          conversationIdRef.current?.toLowerCase() ===
          created.conversationId.toLowerCase(),
      );
      return created;
    },
    [socketClient, upsertMessage],
  );

  const resumeConversation = useCallback(
    (params: {
      conversationId: string;
      visitorId?: string | null;
      status?: string;
      messages: WidgetTranscriptMessage[];
    }) => {
      const token = widgetTokenRef.current;
      if (token) {
        socketClient.connect({ authToken: token });
        void socketClient.waitUntilConnected(12_000).then(() => {
          setIsConnected(socketClient.isConnected());
        });
      }
      messageMapRef.current.clear();
      for (const row of params.messages) {
        const normalized = normalizeServerMessage({
          id: row.id,
          conversationId: params.conversationId,
          content: row.content,
          senderType: row.senderType,
          messageType: row.messageType,
          attachmentMetadata: row.attachmentMetadata,
          createdAt: row.createdAt,
        });
        if (normalized && !isHiddenFromVisitorWidget(normalized)) {
          messageMapRef.current.set(stableMessageDedupeKey(normalized), normalized);
        }
      }
      setMessages(filterVisitorWidgetMessages(Array.from(messageMapRef.current.values())));
      setConversationId(params.conversationId);
      conversationIdRef.current = params.conversationId;
      setVisitorId(params.visitorId ?? null);
      setAssigned(params.status === "assigned");
      ensureConversationRoomJoin(
        socketClient,
        params.conversationId,
        () =>
          conversationIdRef.current?.toLowerCase() ===
          params.conversationId.toLowerCase(),
      );
    },
    [socketClient],
  );

  const applyVisitorSendAck = useCallback(
    (raw: unknown, optimisticKey: string) => {
      messageMapRef.current.delete(optimisticKey);
      const body = unwrapSocketAckPayload(raw);
      if (!body || typeof body !== "object") {
        setMessages(filterVisitorWidgetMessages(Array.from(messageMapRef.current.values())));
        return;
      }
      const envelope = body as {
        visitorMessage?: Record<string, unknown>;
        aiMessage?: {
          id?: string;
          content?: string;
          createdAt?: string;
          senderType?: string;
        };
      };
      const visitorRow = envelope.visitorMessage;
      if (visitorRow) {
        const normalized = normalizeServerMessage({
          ...visitorRow,
          conversationId,
        });
        if (normalized) upsertMessage(normalized);
      } else {
        setMessages(filterVisitorWidgetMessages(Array.from(messageMapRef.current.values())));
      }
      const skipAi = optionsRef.current?.getSkipServerAiReply?.() === true;
      const aiRow = envelope.aiMessage;
      clearBotStream();
      if (!skipAi && aiRow?.content?.trim()) {
        const normalized = normalizeServerMessage({
          ...aiRow,
          conversationId,
          senderType: aiRow.senderType ?? "ai",
        });
        if (normalized) upsertMessage(normalized);
      }
    },
    [clearBotStream, conversationId, upsertMessage],
  );

  const sendMessage = useCallback(
    async (content: string, sendOpts?: { messageType?: string }) => {
      if (!conversationId) {
        throw new Error("Conversation not started. Call startConversation first.");
      }

      const skipAi = optionsRef.current?.getSkipServerAiReply?.() === true;
      if (!skipAi) {
        setBotReplying(true);
        setBotStreamingText("");
      }

      const pageUrl = resolvePageUrl();
      const optimisticMessage: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        conversationId,
        content,
        role: "visitor",
        createdAt: new Date().toISOString(),
      };
      const optimisticKey = stableMessageDedupeKey(optimisticMessage);

      upsertMessage(optimisticMessage);

      const socketPayload = {
        conversationId,
        message: content,
        currentPageUrl: pageUrl,
        ...(sendOpts?.messageType ? { messageType: sendOpts.messageType } : {}),
      };

      await socketClient.waitUntilConnected(
        socketClient.isConnected() ? 2_000 : 10_000,
      );

      if (socketClient.isConnected()) {
        try {
          const ack = await socketClient.sendVisitorMessageWithAck(
            socketPayload,
            15_000,
          );
          applyVisitorSendAck(ack, optimisticKey);
          return;
        } catch {
          /* socket ack failed — REST fallback below */
        }
      }

      const raw = await sendWidgetVisitorMessage(
        conversationId,
        {
          message: content,
          currentPageUrl: pageUrl,
          ...(sendOpts?.messageType ? { messageType: sendOpts.messageType } : {}),
        },
        widgetTokenRef.current ?? undefined,
        optionsRef.current?.websiteId?.trim() ?? undefined,
      );
      applyVisitorSendAck(raw, optimisticKey);
    },
    [
      applyVisitorSendAck,
      conversationId,
      resolvePageUrl,
      socketClient,
      upsertMessage,
    ],
  );

  const emitTyping = useCallback(
    (draft?: string) => {
      if (!conversationId) return;
      socketClient.emitTyping({
        conversationId,
        userType: "visitor",
        ...(draft !== undefined ? { draft } : {}),
      });
    },
    [conversationId, socketClient],
  );

  const emitStopTyping = useCallback(() => {
    if (!conversationId) return;
    socketClient.emitStopTyping({ conversationId, userType: "visitor" });
  }, [conversationId, socketClient]);

  const requestTalkToAgent = useCallback(async () => {
    const cid = conversationIdRef.current;
    const wid = optionsRef.current?.websiteId?.trim();
    if (!cid || !wid) {
      return { ok: false as const, message: "Conversation not started." };
    }
    const token = widgetTokenRef.current;
    if (token) {
      socketClient.connect({ authToken: token });
    }
    return postWidgetTalkToAgent(cid, wid, token ?? undefined, socketClient);
  }, [socketClient]);

  return {
    conversationId,
    visitorId,
    assigned,
    messages,
    isConnected,
    agentTypingSeen: agentTypingFromOther,
    botReplying,
    botStreamingText,
    startConversation,
    resumeConversation,
    sendMessage,
    emitTyping,
    emitStopTyping,
    joinRoom,
    leaveRoom,
    refreshTranscript,
    loadTranscript,
    requestTalkToAgent,
  };
}
