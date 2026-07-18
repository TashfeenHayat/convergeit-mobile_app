import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useAccessToken } from "@/lib/auth/use-access-token";
import {
  buildInboxPatchFromSocket,
} from "@/lib/hooks/chat/agent-inbox-queue-patch";
import { publishAgentInboxDelta } from "@/lib/hooks/chat/agent-inbox-delta-bus";
import { publishAgentChatNotificationSync } from "@/lib/hooks/chat/agent-chat-notification-sync-bus";
import { conversationIdFromSocketPayload } from "@/lib/hooks/chat/agent-chat.utils";
import {
  applyStopTypingSocketPayload,
  applyTypingSocketPayload,
} from "@/lib/hooks/chat/apply-typing-socket-payload";
import type { TypingPayload } from "@/services/chat/chat.types";
import { isAgentChatSessionAccepting } from "@/lib/hooks/chat/agent-chat-session-bus";
import {
  connectSharedAgentChat,
  getSharedAgentChatSocket,
} from "@/services/chat/sharedAgentChatSocket";

const ASSIGNMENT_INBOX_EVENTS = new Set([
  "agent_assignment_popup",
  "agent_queue_popup",
  "chat_assigned",
  "chat_queued",
  "chat_talk_to_agent",
]);

/**
 * Keeps agent `/chat` connected for the dashboard session (popups + inbox deltas).
 * Toast, sound, and bell badge are handled by {@link useNotifications} on `/notifications`.
 */
export function useAgentSessionSockets(
  enabled: boolean,
  options?: { inboxDeltas?: boolean; respectChatSession?: boolean },
): void {
  const token = useAccessToken() ?? "";
  const { user } = useAuth();
  const agentIdRef = useRef(user?.id);
  agentIdRef.current = user?.id;
  const inboxDeltas = options?.inboxDeltas ?? true;
  const respectChatSession = options?.respectChatSession ?? false;
  useEffect(() => {
    if (!enabled || !token) return undefined;

    const socketClient = getSharedAgentChatSocket();
    connectSharedAgentChat(token);

    const shouldAcceptNewWork = () =>
      !respectChatSession || isAgentChatSessionAccepting();

    const applySocketInbox = (event: string, payload: unknown) => {
      if (!inboxDeltas) return;
      if (!shouldAcceptNewWork() && ASSIGNMENT_INBOX_EVENTS.has(event)) return;
      const patch = buildInboxPatchFromSocket(
        event,
        payload,
        agentIdRef.current,
      );
      if (patch) {
        publishAgentInboxDelta(patch);
      }
    };

    const offAssignment = socketClient.onAgentAssignmentPopup((payload) => {
      applySocketInbox("agent_assignment_popup", payload);
      if (!shouldAcceptNewWork()) return;
      publishAgentChatNotificationSync(
        "assignment",
        conversationIdFromSocketPayload(payload) ?? undefined,
      );
    });

    const offQueue = socketClient.onAgentQueuePopup((payload) => {
      applySocketInbox("agent_queue_popup", payload);
      if (!shouldAcceptNewWork()) return;
      publishAgentChatNotificationSync(
        "queue",
        conversationIdFromSocketPayload(payload) ?? undefined,
      );
    });

    const offTransferred = socketClient.onChatTransferred((payload) => {
      applySocketInbox("chat_transferred", payload);
    });
    const offCompleted = socketClient.onChatCompleted((payload) => {
      applySocketInbox("chat_completed", payload);
    });
    const offClosed = socketClient.onChatClosed((payload) => {
      applySocketInbox("chat_closed", payload);
    });
    const offAssigned = socketClient.onChatAssigned((payload) => {
      applySocketInbox("chat_assigned", payload);
    });
    const offQueued = socketClient.onChatQueued((payload) => {
      applySocketInbox("chat_queued", payload);
    });
    const offTalkToAgent = socketClient.onChatTalkToAgent((payload) => {
      applySocketInbox("chat_talk_to_agent", payload);
    });
    const offResumed = socketClient.onChatResumed((payload) => {
      applySocketInbox("chat_resumed", payload);
    });
    const offVisitorProfile = socketClient.onVisitorProfileUpdated((payload) => {
      applySocketInbox("visitor_profile_updated", payload);
    });

    const offVisitorMessage = socketClient.onVisitorMessageRaw((payload) => {
      if (!shouldAcceptNewWork()) return;
      publishAgentChatNotificationSync(
        "visitor_message",
        conversationIdFromSocketPayload(payload) ?? undefined,
      );
    });

    const handleTyping = (payload: TypingPayload) => {
      if (
        payload.userId &&
        user?.id &&
        payload.userId === user.id &&
        payload.userType !== "visitor"
      ) {
        return;
      }
      applyTypingSocketPayload(payload);
    };
    const handleStopTyping = (payload: TypingPayload) => {
      if (
        payload.userId &&
        user?.id &&
        payload.userId === user.id &&
        payload.userType !== "visitor"
      ) {
        return;
      }
      applyStopTypingSocketPayload(payload);
    };

    const offTyping = socketClient.onTyping(handleTyping);
    const offStopTyping = socketClient.onStopTyping(handleStopTyping);

    return () => {
      offAssignment();
      offQueue();
      offTransferred();
      offCompleted();
      offClosed();
      offAssigned();
      offQueued();
      offTalkToAgent();
      offResumed();
      offVisitorProfile();
      offVisitorMessage();
      offTyping();
      offStopTyping();
    };
  }, [enabled, inboxDeltas, respectChatSession, token, user?.id]);
}
