import { isRecord, unwrapApiData, pickStr } from '@/lib/utils/core';

/** Pull a list array from common API envelopes. */
export function pickApiItems(payload: unknown): unknown[] {
  const data = unwrapApiData(payload);
  if (Array.isArray(data)) return data;
  if (!isRecord(data)) return [];
  for (const key of ['items', 'rows', 'results', 'data', 'departments', 'users', 'roles', 'pools', 'shifts']) {
    const v = data[key];
    if (Array.isArray(v)) return v;
  }
  return [];
}

export function pickApiTotal(payload: unknown, fallback = 0): number {
  const root = isRecord(payload) ? payload : null;
  const data = isRecord(unwrapApiData(payload)) ? (unwrapApiData(payload) as Record<string, unknown>) : root;
  if (!data) return fallback;
  for (const key of ['total', 'count', 'totalCount', 'recordsTotal']) {
    const n = Number(data[key]);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

export function rowIdName(item: unknown): { id: string; name: string } | null {
  if (!isRecord(item)) return null;
  const id = pickStr(item, ['id']);
  if (!id) return null;
  const name = pickStr(item, ['name', 'title', 'label']) || '—';
  return { id, name };
}
