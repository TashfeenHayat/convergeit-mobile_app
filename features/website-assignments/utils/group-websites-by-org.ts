import type { WebsiteAssignmentScopeItem } from '@/api/types/website-assignments.types';

export type GroupedChildSection = {
  childCompanyId: string;
  childCompanyName: string;
  websites: WebsiteAssignmentScopeItem[];
};

export type GroupedParentSection = {
  parentCompanyId: string;
  parentCompanyName: string;
  resellerName: string;
  children: GroupedChildSection[];
};

/** Group flat website-assignment list items by parent company, then child company. */
export function groupWebsitesByParentChild(
  items: WebsiteAssignmentScopeItem[],
): GroupedParentSection[] {
  type ParentAcc = {
    parentCompanyId: string;
    parentCompanyName: string;
    resellerName: string;
    childMap: Map<string, GroupedChildSection>;
  };

  const parentMap = new Map<string, ParentAcc>();

  for (const w of items) {
    const pid = String(w.parentCompanyId ?? '').trim();
    const parentKey = pid || `__pn:${String(w.parentCompanyName ?? '').trim() || 'unknown'}`;

    if (!parentMap.has(parentKey)) {
      parentMap.set(parentKey, {
        parentCompanyId: pid,
        parentCompanyName: String(w.parentCompanyName ?? '').trim() || '—',
        resellerName: String(w.resellerName ?? '').trim() || '—',
        childMap: new Map(),
      });
    }
    const parent = parentMap.get(parentKey)!;

    const cid = String(w.childCompanyId ?? '').trim();
    const childKey = cid || `__cn:${String(w.childCompanyName ?? '').trim() || 'unknown'}`;

    if (!parent.childMap.has(childKey)) {
      parent.childMap.set(childKey, {
        childCompanyId: cid,
        childCompanyName: String(w.childCompanyName ?? '').trim() || '—',
        websites: [],
      });
    }
    parent.childMap.get(childKey)!.websites.push(w);
  }

  const collator = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' });

  return Array.from(parentMap.values())
    .map((p) => ({
      parentCompanyId: p.parentCompanyId,
      parentCompanyName: p.parentCompanyName,
      resellerName: p.resellerName,
      children: Array.from(p.childMap.values())
        .map((c) => ({
          ...c,
          websites: [...c.websites].sort((x, y) =>
            collator(String(x.name ?? ''), String(y.name ?? '')),
          ),
        }))
        .sort((a, b) => collator(a.childCompanyName, b.childCompanyName)),
    }))
    .sort((a, b) => collator(a.parentCompanyName, b.parentCompanyName));
}

export function sitesListHref(parentCompanyId: string, childCompanyId: string) {
  const p = parentCompanyId.trim() || 'none';
  const c = childCompanyId.trim() || '__none__';
  return `/website-assigning/sites/${encodeURIComponent(p)}/${encodeURIComponent(c)}`;
}
