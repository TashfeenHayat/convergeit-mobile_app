import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { subscribeAgentInboxDelta } from "./agent-inbox-delta-bus";
import { applyInboxQueuePatch } from "./agent-inbox-queue-patch";
import { subscribeAgentInboxRefresh } from "./agent-inbox-refresh-bus";
import {
  isAgentChatSessionAccepting,
  subscribeAgentChatSession,
} from "./agent-chat-session-bus";
import { MAX_ACTIVE_CHATS_PER_AGENT } from "@/services/chat/chat.constants";
import {
  getMyActiveChats,
  getMyClosedChats,
} from "@/services/chat/agent-inbox.api";
import type { ConversationSummary } from "@/services/chat/chat.types";
import { extractApiErrorMessageForToast, publishAppToast } from "@/lib/notify";

function inboxRefreshFailureMessage(error: unknown): string {
  if (axios.isAxiosError(error) && !error.response) {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "API";
    return `Cannot reach the API at ${base}. Start the Nest backend (Convergit_saas) and ensure its port matches NEXT_PUBLIC_API_BASE_URL — often http://localhost:3001 while Next.js uses 3000.`;
  }
  return (
    extractApiErrorMessageForToast(error, "Could not refresh agent inbox.") ??
    "Could not refresh agent inbox."
  );
}

export interface AgentInboxQueuesState {
  activeChats: ConversationSummary[];
  waitingChats: ConversationSummary[];
  closedChats: ConversationSummary[];
  atActiveCap: boolean;
  refreshQueues: () => Promise<void>;
}

export function useAgentInboxQueues(
  token: string,
  permissionEnabled = true,
  currentAgentId?: string | null,
  options?: { respectChatSession?: boolean },
): AgentInboxQueuesState {
  const tokenReady = Boolean(token.trim());
  const apiEnabled = permissionEnabled && tokenReady;
  const respectChatSession = options?.respectChatSession ?? false;
  const [acceptingChats, setAcceptingChats] = useState(() =>
    respectChatSession ? isAgentChatSessionAccepting() : true,
  );
  const [activeChats, setActiveChats] = useState<ConversationSummary[]>([]);
  const [waitingChats, setWaitingChats] = useState<ConversationSummary[]>([]);
  const [closedChats, setClosedChats] = useState<ConversationSummary[]>([]);
  const lastToastAtRef = useRef(0);
  const closedRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const agentIdRef = useRef(currentAgentId);
  agentIdRef.current = currentAgentId;

  useEffect(() => {
    if (!respectChatSession) {
      setAcceptingChats(true);
      return undefined;
    }
    return subscribeAgentChatSession((session) => {
      setAcceptingChats(session.status === "active" && session.acceptingChats);
    });
  }, [respectChatSession]);

  useEffect(() => {
    if (!respectChatSession || acceptingChats) return;
    setWaitingChats([]);
  }, [acceptingChats, respectChatSession]);

  const refreshClosedOnly = useCallback(async () => {
    if (!apiEnabled || !token) return;
    try {
      const closed = await getMyClosedChats(token);
      setClosedChats(closed);
    } catch {
      /* non-fatal */
    }
  }, [apiEnabled, token]);

  const refreshQueues = useCallback(async () => {
    if (!apiEnabled || !token) {
      setActiveChats([]);
      setWaitingChats([]);
      setClosedChats([]);
      return;
    }

    const [activeResult, closedResult] = await Promise.allSettled([
      getMyActiveChats(token),
      getMyClosedChats(token),
    ]);

    const failures: unknown[] = [];
    if (activeResult.status === "fulfilled") {
      setActiveChats(activeResult.value);
    } else {
      failures.push(activeResult.reason);
      setActiveChats([]);
    }
    setWaitingChats([]);
    if (closedResult.status === "fulfilled") {
      setClosedChats(closedResult.value);
    } else {
      failures.push(closedResult.reason);
      setClosedChats([]);
    }

    if (failures.length) {
      const now = Date.now();
      if (now - lastToastAtRef.current > 8000) {
        lastToastAtRef.current = now;
        publishAppToast({
          variant: "error",
          message: inboxRefreshFailureMessage(failures[0]),
        });
      }
    }
  }, [acceptingChats, apiEnabled, token]);

  const queuesRef = useRef({
    activeChats: [] as ConversationSummary[],
    waitingChats: [] as ConversationSummary[],
    closedChats: [] as ConversationSummary[],
  });
  queuesRef.current = { activeChats, waitingChats, closedChats };

  const applyPatch = useCallback(
    (patch: Parameters<typeof applyInboxQueuePatch>[1]) => {
      const result = applyInboxQueuePatch(
        queuesRef.current,
        patch,
        agentIdRef.current,
      );
      setActiveChats(result.activeChats);
      setWaitingChats(result.waitingChats);
      setClosedChats(result.closedChats);
      if (result.needsClosedRefresh) {
        if (closedRefreshTimerRef.current) {
          clearTimeout(closedRefreshTimerRef.current);
        }
        closedRefreshTimerRef.current = setTimeout(() => {
          closedRefreshTimerRef.current = null;
          void refreshClosedOnly();
        }, 800);
      }
    },
    [refreshClosedOnly],
  );

  const atActiveCap = activeChats.length >= MAX_ACTIVE_CHATS_PER_AGENT;

  useEffect(() => {
    if (!permissionEnabled) {
      setActiveChats([]);
      setWaitingChats([]);
      setClosedChats([]);
      return;
    }
    if (!tokenReady) return;
    void refreshQueues();
  }, [acceptingChats, permissionEnabled, refreshQueues, tokenReady]);

  useEffect(() => {
    if (!permissionEnabled || !tokenReady) return undefined;
    return subscribeAgentInboxRefresh(() => {
      void refreshQueues();
    });
  }, [permissionEnabled, refreshQueues, tokenReady]);

  useEffect(() => {
    if (!permissionEnabled) return undefined;
    return subscribeAgentInboxDelta((patch) => {
      if (respectChatSession && !acceptingChats) {
        if (patch.kind === "queue_add" || patch.kind === "assigned_to_agent") {
          return;
        }
      }
      applyPatch(patch);
    });
  }, [acceptingChats, applyPatch, permissionEnabled, respectChatSession]);

  useEffect(
    () => () => {
      if (closedRefreshTimerRef.current) {
        clearTimeout(closedRefreshTimerRef.current);
      }
    },
    [],
  );

  const refreshQueuesPublic = useCallback(async () => {
    await refreshQueues();
  }, [refreshQueues]);

  return {
    activeChats,
    waitingChats,
    closedChats,
    atActiveCap,
    refreshQueues: refreshQueuesPublic,
  };
}
