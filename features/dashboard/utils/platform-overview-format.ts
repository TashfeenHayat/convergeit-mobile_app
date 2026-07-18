import type { DashboardTrend } from '@/api/dashboard';
import type { AuditLogListItem } from '@/api/observability/observability-logs.types';

export function formatCount(value: number | undefined, loading: boolean): string {
  if (loading) return '—';
  if (typeof value !== 'number' || Number.isNaN(value)) return '0';
  return value.toLocaleString();
}

export function formatCurrency(
  value: number | undefined,
  currency: string,
  loading: boolean,
): string {
  if (loading) return '—';
  if (typeof value !== 'number' || Number.isNaN(value)) return `${currency} 0`;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}

export function trendSubtitle(trend: DashboardTrend | undefined, loading: boolean): string {
  if (loading) return 'Loading…';
  if (!trend) return 'No comparison data';
  const pct = trend.changePercent;
  if (pct == null) {
    return trend.previous === 0 && trend.current > 0
      ? 'New activity vs prior period'
      : 'No change from prior period';
  }
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}% vs prior period`;
}

/** Maps trend % into a 12–100 accent bar width for metric cards. */
export function trendAccentProgress(trend: DashboardTrend | undefined, loading: boolean): number {
  if (loading) return 40;
  const pct = trend?.changePercent;
  if (pct == null) return 48;
  return Math.max(12, Math.min(100, Math.round(Math.abs(pct) * 4 + 36)));
}

export type ActivityLogRow = {
  id: string;
  activityType: string;
  user: string;
  module: string;
  date: string;
  time: string;
};

export function mapAuditRow(item: AuditLogListItem): ActivityLogRow {
  const created = new Date(item.createdAt);
  const actorName = item.actor
    ? [item.actor.firstName, item.actor.lastName].filter(Boolean).join(' ').trim() ||
      item.actor.email
    : 'System';
  const moduleLabel = item.website?.name ?? item.website?.url ?? 'Platform';
  return {
    id: item.id,
    activityType: item.eventType.replace(/[._]/g, ' '),
    user: actorName,
    module: moduleLabel,
    date: new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }).format(created),
    time: new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(created),
  };
}
