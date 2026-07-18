import { useCallback, useEffect, useState } from "react";
import { getAccessToken } from "@/api";
import { canSendGuestLink } from "@/lib/permissions/chat-access";
import { publishAppToast } from "@/lib/notify";
import { getGuestLinkSendTarget, listConversationGuestLinks, sendDepartmentGuestLink } from "@/services/chat/guest-link.api";
import type { GuestLinkRow, GuestLinkSendTarget } from "@/services/chat/guest.types";

export function useGuestLinkActions(
  conversationId: string | null,
  hasOperational: (p: string) => boolean,
  serviceChannel?: string | null,
) {
  const token = getAccessToken() ?? "";
  const canSend = canSendGuestLink(hasOperational);
  const isExternalChannel = typeof serviceChannel === "string" && serviceChannel.trim().toLowerCase() === "external";

  const [links, setLinks] = useState<GuestLinkRow[]>([]);
  const [target, setTarget] = useState<GuestLinkSendTarget | null>(null);
  const [targetLoading, setTargetLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const refreshLinks = useCallback(async () => {
    if (!conversationId || !token || !canSend) {
      setLinks([]);
      return;
    }
    try {
      const rows = await listConversationGuestLinks(conversationId, token);
      setLinks(rows);
    } catch {
      setLinks([]);
    }
  }, [canSend, conversationId, token]);

  const refreshTarget = useCallback(async () => {
    if (!conversationId || !token || !canSend) {
      setTarget(null);
      return;
    }
    setTargetLoading(true);
    try {
      const t = await getGuestLinkSendTarget(conversationId, token);
      setTarget(t);
    } catch {
      setTarget(null);
    } finally {
      setTargetLoading(false);
    }
  }, [canSend, conversationId, token]);

  useEffect(() => {
    void refreshLinks();
    void refreshTarget();
  }, [refreshLinks, refreshTarget]);

  const sendDisabled = busy || targetLoading || (target != null && !target.canSend);

  const sendLink = useCallback(async () => {
    if (!conversationId || !token || sendDisabled) return false;
    setBusy(true);
    try {
      const res = await sendDepartmentGuestLink(conversationId, undefined, token);
      const sentList = res.sent ?? res.recipients ?? [];
      const count = sentList.length;
      if (count > 0) {
        publishAppToast({
          variant: "success",
          message: `Involvement link sent to ${count} supervisor${count === 1 ? "" : "s"}.`,
        });
      } else {
        publishAppToast({ variant: "error", message: "No supervisors to notify." });
      }
      await refreshLinks();
      await refreshTarget();
      return count > 0;
    } catch {
      publishAppToast({ variant: "error", message: "Could not send involvement link." });
      return false;
    } finally {
      setBusy(false);
    }
  }, [conversationId, refreshLinks, refreshTarget, sendDisabled, token]);

  return {
    enabled: Boolean(conversationId && canSend && !isExternalChannel),
    links,
    target,
    targetLoading,
    busy,
    sendDisabled,
    sendLink,
    refreshLinks,
    refreshTarget,
  };
}
