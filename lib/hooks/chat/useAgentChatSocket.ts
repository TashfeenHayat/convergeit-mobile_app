import { useEffect, useRef, type MutableRefObject } from "react";
import type { ChatSocketClient } from "@/services/chat/chatSocket";
import type { TypingPayload } from "@/services/chat/chat.types";
import { conversationIdFromSocketPayload } from "./agent-chat.utils";
import { publishAgentInboxDelta } from "@/lib/hooks/chat/agent-inbox-delta-bus";
import { buildInboxPatchFromSocket } from "@/lib/hooks/chat/agent-inbox-queue-patch";
import { publishAgentInboxRefreshAfterTalkToAgent } from "@/lib/hooks/chat/agent-inbox-refresh-bus";
import {
  applyStopTypingSocketPayload,
  applyTypingSocketPayload,
} from "@/lib/hooks/chat/apply-typing-socket-payload";
import { getVisitorTypingDraft } from "@/lib/hooks/chat/conversation-typing-bus";
import {
  CHAT_RECONNECT_SYNC_DEBOUNCE_MS,
  normalizeSocketMessage,
  ensureConversationRoomJoin,
  unwrapSocketMessagePayload,
} from "./chat-socket-delivery";
import { connectSharedAgentChat } from "@/services/chat/sharedAgentChatSocket";

export interface AgentChatSocketHandlers {
  onVisitorMessage: (message: import("@/services/chat/chat.types").ChatMessage) => void;
  onRefreshQueues: () => void;
  /** Monitor / non-inbox UIs: patch list from socket queue events. */
  onInboxSocketEvent?: (event: string, payload: unknown) => void;
  /** Monitor: all monitor_live_update events (list + transcript hints). */
  onMonitorLiveUpdate?: (update: import("@/services/chat/chatSocket").MonitorLiveUpdatePayload) => void;
  /** One-shot REST gap-fill after reconnect (not on every message). */
  onReconnectHistorySync?: () => void;
  onSessionEnded: (payload: unknown) => void;
  onChatResumed: (payload: unknown) => void;
  onVisitorTyping: (typing: boolean, draft?: string) => void;
  onVisitorProfileUpdated?: (payload: unknown) => void;
  onChatCompleted?: (payload: unknown) => void;
  onChatWhisper?: (payload: unknown) => void;
  onTakeoverRequested?: (payload: unknown) => void;
  onTakeoverUpdate?: (payload: unknown) => void;
  onChatTransferred?: (payload: unknown) => void;
  onAgentAssignmentPopup?: (payload: unknown) => void;
  onSupervisorControl?: (payload: unknown) => void;
  onAgentWrapUpForm?: (payload: unknown) => void;
  onAgentWrapUpSubmitted?: (payload: unknown) => void;
  onAgentDistributionSubmitted?: (payload: unknown) => void;
  selectedConversationIdRef: MutableRefObject<string | null>;
  selectedIsClosedRef: MutableRefObject<boolean>;
}

const SESSION_ENDED_DEDUPE_MS = 2500;

