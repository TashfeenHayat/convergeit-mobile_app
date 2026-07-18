import { useCallback, useEffect, useState } from "react";
import { getAccessToken } from "@/api";
import { publishAgentInboxDelta } from "@/lib/hooks/chat/agent-inbox-delta-bus";
import { extractApiErrorMessageForToast, publishAppToast } from "@/lib/notify";
import { fetchConversationTransferTargets, transferConversation, type ChatTransferTarget } from "@/services/chat/agent-inbox.api";

export function useTransferChat(conversationId: string | null) {
  const token = getAccessToken() ?? "";
  const [busy, setBusy] = useState(false);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [targets, setTargets] = useState<ChatTransferTarget[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const loadTargets = useCallback(async () => {
    if (!conversationId || !token) {
      setTargets([]);
      return;
    }
    setLoadingTargets(true);
    try {
      const res = await fetchConversationTransferTargets(conversationId, token);
      setTargets(res.agents ?? []);
    } catch (err) {
      setTargets([]);
      publishAppToast({
        variant: "error",
        message: extractApiErrorMessageForToast(err) ?? "Could not load agents for transfer.",
      });
    } finally {
      setLoadingTargets(false);
    }
  }, [conversationId, token]);

  useEffect(() => {
    setSelectedUserId("");
  }, [conversationId]);

  const transfer = useCallback(async () => {
    if (!conversationId || !token || !selectedUserId.trim() || busy) {
      return false;
    }
    setBusy(true);
    try {
      const res = await transferConversation(conversationId, selectedUserId.trim(), token);
      publishAgentInboxDelta({ kind: "conversation_reassigned_away", conversationId });
      publishAppToast({
        variant: "success",
        message: `Chat transferred${res.toAgent?.label ? ` to ${res.toAgent.label}` : ""}.`,
      });
      return true;
    } catch (err) {
      publishAppToast({
        variant: "error",
        message: extractApiErrorMessageForToast(err) ?? "Could not transfer chat.",
      });
      return false;
    } finally {
      setBusy(false);
    }
  }, [busy, conversationId, selectedUserId, token]);

  return {
    enabled: Boolean(conversationId && token),
    busy,
    loadingTargets,
    targets,
    selectedUserId,
    setSelectedUserId,
    loadTargets,
    transfer,
  };
}
