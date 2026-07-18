import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  closeConversation,
  getAgentConversationHistorySocket,
  markConversationSpam,
  sendAgentMessage,
} from "@/services/chat/agent-inbox.api";
import { sendSupervisorControlMessage } from "@/services/chat/supervisor.api";
import { fetchAgentWrapUp } from "@/services/chat/wrap-up.api";
import { getSharedAgentChatSocket } from "@/services/chat/sharedAgentChatSocket";
import type { ChatWhisperSocketPayload } from "@/services/chat/supervisor.types";
import type { AgentWrapUpPayload } from "@/services/chat/wrap-up.types";
import type { ChatMessage, ConversationSummary } from "@/services/chat/chat.types";
import { mergeVisitorPanelContext } from "@/features/chat-operations/utils/visitor-info";
import { conversationIdFromSocketPayload, sortMessagesChronologically, stableMessageDedupeKey } from "./agent-chat.utils";
import { CHAT_RECONNECT_SYNC_DEBOUNCE_MS, ensureConversationRoomJoin } from "./chat-socket-delivery";
import { publishAgentInboxDelta, subscribeAgentInboxDelta } from "./agent-inbox-delta-bus";
import { clearVisitorTyping } from "./conversation-typing-bus";
import { useConversationTypingEntries } from "./useConversationTyping";
import type { ConversationTypingEntry } from "./conversation-typing-bus";
import { useAgentInboxQueues } from "./useAgentInboxQueues";
import { useAgentChatSocket } from "./useAgentChatSocket";

interface UseAgentChatParams {
  token: string;
  agentId?: string;
  /** False when user lacks `page:chat-inbox` + chat bundle — no agent APIs or socket. */
  apiEnabled?: boolean;
}

export interface UseAgentChatReturn {
  activeChats: ConversationSummary[];
  waitingChats: ConversationSummary[];
  closedChats: ConversationSummary[];
  selectedConversationId: string | null;
  selectedWebsiteId: string | null;
  selectedIsClosed: boolean;
  atActiveCap: boolean;
  messages: ChatMessage[];
  visitorFromHistory: Record<string, unknown> | null;
  isConnected: boolean;
  visitorTypingSelected: boolean;
  visitorTypingDraft: string;
  remoteTypingEntries: ConversationTypingEntry[];
  refreshQueues: () => Promise<void>;
  selectConversation: (conversationId: string, options?: { readOnly?: boolean; assigneeAgentId?: string | null }) => Promise<void>;
  clearSelection: () => void;
  sendMessage: (content: string, options?: { messageType?: string }) => Promise<void>;
  closeSelectedConversation: () => Promise<void>;
  markSpamSelectedConversation: (input: { spamCategory: string; notes?: string }) => Promise<void>;
  emitTyping: (draft?: string) => void;
  emitStopTyping: () => void;
  pendingWrapUp: AgentWrapUpPayload | null;
  dismissWrapUp: () => void;
  activeWhisper: ChatWhisperSocketPayload | null;
  dismissWhisper: () => void;
  onSupervisorActivity: (payload?: unknown) => void;
  supervisorRefreshToken: number;
  canSendMessage: boolean;
  sendBlockedReason: string | null;
  applyVisitorProfileUpdate: (payload: unknown) => void;
}

