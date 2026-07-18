import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter, type Href } from "expo-router";

import { Typography } from "@/components/ui";
import { webHrefToMobile } from "@/constants/navigation";
import { useNotificationsContext } from "@/lib/notifications/NotificationsContext";
import { resolveNotificationHref } from "@/lib/notifications/resolve-notification-href";
import type {
  BadgeCounts,
  NotificationBadgeGroup,
  NotificationDto,
} from "@/services/notifications/notifications.types";
import { tokens } from "@/theme/tokens";

type FilterKey = "all" | NotificationBadgeGroup;

function totalUnread(counts: BadgeCounts): number {
  return counts.chat + counts.qa + counts.hrms_leave + counts.hrms_attendance;
}

const GROUP_LABELS: Record<NotificationBadgeGroup, string> = {
  chat: "Chat",
  qa: "QA",
  hrms_leave: "Leave",
  hrms_attendance: "Attendance",
};

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "chat", label: "Chat" },
  { key: "qa", label: "QA" },
  { key: "hrms_leave", label: "Leave" },
  { key: "hrms_attendance", label: "Attendance" },
];

function groupAccent(group: NotificationBadgeGroup): string {
  if (group === "chat") return tokens.colors.accentBlue;
  if (group === "qa") return "#A78BFA";
  if (group === "hrms_attendance") return "#F87171";
  return tokens.colors.accentOrange;
}

function formatNotificationTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function countForFilter(key: FilterKey, badgeCounts: BadgeCounts): number {
  if (key === "all") return totalUnread(badgeCounts);
  return badgeCounts[key];
}

function groupIconName(group: NotificationBadgeGroup): "comment-o" | "check-square-o" | "clock-o" | "umbrella" {
  if (group === "chat") return "comment-o";
  if (group === "qa") return "check-square-o";
  if (group === "hrms_attendance") return "clock-o";
  return "umbrella";
}

function NotificationRow({
  notification,
  onSelect,
}: {
  notification: NotificationDto;
  onSelect: () => void;
}) {
  const accent = groupAccent(notification.badgeGroup);
  const isUnread = !notification.readAt;

  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.row,
        isUnread && { backgroundColor: `${accent}14` },
        pressed && styles.rowPressed,
      ]}
      accessibilityRole="button"
    >
      <View style={[styles.iconBox, { backgroundColor: `${accent}24`, borderColor: `${accent}40` }]}>
        <FontAwesome name={groupIconName(notification.badgeGroup)} size={16} color={accent} />
        {isUnread ? <View style={styles.unreadDot} /> : null}
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTitleLine}>
          <Typography
            variant="small"
            style={[styles.rowTitle, isUnread && styles.rowTitleUnread]}
            numberOfLines={1}
          >
            {notification.title}
          </Typography>
          <Typography variant="small" color={tokens.colors.textMuted} style={styles.rowTime}>
            {formatNotificationTime(notification.createdAt)}
          </Typography>
        </View>
        {notification.body ? (
          <Typography variant="small" color={tokens.colors.textMuted} numberOfLines={2}>
            {notification.body}
          </Typography>
        ) : null}
      </View>
    </Pressable>
  );
}

