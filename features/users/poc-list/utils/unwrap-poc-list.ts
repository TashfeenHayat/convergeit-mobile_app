import type { PocListRow } from '@/features/users/poc-list/types';

export function unwrapPocListItems(payload: unknown): PocListRow[] {
  const root = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
  const data =
    root?.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>) : root;
  const items = data?.items;
  if (!Array.isArray(items)) return [];
  return items
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null;
      const r = raw as Record<string, unknown>;
      const companyContactId = String(r.companyContactId ?? '').trim();
      if (!companyContactId) return null;
      return {
        companyContactId,
        resellerId: String(r.resellerId ?? '').trim(),
        resellerName: String(r.resellerName ?? '—').trim() || '—',
        parentCompanyId: String(r.parentCompanyId ?? '').trim(),
        parentCompanyName: String(r.parentCompanyName ?? '—').trim() || '—',
        childCompanyId: String(r.childCompanyId ?? '').trim(),
        childCompanyName: String(r.childCompanyName ?? '—').trim() || '—',
        userId: String(r.userId ?? '').trim(),
        pocName: String(r.pocName ?? '—').trim() || '—',
        pocEmail: String(r.pocEmail ?? '—').trim() || '—',
        designationTitle: String(r.designationTitle ?? '—').trim() || '—',
        departmentName: String(r.departmentName ?? '—').trim() || '—',
      };
    })
    .filter((x): x is PocListRow => x !== null);
}

export function matchesPocSearch(row: PocListRow, q: string): boolean {
  if (!q) return true;
  const hay = [
    row.resellerName,
    row.parentCompanyName,
    row.childCompanyName,
    row.pocName,
    row.pocEmail,
    row.designationTitle,
    row.departmentName,
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

export function pocInitials(name: string): string {
  const parts = name
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return 'P';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}
