import { useCallback, useEffect, useRef, useState } from "react";

import { isAuthSessionTerminated } from "@/api/session/terminate-auth-session";
import { isDashboardAccessToken } from "@/lib/auth/access-token";
import { useAccessToken } from "@/lib/auth/use-access-token";
import { EMPTY_BADGES } from "@/lib/hooks/notifications/notification-state.utils";
import {
  fetchNotificationsSnapshot,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications/notifications.api";
import type { BadgeCounts, NotificationDto } from "@/services/notifications/notifications.types";

/**
 * Simplified RN notifications hook (list + badges + drawer state).
 * Socket/sound parity with web can land later without changing the context API.
 */
export function useNotifications(enabled: boolean) {
  const token = useAccessToken() ?? "";
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>(EMPTY_BADGES);
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const fetchSeqRef = useRef(0);

  const canFetch =
    enabled && Boolean(token) && isDashboardAccessToken(token) && !isAuthSessionTerminated();

  const refresh = useCallback(async () => {
    if (!canFetch) {
      setItems([]);
      setBadgeCounts(EMPTY_BADGES);
      setConnected(false);
      return;
    }
    const seq = ++fetchSeqRef.current;
    setLoading(true);
    try {
      const snapshot = await fetchNotificationsSnapshot({ unreadOnly: false });
      if (seq !== fetchSeqRef.current) return;
      setItems(snapshot.items);
      setBadgeCounts(snapshot.badgeCounts);
      setConnected(true);
    } catch {
      if (seq !== fetchSeqRef.current) return;
      setConnected(false);
    } finally {
      if (seq === fetchSeqRef.current) setLoading(false);
    }
  }, [canFetch]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!canFetch || !drawerOpen) return;
    void refresh();
  }, [canFetch, drawerOpen, refresh]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const markRead = useCallback(
    async (id: string) => {
      await markNotificationRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n)),
      );
      void refresh();
    },
    [refresh],
  );

  const markAllRead = useCallback(
    async (badgeGroup?: string) => {
      const next = await markAllNotificationsRead(badgeGroup);
      setBadgeCounts(next);
      setItems((prev) =>
        prev.map((n) => {
          if (badgeGroup && n.badgeGroup !== badgeGroup) return n;
          return { ...n, readAt: n.readAt ?? new Date().toISOString() };
        }),
      );
      void refresh();
    },
    [refresh],
  );

  const refreshBadges = useCallback(async () => {
    await refresh();
  }, [refresh]);

  return {
    badgeCounts,
    items,
    loading,
    connected,
    drawerOpen,
    openDrawer,
    closeDrawer,
    markRead,
    markAllRead,
    refreshBadges,
  };
}
