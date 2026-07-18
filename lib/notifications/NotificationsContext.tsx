import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useNotifications } from "@/lib/hooks/notifications/useNotifications";
import type { BadgeCounts, NotificationDto } from "@/services/notifications/notifications.types";

type NotificationsContextValue = {
  badgeCounts: BadgeCounts;
  items: NotificationDto[];
  loading: boolean;
  connected: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: (badgeGroup?: string) => Promise<void>;
  refreshBadges: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const n = useNotifications(enabled);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      badgeCounts: n.badgeCounts,
      items: n.items,
      loading: n.loading,
      connected: n.connected,
      drawerOpen: n.drawerOpen,
      openDrawer: n.openDrawer,
      closeDrawer: n.closeDrawer,
      markRead: n.markRead,
      markAllRead: n.markAllRead,
      refreshBadges: n.refreshBadges,
    }),
    [
      n.badgeCounts,
      n.items,
      n.loading,
      n.connected,
      n.drawerOpen,
      n.openDrawer,
      n.closeDrawer,
      n.markRead,
      n.markAllRead,
      n.refreshBadges,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotificationsContext(): NotificationsContextValue | null {
  return useContext(NotificationsContext);
}