export function useAgentChat(params: UseAgentChatParams): UseAgentChatReturn {
  const permissionEnabled = params.apiEnabled !== false;
  const token = params.token?.trim() ?? "";
  const apiEnabled = permissionEnabled && Boolean(token);
  const socketClient = useMemo(() => getSharedAgentChatSocket(), []);
  const queues = useAgentInboxQueues(token, permissionEnabled, params.agentId, {
    respectChatSession: permissionEnabled,
  });

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(null);
  const [selectedIsClosed, setSelectedIsClosed] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [visitorFromHistory, setVisitorFromHistory] = useState<Record<string, unknown> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingWrapUp, setPendingWrapUp] = useState<AgentWrapUpPayload | null>(null);
  const [activeWhisper, setActiveWhisper] = useState<ChatWhisperSocketPayload | null>(null);
  const [supervisorTick, setSupervisorTick] = useState(0);
  const [conversationAssigneeId, setConversationAssigneeId] = useState<string | null>(null);

  const messageMapRef = useRef(new Map<string, ChatMessage>());
  const selectedConversationIdRef = useRef<string | null>(null);
  const selectedIsClosedRef = useRef(false);
  const roomJoinCleanupRef = useRef<(() => void) | undefined>(undefined);

  const closedIdSet = useMemo(() => new Set(queues.closedChats.map((c) => c.id)), [queues.closedChats]);

  const sendBlockedReason = useMemo((): string | null => {
    if (!selectedConversationId || selectedIsClosed || !params.agentId) return null;
    const me = params.agentId;
    const queueRow = [...queues.activeChats, ...queues.waitingChats].find((c) => c.id === selectedConversationId);
    const awaitingHumanAgent =
      queues.waitingChats.some((c) => c.id === selectedConversationId) ||
      queueRow?.talkToAgentRequested === true ||
      queueRow?.handoverRequested === true ||
      queueRow?.queuedForAgent === true ||
      String(queueRow?.status ?? "") === "waiting";
    if (!conversationAssigneeId || conversationAssigneeId !== me) {
      if (awaitingHumanAgent) return null;
      return "You are not the assigned agent for this conversation.";
    }
    return null;
  }, [conversationAssigneeId, params.agentId, queues.activeChats, queues.waitingChats, selectedConversationId, selectedIsClosed]);

  const remoteTypingEntries = useConversationTypingEntries(selectedConversationId, {
    excludeUserId: params.agentId,
  });
  const visitorTypingEntry = remoteTypingEntries.find((e) => e.kind === "visitor");
  const visitorTypingSelected = Boolean(visitorTypingEntry?.draft.trim());
  const visitorTypingDraft = visitorTypingEntry?.draft.trim() ?? "";

  const canSendMessage = sendBlockedReason === null && Boolean(selectedConversationId && !selectedIsClosed && params.agentId);

  useEffect(() => {
    selectedIsClosedRef.current = selectedIsClosed;
  }, [selectedIsClosed]);

  const syncMessagesFromMap = useCallback(() => {
    setMessages(sortMessagesChronologically(Array.from(messageMapRef.current.values())));
  }, []);

  const reloadConversationHistory = useCallback(
    async (conversationId: string) => {
      if (!apiEnabled) return;
      const history = await getAgentConversationHistorySocket(conversationId).catch(() => null);
      if (!history) return;
      messageMapRef.current.clear();
      for (const msg of history.messages) {
        messageMapRef.current.set(stableMessageDedupeKey(msg), msg);
      }
      syncMessagesFromMap();
      const v = history.visitor;
      setVisitorFromHistory(
        mergeVisitorPanelContext(typeof v === "object" && v !== null ? (v as Record<string, unknown>) : null, history as unknown as Record<string, unknown>),
      );
    },
    [apiEnabled, syncMessagesFromMap],
  );

  const selectConversation = useCallback(
    async (conversationId: string, options?: { readOnly?: boolean; assigneeAgentId?: string | null }) => {
      const cid = conversationId.trim();
      if (!cid) return;
      selectedConversationIdRef.current = cid;
      setSelectedConversationId(cid);
      setPendingWrapUp(null);
      setActiveWhisper(null);
      messageMapRef.current.clear();
      setMessages([]);
      setVisitorFromHistory(null);
      setConversationAssigneeId(options?.assigneeAgentId ?? params.agentId ?? null);

      const isClosed = closedIdSet.has(cid);
      setSelectedIsClosed(isClosed);
      selectedIsClosedRef.current = isClosed;

      const row = [...queues.activeChats, ...queues.waitingChats, ...queues.closedChats].find((c) => c.id === cid);
      setSelectedWebsiteId(row?.websiteId ?? null);

      roomJoinCleanupRef.current?.();
      roomJoinCleanupRef.current = ensureConversationRoomJoin(
        socketClient,
        cid,
        () => selectedConversationIdRef.current?.toLowerCase() === cid.toLowerCase(),
      );

      await reloadConversationHistory(cid);
    },
    [closedIdSet, params.agentId, queues.activeChats, queues.closedChats, queues.waitingChats, reloadConversationHistory, socketClient],
  );

  const clearSelection = useCallback(() => {
    if (selectedConversationId) clearVisitorTyping(selectedConversationId);
    roomJoinCleanupRef.current?.();
    roomJoinCleanupRef.current = undefined;
    selectedConversationIdRef.current = null;
    setSelectedConversationId(null);
    setSelectedWebsiteId(null);
    setSelectedIsClosed(false);
    setMessages([]);
    setVisitorFromHistory(null);
    setPendingWrapUp(null);
    setActiveWhisper(null);
    messageMapRef.current.clear();
  }, [selectedConversationId]);

  const sendMessage = useCallback(
    async (content: string, options?: { messageType?: string }) => {
      const text = content.trim();
      const cid = selectedConversationIdRef.current;
      if (!text || !cid || !apiEnabled || !canSendMessage) return;
      const optimistic: ChatMessage = {
        id: `local-${Date.now()}`,
        conversationId: cid,
        content: text,
        role: "agent",
        senderId: params.agentId,
        createdAt: new Date().toISOString(),
        metadata: options?.messageType ? { messageType: options.messageType } : undefined,
      };
      messageMapRef.current.set(stableMessageDedupeKey(optimistic), optimistic);
      syncMessagesFromMap();
      try {
        await sendAgentMessage(cid, { message: text, ...(options?.messageType ? { messageType: options.messageType } : {}) }, token);
      } catch {
        messageMapRef.current.delete(stableMessageDedupeKey(optimistic));
        syncMessagesFromMap();
        throw new Error("Could not send message.");
      }
    },
    [apiEnabled, canSendMessage, params.agentId, syncMessagesFromMap, token],
  );

  const closeSelectedConversation = useCallback(async () => {
    const cid = selectedConversationIdRef.current;
    if (!cid || !apiEnabled) return;
    await closeConversation(cid, token);
    setSelectedIsClosed(true);
    selectedIsClosedRef.current = true;
    publishAgentInboxDelta({ kind: "conversation_closed", conversationId: cid });
    await queues.refreshQueues();
  }, [apiEnabled, queues, token]);

  const markSpamSelectedConversation = useCallback(
    async (input: { spamCategory: string; notes?: string }) => {
      const cid = selectedConversationIdRef.current;
      if (!cid || !apiEnabled) return;
      await markConversationSpam(cid, input, token);
      setSelectedIsClosed(true);
      selectedIsClosedRef.current = true;
      publishAgentInboxDelta({ kind: "conversation_closed", conversationId: cid });
      await queues.refreshQueues();
    },
    [apiEnabled, queues, token],
  );

  const emitTyping = useCallback(
    (draft?: string) => {
      const cid = selectedConversationIdRef.current;
      if (!cid || !apiEnabled) return;
      socketClient.emitTyping({ conversationId: cid, userType: "agent", userId: params.agentId, draft });
    },
    [apiEnabled, params.agentId, socketClient],
  );

  const emitStopTyping = useCallback(() => {
    const cid = selectedConversationIdRef.current;
    if (!cid || !apiEnabled) return;
    socketClient.emitStopTyping({ conversationId: cid, userType: "agent", userId: params.agentId });
  }, [apiEnabled, params.agentId, socketClient]);

  const dismissWrapUp = useCallback(() => setPendingWrapUp(null), []);
  const dismissWhisper = useCallback(() => setActiveWhisper(null), []);

  const onSupervisorActivity = useCallback(
    (payload?: unknown) => {
      setSupervisorTick((n) => n + 1);
      if (payload && typeof payload === "object") {
        void sendSupervisorControlMessage;
      }
    },
    [],
  );

  const applyVisitorProfileUpdate = useCallback((payload: unknown) => {
    if (!payload || typeof payload !== "object") return;
    const o = payload as Record<string, unknown>;
    const visitor = (o.visitor ?? o.profile ?? o) as Record<string, unknown>;
    setVisitorFromHistory((prev) => mergeVisitorPanelContext({ ...(prev ?? {}), ...visitor }));
  }, []);

  const extractWrapUp = useCallback((payload: unknown): AgentWrapUpPayload | null => {
    if (typeof payload !== "object" || !payload) return null;
    const o = payload as Record<string, unknown>;
    if (o.wrapUp && typeof o.wrapUp === "object") return o.wrapUp as AgentWrapUpPayload;
    if (o.conversationId && (o.requiresDistributionForm || o.requiresDistributionSetup || o.chatCompleted)) {
      return o as AgentWrapUpPayload;
    }
    return null;
  }, []);

  useAgentChatSocket(
    token,
    socketClient,
    params.agentId,
    {
      onVisitorMessage: (message) => {
        const cid = selectedConversationIdRef.current;
        if (!cid || message.conversationId?.toLowerCase() !== cid.toLowerCase()) return;
        messageMapRef.current.set(stableMessageDedupeKey(message), message);
        syncMessagesFromMap();
        if (message.role === "visitor") clearVisitorTyping(cid);
      },
      onRefreshQueues: () => {
        void queues.refreshQueues();
      },
      onReconnectHistorySync: () => {
        const cid = selectedConversationIdRef.current;
        if (cid) void reloadConversationHistory(cid);
      },
      onSessionEnded: (payload) => {
        const cid = conversationIdFromSocketPayload(payload);
        if (cid && cid === selectedConversationIdRef.current) {
          setSelectedIsClosed(true);
          selectedIsClosedRef.current = true;
        }
      },
      onChatResumed: (payload) => {
        const cid = conversationIdFromSocketPayload(payload);
        if (cid && cid === selectedConversationIdRef.current) {
          setSelectedIsClosed(false);
          selectedIsClosedRef.current = false;
        }
      },
      onVisitorTyping: () => {
        /* handled via conversation-typing-bus + useConversationTypingEntries */
      },
      onVisitorProfileUpdated: (payload) => applyVisitorProfileUpdate(payload),
      onChatWhisper: (payload) => {
        const cid = conversationIdFromSocketPayload(payload);
        if (cid && cid === selectedConversationIdRef.current) {
          setActiveWhisper(payload as ChatWhisperSocketPayload);
        }
      },
      onAgentWrapUpForm: (payload) => {
        const wrapUp = extractWrapUp(payload);
        const cid = wrapUp?.conversationId;
        if (wrapUp && cid && cid === selectedConversationIdRef.current) {
          setPendingWrapUp(wrapUp);
        }
      },
      onSupervisorControl: () => onSupervisorActivity(),
      onTakeoverRequested: () => onSupervisorActivity(),
      onTakeoverUpdate: () => onSupervisorActivity(),
      selectedConversationIdRef,
      selectedIsClosedRef,
    },
    setIsConnected,
    { publishInboxDeltas: true },
  );

  useEffect(() => {
    if (!permissionEnabled) return undefined;
    return subscribeAgentInboxDelta((patch) => {
      if (patch.kind === "assigned_to_agent" && patch.summary.id === selectedConversationIdRef.current) {
        setConversationAssigneeId(patch.summary.assignedAgentId ?? params.agentId ?? null);
      }
    });
  }, [params.agentId, permissionEnabled]);

  useEffect(() => {
    if (!apiEnabled || !selectedConversationId || selectedIsClosed) return;
    void fetchAgentWrapUp(selectedConversationId).catch(() => null);
  }, [apiEnabled, selectedConversationId, selectedIsClosed]);

  useEffect(() => () => roomJoinCleanupRef.current?.(), []);

  return {
    activeChats: queues.activeChats,
    waitingChats: queues.waitingChats,
    closedChats: queues.closedChats,
    selectedConversationId,
    selectedWebsiteId,
    selectedIsClosed,
    atActiveCap: queues.atActiveCap,
    messages,
    visitorFromHistory,
    isConnected,
    visitorTypingSelected,
    visitorTypingDraft,
    remoteTypingEntries,
    refreshQueues: queues.refreshQueues,
    selectConversation,
    clearSelection,
    sendMessage,
    closeSelectedConversation,
    markSpamSelectedConversation,
    emitTyping,
    emitStopTyping,
    pendingWrapUp,
    dismissWrapUp,
    activeWhisper,
    dismissWhisper,
    onSupervisorActivity,
    supervisorRefreshToken: supervisorTick,
    canSendMessage,
    sendBlockedReason,
    applyVisitorProfileUpdate,
  };
}

export { CHAT_RECONNECT_SYNC_DEBOUNCE_MS };
