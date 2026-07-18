import type {
  NotificationBadgeGroup,
  NotificationDto,
} from "@/services/notifications/notifications.types";

function pickPayloadId(
  payload: Record<string, unknown> | null | undefined,
  keys: string[],
): string | null {
  if (!payload || typeof payload !== "object") return null;
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

/** Normalize API href values into an in-app path (+ query). */
export function normalizeNotificationHref(href: string | null | undefined): string | null {
  if (!href?.trim()) return null;
  let path = href.trim();

  try {
    if (/^https?:\/\//i.test(path)) {
      const url = new URL(path);
      path = url.pathname + url.search + url.hash;
    }
  } catch {
    return null;
  }

  if (path.startsWith("dashboard/")) path = `/${path}`;
  if (!path.startsWith("/")) return null;

  if (
    path.startsWith("/hrms/scheduling") ||
    path.startsWith("/dashboard/hrms/scheduling")
  ) {
    const url = new URL(path.split("#")[0] || path, "http://local");
    const userId = url.searchParams.get("userId")?.trim();
    if (userId) {
      return `/dashboard/shifts/user-shift?userId=${encodeURIComponent(userId)}`;
    }
    return "/dashboard/shifts/user-shift";
  }

  return path;
}

function readConversationIdFromPath(path: string): string | null {
  const url = new URL(path, "http://local");
  const fromQuery =
    url.searchParams.get("conversationId") ??
    url.searchParams.get("conversation_id") ??
    url.searchParams.get("chatId") ??
    url.searchParams.get("chat_id");
  if (fromQuery?.trim()) return fromQuery.trim();

  const patterns = [
    /^\/dashboard\/qa\/inbox\/([^/?#]+)/,
    /^\/dashboard\/chat-qa\/([^/?#]+)/,
    /^\/dashboard\/chat-monitor\/([^/?#]+)/,
    /^\/dashboard\/chat-operations\/([^/?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = path.match(pattern);
    const segment = match?.[1]?.trim();
    if (segment && looksLikeUuid(segment)) return segment;
  }
  return null;
}

function withConversationOnChatOps(path: string, conversationId: string): string {
  const url = new URL(path.split("#")[0] || path, "http://local");
  url.pathname = "/dashboard/chat-operations";
  url.searchParams.set("conversationId", conversationId);
  return url.pathname + url.search;
}

function withConversationOnChatQa(conversationId: string): string {
  return `/dashboard/qa/inbox/${encodeURIComponent(conversationId)}`;
}

function withConversationOnChatMonitor(conversationId: string): string {
  return `/dashboard/chat-monitor/${encodeURIComponent(conversationId)}`;
}

function withLeaveId(path: string, leaveId: string): string {
  const url = new URL(path.split("#")[0] || path, "http://local");
  if (!url.searchParams.get("leaveId") && !url.searchParams.get("id")) {
    url.searchParams.set("leaveId", leaveId);
  }
  return url.pathname + url.search;
}

function applyContextToPath(
  path: string,
  ctx: {
    conversationId: string | null;
    leaveId: string | null;
    badgeGroup: NotificationBadgeGroup;
  },
): string {
  const conversationId =
    ctx.conversationId ?? readConversationIdFromPath(path);
  const { leaveId, badgeGroup } = ctx;

  if (path.startsWith("/dashboard/qa/inbox/")) return path;
  if (path.startsWith("/dashboard/chat-qa/")) {
    const id = readConversationIdFromPath(path);
    if (id) return withConversationOnChatQa(id);
    return path.replace("/dashboard/chat-qa", "/dashboard/qa/inbox");
  }
  if (path.startsWith("/dashboard/chat-monitor/")) return path;

  if (
    (path.startsWith("/dashboard/qa/inbox") || path.startsWith("/dashboard/chat-qa")) &&
    conversationId
  ) {
    return withConversationOnChatQa(conversationId);
  }

  if (path.startsWith("/dashboard/chat-monitor") && conversationId) {
    return withConversationOnChatMonitor(conversationId);
  }

  if (path.includes("/chat-operations")) {
    if (conversationId) return withConversationOnChatOps(path, conversationId);
    return "/dashboard/chat-operations";
  }

  if (leaveId && path.includes("/leave/")) {
    return withLeaveId(path, leaveId);
  }

  if (!conversationId) return path;

  if (badgeGroup === "qa") return withConversationOnChatQa(conversationId);
  if (badgeGroup === "chat") return withConversationOnChatOps(path, conversationId);

  return path;
}

function defaultPathForNotification(
  badgeGroup: NotificationBadgeGroup,
  conversationId: string | null,
  leaveId: string | null,
): string {
  if (badgeGroup === "chat") {
    if (conversationId) return withConversationOnChatOps("/dashboard/chat-operations", conversationId);
    return "/dashboard/chat-operations";
  }
  if (badgeGroup === "qa") {
    if (conversationId) return withConversationOnChatQa(conversationId);
    return "/dashboard/qa/inbox";
  }
  if (badgeGroup === "hrms_attendance") {
    return "/dashboard/attendance/team-attendance";
  }
  if (leaveId) return withLeaveId("/dashboard/leave/approval-inbox", leaveId);
  return "/dashboard/leave/approval-inbox";
}

/** Resolve where a notification should navigate in the dashboard. */
export function resolveNotificationHref(notification: NotificationDto): string | null {
  const conversationId = pickPayloadId(notification.payload, [
    "conversationId",
    "conversation_id",
    "chatId",
    "chat_id",
  ]);
  const leaveId = pickPayloadId(notification.payload, [
    "leaveId",
    "leave_id",
    "leaveApplicationId",
    "applicationId",
  ]);

  const normalized = normalizeNotificationHref(notification.href);
  if (normalized) {
    return applyContextToPath(normalized, {
      conversationId,
      leaveId,
      badgeGroup: notification.badgeGroup,
    });
  }

  return defaultPathForNotification(notification.badgeGroup, conversationId, leaveId);
}