export function NotificationsBellDrawer() {
  const router = useRouter();
  const ctx = useNotificationsContext();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!ctx?.drawerOpen) setFilter("all");
  }, [ctx?.drawerOpen]);

  const badgeCounts = ctx?.badgeCounts ?? EMPTY_BADGES_LOCAL;
  const items = useMemo(() => ctx?.items ?? [], [ctx?.items]);
  const loading = ctx?.loading ?? false;
  const drawerOpen = ctx?.drawerOpen ?? false;
  const openDrawer = ctx?.openDrawer ?? (() => {});
  const closeDrawer = ctx?.closeDrawer ?? (() => {});
  const markRead = ctx?.markRead ?? (async () => {});
  const markAllRead = ctx?.markAllRead ?? (async () => {});

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((n) => n.badgeGroup === filter);
  }, [filter, items]);

  if (!ctx) return null;

  const unreadTotal = totalUnread(badgeCounts);
  const badgeLabel = unreadTotal > 99 ? "99+" : String(unreadTotal);

  const emptyTitle =
    filter === "all" ? "You're all caught up" : `No ${GROUP_LABELS[filter as NotificationBadgeGroup]} alerts`;
  const emptyDescription =
    filter === "all"
      ? "New chat, QA, and leave updates appear here."
      : `No ${GROUP_LABELS[filter as NotificationBadgeGroup].toLowerCase()} notifications right now.`;

  const handleClose = () => closeDrawer();

  const handleClickItem = (notification: NotificationDto) => {
    const target = resolveNotificationHref(notification);
    handleClose();
    if (target) {
      router.push(webHrefToMobile(target) as Href);
    }
    void markRead(notification.id);
  };

  const handleMarkAllRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      await markAllRead(filter === "all" ? undefined : filter);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={openDrawer}
        style={({ pressed }) => [styles.bellBtn, pressed && styles.bellPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Notifications${unreadTotal ? `, ${unreadTotal} unread` : ""}`}
      >
        <FontAwesome name="bell-o" size={20} color={tokens.colors.textPrimary} />
        {unreadTotal > 0 ? (
          <View style={styles.badge}>
            <Typography variant="small" style={styles.badgeText}>
              {badgeLabel}
            </Typography>
          </View>
        ) : null}
      </Pressable>

      <Modal
        visible={drawerOpen}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.backdrop}
            onPress={handleClose}
            accessibilityLabel="Dismiss notifications"
          />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderTop}>
                <Typography variant="medium16" style={styles.sheetTitle}>
                  Notifications
                </Typography>
                {unreadTotal > 0 ? (
                  <Pressable onPress={() => void handleMarkAllRead()} disabled={markingAll}>
                    <Typography variant="small" color={tokens.colors.textSecondary} style={styles.markAll}>
                      {markingAll ? "Marking…" : "Mark all read"}
                    </Typography>
                  </Pressable>
                ) : null}
              </View>
              <Typography variant="small" color={tokens.colors.textMuted}>
                {unreadTotal > 0 ? `${unreadTotal} unread` : "Live updates from chat, QA & leave"}
              </Typography>
            </View>

            <View style={styles.tabs} accessibilityRole="tablist">
              {FILTER_TABS.map((tab) => {
                const count = countForFilter(tab.key, badgeCounts);
                const active = filter === tab.key;
                const accent =
                  tab.key === "all" ? tokens.colors.accentBlue : groupAccent(tab.key as NotificationBadgeGroup);
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setFilter(tab.key)}
                    style={[styles.tab, active && { borderBottomColor: accent }]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                  >
                    <Typography
                      variant="small"
                      color={active ? tokens.colors.textPrimary : tokens.colors.textMuted}
                      style={active ? styles.tabLabelActive : undefined}
                    >
                      {tab.label}
                    </Typography>
                    {count > 0 ? (
                      <View
                        style={[
                          styles.tabCount,
                          { backgroundColor: active ? `${accent}33` : "rgba(255,255,255,0.08)" },
                        ]}
                      >
                        <Typography
                          variant="small"
                          style={[styles.tabCountText, { color: active ? accent : tokens.colors.textMuted }]}
                        >
                          {count > 99 ? "99+" : count}
                        </Typography>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {loading ? (
                <View style={styles.centerState}>
                  <ActivityIndicator color={tokens.colors.accentBlue} />
                </View>
              ) : filteredItems.length === 0 ? (
                <View style={styles.centerState}>
                  <View style={styles.emptyIcon}>
                    <FontAwesome
                      name={filter === "all" ? "check" : "bell-o"}
                      size={24}
                      color={tokens.colors.accentBlue}
                    />
                  </View>
                  <Typography variant="medium" style={styles.emptyTitle}>
                    {emptyTitle}
                  </Typography>
                  <Typography variant="small" color={tokens.colors.textMuted} style={styles.emptyDesc}>
                    {emptyDescription}
                  </Typography>
                </View>
              ) : (
                filteredItems.map((n) => (
                  <NotificationRow key={n.id} notification={n} onSelect={() => handleClickItem(n)} />
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const EMPTY_BADGES_LOCAL: BadgeCounts = {
  chat: 0,
  qa: 0,
  hrms_leave: 0,
  hrms_attendance: 0,
};

const styles = StyleSheet.create({
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  bellPressed: {
    opacity: 0.85,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: tokens.colors.accentRed,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 12,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    maxHeight: "78%",
    backgroundColor: tokens.colors.surfaceElevated,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.cardBorder,
    borderBottomWidth: 0,
    overflow: "hidden",
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginTop: tokens.space.sm,
    marginBottom: tokens.space.xs,
  },
  sheetHeader: {
    paddingHorizontal: tokens.space.lg,
    paddingBottom: tokens.space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  sheetHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  sheetTitle: {
    fontWeight: "700",
  },
  markAll: {
    textDecorationLine: "underline",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabLabelActive: {
    fontWeight: "600",
  },
  tabCount: {
    borderRadius: 5,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  tabCountText: {
    fontSize: 9,
    fontWeight: "700",
    lineHeight: 12,
  },
  list: {
    maxHeight: 420,
  },
  listContent: {
    paddingBottom: tokens.space.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: tokens.space.md,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  rowPressed: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  unreadDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.colors.accentBlue,
    borderWidth: 2,
    borderColor: tokens.colors.surfaceElevated,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTitleLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: tokens.space.sm,
    marginBottom: 2,
  },
  rowTitle: {
    flex: 1,
    color: tokens.colors.textPrimary,
  },
  rowTitleUnread: {
    fontWeight: "600",
  },
  rowTime: {
    fontSize: 10,
  },
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.space.xl,
    paddingVertical: tokens.space.xxl,
    gap: tokens.space.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(88,101,242,0.16)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(88,101,242,0.3)",
    marginBottom: tokens.space.sm,
  },
  emptyTitle: {
    fontWeight: "600",
    textAlign: "center",
  },
  emptyDesc: {
    textAlign: "center",
    maxWidth: 260,
  },
});
