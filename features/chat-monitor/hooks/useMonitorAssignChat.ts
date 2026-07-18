import { useCallback, useEffect, useState } from "react";
import { extractApiErrorMessageForToast, publishAppToast } from "@/lib/notify";
import {
  fetchMonitorAssignTargets,
  monitorAssignConversation,
  type MonitorAssignTarget,
} from "@/services/chat/monitor.api";

export function useMonitorAssignChat(
  conversationId: string | null,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled !== false && Boolean(conversationId);
  const [busy, setBusy] = useState(false);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [targets, setTargets] = useState<MonitorAssignTarget[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const loadTargets = useCallback(async () => {
    if (!enabled || !conversationId) {
      setTargets([]);
      return;
    }
    setLoadingTargets(true);
    try {
      const res = await fetchMonitorAssignTargets(conversationId);
      setTargets(res.agents ?? []);
    } catch (err) {
      setTargets([]);
      publishAppToast({
        variant: "error",
        message:
          extractApiErrorMessageForToast(err) ??
          "Could not load agents for assignment.",
      });
    } finally {
      setLoadingTargets(false);
    }
  }, [conversationId, enabled]);

  useEffect(() => {
    setSelectedUserId("");
    if (!enabled) {
      setTargets([]);
      return;
    }
    void loadTargets();
  }, [enabled, loadTargets]);

  const assign = useCallback(async () => {
    if (!conversationId || !selectedUserId.trim() || busy) {
      return false;
    }
    setBusy(true);
    try {
      const res = await monitorAssignConversation(
        conversationId,
        selectedUserId.trim(),
      );
      publishAppToast({
        variant: "success",
        message: `Chat assigned${res.toAgent?.label ? ` to ${res.toAgent.label}` : ""}.`,
      });
      return true;
    } catch (err) {
      publishAppToast({
        variant: "error",
        message:
          extractApiErrorMessageForToast(err) ?? "Could not assign chat.",
      });
      return false;
    } finally {
      setBusy(false);
    }
  }, [busy, conversationId, selectedUserId]);

  return {
    enabled,
    busy,
    loadingTargets,
    targets,
    selectedUserId,
    setSelectedUserId,
    loadTargets,
    assign,
  };
}
