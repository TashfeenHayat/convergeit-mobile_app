import type { UnknownRecord } from '@/lib/utils/core';
import { asRecord, pickArray } from '@/lib/users/user-list-rows';

export type PermissionOption = { code: string; label: string };
export type PermissionGroup = { title: string; permissions: PermissionOption[] };

function pickString(v: unknown): string {
  return v == null ? '' : String(v).trim();
}

function extractCatalogArray(payload: unknown): unknown[] {
  const root = asRecord(payload);
  if (!root) return [];
  if (Array.isArray(root.data)) return root.data;
  const nested = asRecord(root.data);
  if (nested && Array.isArray(nested.data)) return nested.data;
  return pickArray(payload, ['items', 'rows', 'results', 'permissions']);
}

function toPermissionOption(raw: unknown): PermissionOption | null {
  const r = asRecord(raw);
  if (!r) return null;
  const code = pickString(r.name ?? r.code ?? r.permissionName ?? r.permission ?? r.id);
  if (!code) return null;
  const label =
    pickString(r.description ?? r.label ?? r.title ?? r.displayName ?? r.name) || code;
  return { code, label };
}

export function extractPermissionsCatalogFlat(payload: unknown): PermissionOption[] {
  const items = extractCatalogArray(payload);
  return items
    .map(toPermissionOption)
    .filter((p): p is PermissionOption => p !== null)
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
}

/** Normalize `GET /access/permissions/catalog?groupByType=1` into OPERATIONAL / PAGE groups. */
export function extractPermissionsCatalogGroups(payload: unknown): PermissionGroup[] {
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const dataRec = data as UnknownRecord | null;
  const rootRec = root as UnknownRecord | null;
  const groupsRaw =
    (Array.isArray(dataRec?.groups) ? dataRec?.groups : null) ??
    (Array.isArray(rootRec?.groups) ? rootRec?.groups : null) ??
    null;

  if (groupsRaw) {
    const out: PermissionGroup[] = [];
    for (const g of groupsRaw as unknown[]) {
      const gr = asRecord(g);
      if (!gr) continue;
      const title = pickString(gr.title ?? gr.name ?? gr.type ?? 'Permissions');
      const list = Array.isArray(gr.permissions) ? (gr.permissions as unknown[]) : [];
      const permissions = list
        .map(toPermissionOption)
        .filter((p): p is PermissionOption => p !== null);
      if (permissions.length > 0) out.push({ title, permissions });
    }
    if (out.length > 0) return out;
  }

  const groupedObj =
    asRecord(dataRec?.permissionNamesByType) ??
    asRecord(dataRec?.permissionsByType) ??
    asRecord(dataRec?.grouped) ??
    asRecord(rootRec?.permissionNamesByType) ??
    asRecord(rootRec?.permissionsByType) ??
    asRecord(rootRec?.grouped) ??
    data;

  if (groupedObj && !Array.isArray(groupedObj)) {
    const out: PermissionGroup[] = [];
    for (const [k, v] of Object.entries(groupedObj)) {
      if (!Array.isArray(v)) continue;
      const permissions = (v as unknown[])
        .map(toPermissionOption)
        .filter((p): p is PermissionOption => p !== null)
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
      if (permissions.length === 0) continue;
      out.push({ title: pickString(k) || 'Permissions', permissions });
    }
    if (out.length > 0) {
      out.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
      return out;
    }
  }

  const items = extractCatalogArray(payload);
  const grouped = new Map<string, PermissionOption[]>();
  for (const item of items) {
    const r = asRecord(item);
    const option = toPermissionOption(item);
    if (!option) continue;
    const type = pickString(r?.permissionType) || 'Permissions';
    const list = grouped.get(type) ?? [];
    list.push(option);
    grouped.set(type, list);
  }

  const out = Array.from(grouped.entries())
    .map(([title, permissions]) => ({
      title,
      permissions: permissions.sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }),
      ),
    }))
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));

  if (out.length > 0) return out;

  const flat = extractPermissionsCatalogFlat(payload);
  return flat.length > 0 ? [{ title: 'Permissions', permissions: flat }] : [];
}

export function normalizePermissionGroupTitle(
  title: string,
): 'Page permissions' | 'Operational permissions' | 'Permissions' {
  const t = title.trim().toLowerCase();
  if (t === 'page' || t.includes('page')) return 'Page permissions';
  if (t === 'operational' || t.includes('operational')) return 'Operational permissions';
  return 'Permissions';
}
