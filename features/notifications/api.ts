import { apiClient } from '@/api/http/axios-instance';
import { unwrapApiData } from '@/lib/utils/core';

export type MobileNotification = {
  id: string;
  title: string;
  body: string;
  href?: string | null;
  readAt?: string | null;
  createdAt: string;
  badgeGroup?: string;
};

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeItems(raw: unknown): MobileNotification[] {
  const data = unwrapApiData(raw);
  const items = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)
      ? (data as { items: unknown[] }).items
      : [];

  return items
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item, index) => {
      const id = asString(item.id) || `n-${index}`;
      return {
        id,
        title: asString(item.title) || 'Notification',
        body: asString(item.body) || asString(item.message),
        href: asString(item.href) || null,
        readAt: asString(item.readAt) || null,
        createdAt: asString(item.createdAt) || new Date().toISOString(),
        badgeGroup: asString(item.badgeGroup) || undefined,
      };
    });
}

export async function fetchMyNotificationsRest(params?: {
  unreadOnly?: boolean;
}): Promise<MobileNotification[]> {
  const { data } = await apiClient.get('/notifications/me', {
    params: params?.unreadOnly ? { unreadOnly: 'true' } : undefined,
  });
  return normalizeItems(data);
}

export async function markNotificationReadRest(notificationId: string): Promise<void> {
  await apiClient.patch(`/notifications/${encodeURIComponent(notificationId)}/read`, {});
}

export async function markAllNotificationsReadRest(): Promise<void> {
  await apiClient.post('/notifications/me/mark-all-read', {});
}
