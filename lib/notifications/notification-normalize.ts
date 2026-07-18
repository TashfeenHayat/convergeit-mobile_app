import type {
  BadgeCounts,
  NotificationBadgeGroup,
  NotificationDto,
} from "@/services/notifications/notifications.types";
import {
  EMPTY_BADGES,
  mergeNotificationItems,
  normalizeBadgeCounts,
  totalUnread,
  upsertNotificationItem,
} from "@/lib/hooks/notifications/notification-state.utils";

export {
  EMPTY_BADGES,
  mergeNotificationItems,
  normalizeBadgeCounts,
  totalUnread,
  upsertNotificationItem,
};

const BADGE_GROUPS: NotificationBadgeGroup[] = [
  "chat",
  "qa",
  "hrms_leave",
  "hrms_attendance",
];

export function conversationIdFromNotification(n: NotificationDto): string | null {
  const p = n.payload;
  if (!p || typeof p !== "object") return null;
  const cid = p.conversationId ?? p.conversation_id;
  return typeof cid === "string" && cid.trim() ? cid.trim() : null;
}

export function normalizeNotificationDto(raw: unknown): NotificationDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id.trim() : "";
  const title = typeof o.title === "string" ? o.title.trim() : "";
  if (!id || !title) return null;

  const rawGroup = String(o.badgeGroup ?? o.badge_group ?? "chat").trim();
  const badgeGroup = (
    BADGE_GROUPS.includes(rawGroup as NotificationBadgeGroup)
      ? rawGroup
      : "chat"
  ) as NotificationBadgeGroup;

  const payload =
    o.payload && typeof o.payload === "object" && !Array.isArray(o.payload)
      ? (o.payload as Record<string, unknown>)
      : null;

  return {
    id,
    type: String(o.type ?? "unknown"),
    badgeGroup,
    soundKey:
      typeof o.soundKey === "string"
        ? (o.soundKey as NotificationDto["soundKey"])
        : typeof o.sound_key === "string"
          ? (o.sound_key as NotificationDto["soundKey"])
          : null,
    title,
    body: typeof o.body === "string" ? o.body : null,
    href: typeof o.href === "string" ? o.href : null,
    payload,
    readAt:
      typeof o.readAt === "string"
        ? o.readAt
        : typeof o.read_at === "string"
          ? o.read_at
          : null,
    createdAt:
      typeof o.createdAt === "string"
        ? o.createdAt
        : typeof o.created_at === "string"
          ? o.created_at
          : new Date().toISOString(),
  };
}

export function normalizeNotificationItems(raw: unknown): NotificationDto[] {
  if (!Array.isArray(raw)) return [];
  const out: NotificationDto[] = [];
  for (const row of raw) {
    const dto = normalizeNotificationDto(row);
    if (dto) out.push(dto);
  }
  return coalesceChatNotificationList(out);
}

/** One unread chat row per conversation (newest preview wins). */
export function coalesceChatNotificationList(items: NotificationDto[]): NotificationDto[] {
  const chatLatest = new Map<string, NotificationDto>();
  const rest: NotificationDto[] = [];

  for (const n of items) {
    if (n.badgeGroup !== "chat") {
      rest.push(n);
      continue;
    }
    const cid = conversationIdFromNotification(n);
    if (!cid) {
      rest.push(n);
      continue;
    }
    const prev = chatLatest.get(cid);
    if (
      !prev ||
      new Date(n.createdAt).getTime() > new Date(prev.createdAt).getTime()
    ) {
      chatLatest.set(cid, n);
    }
  }

  return [...rest, ...chatLatest.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function countsFromUnreadItems(items: NotificationDto[]): BadgeCounts {
  const coalesced = coalesceChatNotificationList(items);
  const counts: BadgeCounts = { chat: 0, qa: 0, hrms_leave: 0, hrms_attendance: 0 };
  for (const n of coalesced) {
    if (n.readAt) continue;
    if (n.badgeGroup in counts) {
      counts[n.badgeGroup as keyof BadgeCounts] += 1;
    }
  }
  return counts;
}

/** Prefer server counts; fall back to coalesced list counts when server is ahead. */
export function reconcileBadgeCounts(
  serverCounts: BadgeCounts,
  items: NotificationDto[],
): BadgeCounts {
  const fromItems = countsFromUnreadItems(items);
  return {
    chat: Math.max(serverCounts.chat, fromItems.chat),
    qa: Math.max(serverCounts.qa, fromItems.qa),
    hrms_leave: Math.max(serverCounts.hrms_leave, fromItems.hrms_leave),
    hrms_attendance: Math.max(serverCounts.hrms_attendance, fromItems.hrms_attendance),
  };
}

export function upsertConversationNotification(
  prev: NotificationDto[],
  incoming: NotificationDto,
  conversationId?: string | null,
): NotificationDto[] {
  const cid = conversationId?.trim() || conversationIdFromNotification(incoming);
  let next = upsertNotificationItem(prev, incoming);
  if (!cid) return next;

  const dupes = next.filter(
    (n) =>
      n.id !== incoming.id &&
      !n.readAt &&
      n.badgeGroup === "chat" &&
      conversationIdFromNotification(n) === cid,
  );
  if (!dupes.length) return next;
  const dupeIds = new Set(dupes.map((n) => n.id));
  next = next.filter((n) => !dupeIds.has(n.id));
  return next;
}
