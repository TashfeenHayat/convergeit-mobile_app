import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mergeVisitorPanelContext } from "@/features/chat-operations/utils/visitor-info";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/api";
import {
  conversationIdFromSocketPayload,
  sortMessagesChronologically,
  stableMessageDedupeKey,
} from "@/lib/hooks/chat/agent-chat.utils";
import {
  applyMonitorListPatch,
  buildMonitorPatchFromSocket,
} from "@/lib/hooks/chat/monitor-list-patch";
import { useAgentChatSocket } from "@/lib/hooks/chat/useAgentChatSocket";
import { getConversationHistory } from "@/services/chat/agent-inbox.api";
import {
  fetchMonitorCapabilities,
  fetchMonitorClosed,
  fetchMonitorLive,
} from "@/services/chat/monitor.api";
import type { ChatMessage } from "@/services/chat/chat.types";
import type { MonitorLiveUpdatePayload } from "@/services/chat/chatSocket";
import type {
  MonitorConversationRow,
  MonitorListFilters,
  MonitorListTab,
} from "@/services/chat/monitor.types";
import { getSharedAgentChatSocket } from "@/services/chat/sharedAgentChatSocket";
import { chatMonitorKeys } from "./keys";

const RECONNECT_TRANSCRIPT_DEBOUNCE_MS = 500;