export function useAgentChatSocket(
  token: string,
  socketClient: ChatSocketClient,
  currentAgentId: string | undefined,
  handlers: AgentChatSocketHandlers,
  onConnectedChange: (connected: boolean) => void,
  options?: { publishInboxDeltas?: boolean },
): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const onConnectedChangeRef = useRef(onConnectedChange);
  onConnectedChangeRef.current = onConnectedChange;

  const reconnectSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionEndedDedupeRef = useRef<{ key: string; at: number } | null>(null);
  const agentIdRef = useRef(currentAgentId);
  agentIdRef.current = currentAgentId;
  const publishInboxDeltas = options?.publishInboxDeltas ?? false;

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    connectSharedAgentChat(token);

    const getHandlers = () => handlersRef.current;

    const applyInboxDelta = (event: string, payload: unknown) => {
      if (publishInboxDeltas) {
        const patch = buildInboxPatchFromSocket(
          event,
          payload,
          agentIdRef.current,
        );
        if (patch) {
          publishAgentInboxDelta(patch);
        }
      }
      getHandlers().onInboxSocketEvent?.(event, payload);
    };

    const scheduleReconnectHistorySync = () => {
      if (reconnectSyncTimerRef.current) clearTimeout(reconnectSyncTimerRef.current);
      reconnectSyncTimerRef.current = setTimeout(() => {
        reconnectSyncTimerRef.current = null;
        getHandlers().onReconnectHistorySync?.();
      }, CHAT_RECONNECT_SYNC_DEBOUNCE_MS);
    };

    const emitSessionEndedOnce = (payload: unknown) => {
      const cid = conversationIdFromSocketPayload(payload) ?? "";
      const now = Date.now();
      const prev = sessionEndedDedupeRef.current;
      if (cid && prev?.key === cid && now - prev.at < SESSION_ENDED_DEDUPE_MS) {
        return;
      }
      if (cid) sessionEndedDedupeRef.current = { key: cid, at: now };

      const h = getHandlers();
      h.onSessionEnded(payload);
      if (h.onChatCompleted && h.onChatCompleted !== h.onSessionEnded) {
        h.onChatCompleted(payload);
      }
    };

    const deliverSocketMessage = (payload: unknown) => {
      const cid = getHandlers().selectedConversationIdRef.current;
      let normalized = normalizeSocketMessage(payload, cid);
      if (!normalized && cid) {
        const payloadCid = conversationIdFromSocketPayload(payload);
        if (payloadCid && payloadCid.toLowerCase() === cid.toLowerCase()) {
          const unwrapped = unwrapSocketMessagePayload(payload);
          if (unwrapped && typeof unwrapped === "object") {
            normalized = normalizeSocketMessage(
              { ...(unwrapped as Record<string, unknown>), conversationId: payloadCid },
              cid,
            );
          }
        }
      }
      if (!normalized) {
        scheduleReconnectHistorySync();
        return;
      }
      getHandlers().onVisitorMessage(normalized);
    };

    onConnectedChangeRef.current(socketClient.isConnected());

    let clearJoinRetries: (() => void) | undefined;

    const resyncAfterReconnect = () => {
      onConnectedChangeRef.current(true);
      clearJoinRetries?.();
      clearJoinRetries = undefined;
      const cid = getHandlers().selectedConversationIdRef.current;
      if (cid) {
        clearJoinRetries = ensureConversationRoomJoin(
          socketClient,
          cid,
          () =>
            getHandlers().selectedConversationIdRef.current?.toLowerCase() ===
            cid.toLowerCase(),
        );
      }
      scheduleReconnectHistorySync();
    };

    const offSocketConnect = socketClient.onSocketConnect(resyncAfterReconnect);
    const offSocketDisconnect = socketClient.onSocketDisconnect(() => {
      onConnectedChangeRef.current(false);
    });
    const offConnected = socketClient.onConnected(resyncAfterReconnect);

    const offVisitorMessage = socketClient.onVisitorMessageRaw((payload) => {
      deliverSocketMessage(payload);
    });
    const offAgentMessage = socketClient.onAgentMessageRaw((payload) => {
      deliverSocketMessage(payload);
    });
    const offAiMessage = socketClient.onAiMessageRaw((payload) => {
      deliverSocketMessage(payload);
    });

    const offMonitorLive = socketClient.onMonitorLiveUpdate((update) => {
      getHandlers().onMonitorLiveUpdate?.(update);

      const cid = getHandlers().selectedConversationIdRef.current;
      const event = String(update.event ?? "").toLowerCase();
      const selectedIsClosed = getHandlers().selectedIsClosedRef.current;
      if (
        cid &&
        !selectedIsClosed &&
        update.conversationId?.toLowerCase() === cid.toLowerCase() &&
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
      const payload =
        update.payload && typeof update.payload === "object"
          ? {
              ...(update.payload as Record<string, unknown>),
              conversationId:
                (update.payload as { conversationId?: string }).conversationId ??
                update.conversationId,
            }
          : update.payload;
      deliverSocketMessage(payload);
    });

    const offTyping = socketClient.onTyping((payload: TypingPayload) => {
      if (
        payload.userId &&
        agentIdRef.current &&
        payload.userId === agentIdRef.current &&
        payload.userType !== "visitor"
      ) {
        return;
      }
      applyTypingSocketPayload(payload);
      const cid = payload.conversationId?.trim();
      const selected = getHandlers().selectedConversationIdRef.current;
      if (
        cid &&
        selected &&
        cid.toLowerCase() === selected.toLowerCase() &&
        (payload.typingRole === "visitor" || payload.userType === "visitor")
      ) {
        getHandlers().onVisitorTyping?.(
          Boolean(getVisitorTypingDraft(cid)),
          getVisitorTypingDraft(cid),
        );
      }
    });
    const offStopTyping = socketClient.onStopTyping((payload: TypingPayload) => {
      if (
        payload.userId &&
        agentIdRef.current &&
        payload.userId === agentIdRef.current &&
        payload.userType !== "visitor"
      ) {
        return;
      }
      applyStopTypingSocketPayload(payload);
      const cid = payload.conversationId?.trim();
      const selected = getHandlers().selectedConversationIdRef.current;
      if (
        cid &&
        selected &&
        cid.toLowerCase() === selected.toLowerCase() &&
        (payload.typingRole === "visitor" || payload.userType === "visitor")
      ) {
        getHandlers().onVisitorTyping?.(false);
      }
    });

    const offAssigned = socketClient.onChatAssigned((p) =>
      applyInboxDelta("chat_assigned", p),
    );
    const offQueued = socketClient.onChatQueued((p) =>
      applyInboxDelta("chat_queued", p),
    );
    const offTalkToAgentTransfer = socketClient.onChatHandover((p) => {
      if (publishInboxDeltas) {
        const patch = buildInboxPatchFromSocket("chat_assigned", p, agentIdRef.current);
        if (patch) {
          publishAgentInboxDelta(patch);
        } else {
          publishAgentInboxRefreshAfterTalkToAgent();
        }
      }
      getHandlers().onInboxSocketEvent?.("chat_talk_to_agent", p);
    });
    const offResumed = socketClient.onChatResumed((p) => getHandlers().onChatResumed(p));
    const offClosed = socketClient.onChatClosed(emitSessionEndedOnce);
    const offCompleted = socketClient.onChatCompleted(emitSessionEndedOnce);
    const offTransferred = socketClient.onChatTransferred((p) => {
      applyInboxDelta("chat_transferred", p);
      getHandlers().onChatTransferred?.(p);
    });
    const offAssignmentPopup = socketClient.onAgentAssignmentPopup((p) => {
      applyInboxDelta("agent_assignment_popup", p);
      getHandlers().onAgentAssignmentPopup?.(p);
    });
    const offSupervisorControl = socketClient.onSupervisorControl((p) => {
      getHandlers().onSupervisorControl?.(p);
    });
    const offVisitorProfile = socketClient.onVisitorProfileUpdated((p) => {
      applyInboxDelta("visitor_profile_updated", p);
      getHandlers().onVisitorProfileUpdated?.(p);
    });
    const offWhisper = socketClient.onChatWhisper((p) => getHandlers().onChatWhisper?.(p));
    const offTakeoverReq = socketClient.onTakeoverRequested((p) =>
      getHandlers().onTakeoverRequested?.(p),
    );
    const offTakeoverUpd = socketClient.onTakeoverUpdate((p) => getHandlers().onTakeoverUpdate?.(p));

    const wrapUpHandler = (p: unknown) => getHandlers().onAgentWrapUpForm?.(p);
    const offWrapUpForm = socketClient.onAgentWrapUpForm(wrapUpHandler);
    const offWrapUpRequired = socketClient.onAgentWrapUpRequired(wrapUpHandler);
    const offWrapUpSubmitted = socketClient.onAgentWrapUpSubmitted((p) =>
      getHandlers().onAgentWrapUpSubmitted?.(p),
    );
    const offDistributionSubmitted = socketClient.onAgentDistributionSubmitted((p) =>
      getHandlers().onAgentDistributionSubmitted?.(p),
    );

    return () => {
      clearJoinRetries?.();
      clearJoinRetries = undefined;
      if (reconnectSyncTimerRef.current) clearTimeout(reconnectSyncTimerRef.current);
      reconnectSyncTimerRef.current = null;
      offConnected();
      offSocketConnect();
      offSocketDisconnect();
      offVisitorMessage();
      offAgentMessage();
      offAiMessage();
      offMonitorLive();
      offTyping();
      offStopTyping();
      offAssigned();
      offQueued();
      offTalkToAgentTransfer();
      offResumed();
      offClosed();
      offCompleted();
      offTransferred();
      offAssignmentPopup();
      offSupervisorControl();
      offWhisper();
      offTakeoverReq();
      offTakeoverUpd();
      offVisitorProfile();
      offWrapUpForm();
      offWrapUpRequired();
      offWrapUpSubmitted();
      offDistributionSubmitted();
    };
  }, [publishInboxDeltas, socketClient, token]);
}

export { conversationIdFromSocketPayload };
