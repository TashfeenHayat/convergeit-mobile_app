import { apiClient, getAccessToken, isAuthSessionTerminated } from "@/api";
import { isDashboardAccessToken } from "@/lib/auth/access-token";
import { unwrapSocketAckPayload } from "@/lib/hooks/chat/chat-socket-delivery";
import { unwrapChatHttpData } from "@/services/chat/http";
import type { BadgeCounts, NotificationDto, NotificationsListResponse } from "./notifications.types";
import {
  normalizeBadgeCounts as normalizeBadgeCountsInner,
} from "@/lib/hooks/notifications/notification-state.utils";
import {
  normalizeNotificationItems,
  reconcileBadgeCounts,
} from "@/lib/notifications/notification-normalize";
import {
  connectSharedNotifications,
  getSharedNotificationsSocket,
} from "./notificationsSocket";
import { isAxiosError } from "axios";

export type NotificationsSnapshot = {
  items: NotificationDto[];
  badgeCounts: BadgeCounts;
};

const EMPTY_BADGES: BadgeCounts = {
  chat: 0,
  qa: 0,
  hrms_leave: 0,
  hrms_attendance: 0,
};

const EMPTY_SNAPSHOT: NotificationsSnapshot = {
  items: [],
  badgeCounts: EMPTY_BADGES,
};

function canUseNotificationsApi(): boolean {
  const token = getAccessToken()?.trim();
  return Boolean(
    token && isDashboardAccessToken(token) && !isAuthSessionTerminated(),
  );
}

function isNotificationsUnauthorized(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 401;
}

async function withNotificationsAuth<T>(
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  if (!canUseNotificationsApi()) return fallback;
  try {
    return await fn();
  } catch (err) {
    if (isNotificationsUnauthorized(err)) return fallback;
    throw err;
  }
}

function parseNotificationsSnapshotPayload(raw: unknown): NotificationsSnapshot {
  const unwrapped = unwrapSocketAckPayload(raw);
  const data = unwrapChatHttpData<NotificationsListResponse | NotificationDto[]>(unwrapped);
  if (Array.isArray(data)) {
    const items = normalizeNotificationItems(data);
    return { items, badgeCounts: reconcileBadgeCounts(EMPTY_BADGES, items) };
  }
  const items = normalizeNotificationItems(data?.items ?? []);
  const badgeCounts = reconcileBadgeCounts(
    normalizeBadgeCountsInner(data?.badgeCounts),
    items,
  );
  return { items, badgeCounts };
}

async function ensureNotificationsSocketReady(): Promise<boolean> {
  const token = getAccessToken()?.trim();
  if (!token || !canUseNotificationsApi()) return false;
  connectSharedNotifications(token);
  const socket = getSharedNotificationsSocket();
  try {
    return await socket.waitUntilSocketReady(12_000);
  } catch {
    return false;
  }
}

async function fetchNotificationsSnapshotRest(params?: {
  unreadOnly?: boolean;
}): Promise<NotificationsSnapshot> {
  const { data } = await apiClient.get<unknown>("/notifications/me", {
    params: params?.unreadOnly ? { unreadOnly: "true" } : undefined,
  });
  return parseNotificationsSnapshotPayload(data);
}

export async function fetchNotificationsSnapshot(params?: {
  unreadOnly?: boolean;
}): Promise<NotificationsSnapshot> {
  return withNotificationsAuth(async () => {
    const ready = await ensureNotificationsSocketReady();
    const socket = getSharedNotificationsSocket();
    if (ready && socket.isConnected()) {
      try {
        const ack = await socket.fetchSnapshotWithAck(
          { unreadOnly: params?.unreadOnly !== false },
          15_000,
        );
        return parseNotificationsSnapshotPayload(ack);
      } catch {
        /* REST fallback below */
      }
    }
    return fetchNotificationsSnapshotRest(params);
  }, EMPTY_SNAPSHOT);
}

export async function fetchNotificationBadgeCounts(): Promise<BadgeCounts> {
  const snapshot = await fetchNotificationsSnapshot({ unreadOnly: true });
  return snapshot.badgeCounts;
}

export async function fetchMyNotifications(params?: {
  unreadOnly?: boolean;
}): Promise<NotificationDto[]> {
  const snapshot = await fetchNotificationsSnapshot(params);
  return snapshot.items;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await withNotificationsAuth(async () => {
    await apiClient.patch<unknown>(
      `/notifications/${encodeURIComponent(notificationId)}/read`,
      {},
    );
  }, undefined);
}

export async function markAllNotificationsRead(badgeGroup?: string): Promise<BadgeCounts> {
  return withNotificationsAuth(async () => {
    const { data } = await apiClient.post<unknown>("/notifications/me/mark-all-read", {}, {
      params: badgeGroup ? { badgeGroup } : undefined,
    });
    return parseBadgeCountsResponse(data);
  }, EMPTY_BADGES);
}

function parseBadgeCountsResponse(payload: unknown): BadgeCounts {
  const raw = unwrapChatHttpData<BadgeCounts | { badgeCounts?: BadgeCounts; counts?: BadgeCounts }>(
    payload,
  );
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (o.badgeCounts && typeof o.badgeCounts === "object") {
      return normalizeBadgeCounts(o.badgeCounts);
    }
    if (o.counts && typeof o.counts === "object") {
      return normalizeBadgeCounts(o.counts);
    }
    if ("chat" in o || "qa" in o || "hrms_leave" in o || "hrms_attendance" in o) {
      return normalizeBadgeCounts(o);
    }
  }
  return normalizeBadgeCounts(raw);
}

function normalizeBadgeCounts(raw: unknown): BadgeCounts {
  return normalizeBadgeCountsInner(raw);
}
