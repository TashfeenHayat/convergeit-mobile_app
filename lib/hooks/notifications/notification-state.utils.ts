import type { BadgeCounts, NotificationDto } from "@/services/notifications/notifications.types";

export const EMPTY_BADGES: BadgeCounts = {
  chat: 0,
  qa: 0,
  hrms_leave: 0,
  hrms_attendance: 0,
};

export function totalUnread(counts: BadgeCounts): number {
  return counts.chat + counts.qa + counts.hrms_leave + counts.hrms_attendance;
}

export function normalizeBadgeCounts(raw: unknown): BadgeCounts {
  if (!raw || typeof raw !== "object") return EMPTY_BADGES;
  const o = raw as Record<string, unknown>;
  return {
    chat: Number(o.chat ?? 0) || 0,
    qa: Number(o.qa ?? 0) || 0,
    hrms_leave: Number(o.hrms_leave ?? o.hrmsLeave ?? 0) || 0,
    hrms_attendance: Number(o.hrms_attendance ?? o.hrmsAttendance ?? 0) || 0,
  };
}

/** Keep socket-delivered unread rows when a stale REST list arrives empty. */
export function mergeNotificationItems(
  serverList: NotificationDto[],
  prev: NotificationDto[],
  unreadOnly: boolean,
): NotificationDto[] {
  const byId = new Map<string, NotificationDto>();
  for (const n of serverList) {
    if (n?.id) byId.set(n.id, n);
  }
  if (unreadOnly) {
    for (const n of prev) {
      if (!n?.id || n.readAt) continue;
      if (!byId.has(n.id)) byId.set(n.id, n);
    }
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function upsertNotificationItem(
  prev: NotificationDto[],
  incoming: NotificationDto,
): NotificationDto[] {
  if (!incoming?.id) return prev;
  const filtered = prev.filter((n) => n.id !== incoming.id);
  return [incoming, ...filtered];
}