export function useChatMonitor(
  initialConversationId?: string | null,
  options?: { apiEnabled?: boolean },
) {
  const apiEnabled = options?.apiEnabled !== false;
  const token = apiEnabled ? getAccessToken() ?? "" : "";
  const queryClient = useQueryClient();
  const socketClient = useMemo(() => getSharedAgentChatSocket(), []);

  const [listTab, setListTab] = useState<MonitorListTab>("live");
  const [filters, setFilters] = useState<MonitorListFilters>({});
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    initialConversationId ?? null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [visitorFromHistory, setVisitorFromHistory] =
    useState<Record<string, unknown> | null>(null);
  const [supervisorControlUserId, setSupervisorControlUserId] = useState<string | null>(
    null,
  );
  const [isConnected, setIsConnected] = useState(false);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [visitorTyping, setVisitorTyping] = useState(false);

  const messageMapRef = useRef(new Map<string, ChatMessage>());
  const selectedIdRef = useRef<string | null>(null);
  const selectedIsClosedRef = useRef(false);
  const filtersRef = useRef(filters);
  const reconnectSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    selectedIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    selectedIsClosedRef.current = listTab === "closed";
  }, [listTab]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const capabilitiesQuery = useQuery({
    queryKey: chatMonitorKeys.capabilities(),
    queryFn: fetchMonitorCapabilities,
    enabled: apiEnabled && Boolean(token),
  });

  const capabilitiesReady =
    apiEnabled && Boolean(token) && capabilitiesQuery.isSuccess && !capabilitiesQuery.isError;

  const liveQuery = useQuery({
    queryKey: chatMonitorKeys.live(filters),
    queryFn: () => fetchMonitorLive(filters),
    enabled: capabilitiesReady,
    staleTime: 60_000,
  });

  const closedQuery = useQuery({
    queryKey: chatMonitorKeys.closed(filters),
    queryFn: () => fetchMonitorClosed(filters),
    enabled: capabilitiesReady,
    staleTime: 60_000,
  });

  const liveList = liveQuery.data ?? [];
  const closedList = closedQuery.data ?? [];
  const list = listTab === "live" ? liveList : closedList;

  const patchMonitorLists = useCallback(
    (event: string, payload: unknown, conversationIdHint?: string) => {
      const patch = buildMonitorPatchFromSocket(event, payload, conversationIdHint);
      if (!patch) return;

      const activeFilters = filtersRef.current;
      queryClient.setQueryData<MonitorConversationRow[]>(
        chatMonitorKeys.live(activeFilters),
        (prev) => {
          const live = prev ?? [];
          const closed =
            queryClient.getQueryData<MonitorConversationRow[]>(
              chatMonitorKeys.closed(activeFilters),
            ) ?? [];
          const next = applyMonitorListPatch(live, closed, patch);
          queryClient.setQueryData(chatMonitorKeys.closed(activeFilters), next.closed);
          return next.live;
        },
      );
    },
    [queryClient],
  );

  const invalidateLists = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: chatMonitorKeys.all });
  }, [queryClient]);

  const syncMessagesFromMap = useCallback(() => {
    setMessages(sortMessagesChronologically(Array.from(messageMapRef.current.values())));
  }, []);

  const loadTranscript = useCallback(
    async (conversationId: string, opts?: { silent?: boolean }) => {
      if (!apiEnabled || !token) return;
      if (!opts?.silent) {
        setTranscriptLoading(true);
        setTranscriptError(null);
      }
      try {
        const history = await getConversationHistory(conversationId, token);
        messageMapRef.current.clear();
        for (const msg of history.messages) {
          messageMapRef.current.set(stableMessageDedupeKey(msg), msg);
        }
        syncMessagesFromMap();
        const v = history.visitor;
        setVisitorFromHistory(
          mergeVisitorPanelContext(
            typeof v === "object" && v !== null ? (v as Record<string, unknown>) : null,
            history as Record<string, unknown>,
          ),
        );
        const sc = (history as { supervisorControlUserId?: string | null })
          .supervisorControlUserId;
        setSupervisorControlUserId(sc ?? null);
      } catch (err: unknown) {
        if (!opts?.silent) {
          const msg =
            err && typeof err === "object" && "message" in err
              ? String((err as { message: unknown }).message)
              : "Could not load transcript.";
          setTranscriptError(msg);
          messageMapRef.current.clear();
          syncMessagesFromMap();
          setVisitorFromHistory(null);
        }
      } finally {
        if (!opts?.silent) setTranscriptLoading(false);
      }
    },
    [apiEnabled, syncMessagesFromMap, token],
  );

  const scheduleReconnectTranscriptSync = useCallback(() => {
    if (reconnectSyncTimerRef.current) clearTimeout(reconnectSyncTimerRef.current);
    reconnectSyncTimerRef.current = setTimeout(() => {
      reconnectSyncTimerRef.current = null;
      const cid = selectedIdRef.current;
      if (cid) {
        void loadTranscript(cid, { silent: true });
      }
    }, RECONNECT_TRANSCRIPT_DEBOUNCE_MS);
  }, [loadTranscript]);

  const handleListSocketEvent = useCallback(
    (event: string, payload: unknown, conversationIdHint?: string) => {
      patchMonitorLists(event, payload, conversationIdHint);
    },
    [patchMonitorLists],
  );

  const handleMonitorLiveUpdate = useCallback(
    (update: MonitorLiveUpdatePayload) => {
      const ev = String(update.event ?? "").toLowerCase();
      if (ev === "chat_offline") {
        invalidateLists();
      }
      handleListSocketEvent(
        String(update.event ?? ""),
        update.payload,
        update.conversationId,
      );
    },
    [handleListSocketEvent, invalidateLists],
  );

  const upsertMessage = useCallback(
    (message: ChatMessage) => {
      if (selectedIsClosedRef.current && message.role !== "system") return;

      messageMapRef.current.set(stableMessageDedupeKey(message), message);
      syncMessagesFromMap();
      if (message.content?.trim()) {
        const event =
          message.role === "visitor"
            ? "visitor_message"
            : message.role === "system"
              ? "ai_message"
              : "agent_message";
        patchMonitorLists(event, message, message.conversationId);
      }
    },
    [patchMonitorLists, syncMessagesFromMap],
  );

  const selectConversation = useCallback(
    async (conversationId: string) => {
      const prev = selectedIdRef.current;
      if (prev && prev !== conversationId) {
        socketClient.leaveRoom({ conversationId: prev });
      }

      const closedRows =
        queryClient.getQueryData<MonitorConversationRow[]>(
          chatMonitorKeys.closed(filtersRef.current),
        ) ?? [];
      const liveRows =
        queryClient.getQueryData<MonitorConversationRow[]>(
          chatMonitorKeys.live(filtersRef.current),
        ) ?? [];
      const inClosed = closedRows.some((r) => r.id === conversationId);
      const inLive = liveRows.some((r) => r.id === conversationId);
      if (inClosed && !inLive) {
        setListTab("closed");
      } else if (inLive && !inClosed) {
        setListTab("live");
      }

      setSelectedConversationId(conversationId);
      selectedIdRef.current = conversationId;
      socketClient.joinRoom({ conversationId });
      await loadTranscript(conversationId);
    },
    [loadTranscript, queryClient, socketClient],
  );

  const updateSupervisorControl = useCallback((userId: string | null) => {
    setSupervisorControlUserId(userId);
  }, []);

  const refreshSelectedTranscript = useCallback(
    (opts?: { silent?: boolean }) => {
      const cid = selectedIdRef.current;
      if (cid) void loadTranscript(cid, opts);
    },
    [loadTranscript],
  );

  const clearSelection = useCallback(() => {
    const prev = selectedIdRef.current;
    if (prev) socketClient.leaveRoom({ conversationId: prev });
    setSelectedConversationId(null);
    selectedIdRef.current = null;
    messageMapRef.current.clear();
    setMessages([]);
    setVisitorFromHistory(null);
    setSupervisorControlUserId(null);
    setTranscriptError(null);
    setVisitorTyping(false);
  }, [socketClient]);

  const prevListTabRef = useRef(listTab);
  useEffect(() => {
    if (prevListTabRef.current === listTab) return;
    prevListTabRef.current = listTab;
    const cid = selectedIdRef.current;
    if (listTab === "closed" && cid) {
      void loadTranscript(cid, { silent: true });
    }
  }, [listTab, loadTranscript]);

  const initialTabSyncedRef = useRef(false);
  useEffect(() => {
    if (!initialConversationId || closedQuery.isLoading || initialTabSyncedRef.current) {
      return;
    }
    const inClosed = closedList.some((r) => r.id === initialConversationId);
    const inLive = liveList.some((r) => r.id === initialConversationId);
    if (inClosed && !inLive) {
      setListTab("closed");
    }
    initialTabSyncedRef.current = true;
  }, [closedList, closedQuery.isLoading, initialConversationId, liveList]);

  const initialAppliedRef = useRef(false);
  useEffect(() => {
    if (!apiEnabled || !initialConversationId || !token || initialAppliedRef.current) return;
    initialAppliedRef.current = true;
    void selectConversation(initialConversationId);
  }, [apiEnabled, initialConversationId, selectConversation, token]);

  const handleListSocketEventRef = useRef(handleListSocketEvent);
  handleListSocketEventRef.current = handleListSocketEvent;
  const handleMonitorLiveUpdateRef = useRef(handleMonitorLiveUpdate);
  handleMonitorLiveUpdateRef.current = handleMonitorLiveUpdate;
  const scheduleReconnectTranscriptSyncRef = useRef(scheduleReconnectTranscriptSync);
  scheduleReconnectTranscriptSyncRef.current = scheduleReconnectTranscriptSync;

  useAgentChatSocket(
    apiEnabled ? token : "",
    socketClient,
    undefined,
    {
      onVisitorMessage: upsertMessage,
      onRefreshQueues: () => {},
      onReconnectHistorySync: () => scheduleReconnectTranscriptSyncRef.current(),
      onInboxSocketEvent: (event, payload) =>
        handleListSocketEventRef.current(event, payload),
      onMonitorLiveUpdate: (update) => handleMonitorLiveUpdateRef.current(update),
      onSessionEnded: (payload) => {
        handleListSocketEventRef.current("chat_closed", payload);
        const endedId = conversationIdFromSocketPayload(payload);
        if (endedId && endedId === selectedIdRef.current) {
          setSupervisorControlUserId(null);
        }
      },
      onChatResumed: (payload) =>
        handleListSocketEventRef.current("chat_resumed", payload),
      onVisitorTyping: (typing) => setVisitorTyping(typing),
      onSupervisorControl: (payload) => {
        const cid = conversationIdFromSocketPayload(payload);
        if (cid && cid === selectedIdRef.current && payload && typeof payload === "object") {
          const sc = (payload as { supervisorControlUserId?: string | null })
            .supervisorControlUserId;
          if (sc !== undefined) setSupervisorControlUserId(sc);
        }
        handleListSocketEventRef.current("chat_supervisor_control", payload, cid ?? undefined);
      },
      selectedConversationIdRef: selectedIdRef,
      selectedIsClosedRef,
    },
    setIsConnected,
    { publishInboxDeltas: false },
  );

  useEffect(
    () => () => {
      if (reconnectSyncTimerRef.current) clearTimeout(reconnectSyncTimerRef.current);
    },
    [],
  );

  const filterOptions = useMemo(() => {
    const rows = [...(liveQuery.data ?? []), ...(closedQuery.data ?? [])];
    const websites = new Map<string, string>();
    const departments = new Map<string, string>();
    const pools = new Map<string, string>();
    const statuses = new Set<string>();

    for (const row of rows) {
      statuses.add(row.status);
      if (row.websiteId) {
        websites.set(
          row.websiteId,
          row.visitorPresentation?.websiteName || row.websiteId.slice(0, 8),
        );
      }
      if (row.departmentId && row.department?.name) {
        departments.set(row.departmentId, row.department.name);
      }
      if (row.poolId && row.pool?.name) {
        pools.set(row.poolId, row.pool.name);
      }
    }

    return {
      websites: [...websites.entries()].map(([id, label]) => ({ id, label })),
      departments: [...departments.entries()].map(([id, label]) => ({ id, label })),
      pools: [...pools.entries()].map(([id, label]) => ({ id, label })),
      statuses: [...statuses].sort(),
    };
  }, [closedQuery.data, liveQuery.data]);

  const selectedRow: MonitorConversationRow | null =
    list.find((r) => r.id === selectedConversationId) ??
    [...(liveQuery.data ?? []), ...(closedQuery.data ?? [])].find(
      (r) => r.id === selectedConversationId,
    ) ??
    null;

  const listsLoading = liveQuery.isLoading || closedQuery.isLoading;

  return {
    token,
    capabilities: capabilitiesQuery.data,
    capabilitiesLoading: capabilitiesQuery.isLoading,
    listTab,
    setListTab,
    filters,
    setFilters,
    filterOptions,
    list,
    liveList,
    closedList,
    listsLoading,
    listsError: liveQuery.isError || closedQuery.isError,
    liveCount: liveList.length,
    closedCount: closedList.length,
    selectedConversationId,
    selectedRow,
    messages,
    visitorFromHistory,
    supervisorControlUserId,
    transcriptLoading,
    transcriptError,
    visitorTyping,
    isConnected,
    selectConversation,
    clearSelection,
    updateSupervisorControl,
    refreshSelectedTranscript,
    refreshLists: invalidateLists,
  };
}
