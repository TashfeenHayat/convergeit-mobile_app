import type {
  PocChildGroup,
  PocDirectoryTree,
  PocListRow,
  PocParentGroup,
  PocResellerGroup,
} from '@/features/users/poc-list/types';

function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export function buildPocDirectoryTree(rows: PocListRow[]): PocDirectoryTree {
  const resellerMap = new Map<
    string,
    {
      name: string;
      parents: Map<
        string,
        { name: string; children: Map<string, { name: string; contacts: PocListRow[] }> }
      >;
    }
  >();

  for (const row of rows) {
    const resellerKey = row.resellerId || row.resellerName;
    const parentKey = row.parentCompanyId || row.parentCompanyName;
    const childKey = row.childCompanyId || row.childCompanyName;

    if (!resellerMap.has(resellerKey)) {
      resellerMap.set(resellerKey, { name: row.resellerName, parents: new Map() });
    }
    const reseller = resellerMap.get(resellerKey)!;
    if (!reseller.parents.has(parentKey)) {
      reseller.parents.set(parentKey, { name: row.parentCompanyName, children: new Map() });
    }
    const parent = reseller.parents.get(parentKey)!;
    if (!parent.children.has(childKey)) {
      parent.children.set(childKey, { name: row.childCompanyName, contacts: [] });
    }
    parent.children.get(childKey)!.contacts.push(row);
  }

  const resellers: PocResellerGroup[] = sortByName(
    [...resellerMap.entries()].map(([id, reseller]) => {
      const parents: PocParentGroup[] = sortByName(
        [...reseller.parents.entries()].map(([parentId, parent]) => {
          const children: PocChildGroup[] = sortByName(
            [...parent.children.entries()].map(([childId, child]) => ({
              id: childId,
              name: child.name,
              contacts: child.contacts,
            })),
          );
          const pocCount = children.reduce((n, c) => n + c.contacts.length, 0);
          return { id: parentId, name: parent.name, children, pocCount };
        }),
      );
      const childCount = parents.reduce((n, p) => n + p.children.length, 0);
      const pocCount = parents.reduce((n, p) => n + p.pocCount, 0);
      return {
        id,
        name: reseller.name,
        parents,
        parentCount: parents.length,
        childCount,
        pocCount,
      };
    }),
  );

  return {
    resellers,
    totalPocs: rows.length,
  };
}

export function childExpandKey(resellerId: string, parentId: string, childId: string): string {
  return `${resellerId}::${parentId}::${childId}`;
}

export function collectExpandIdsForSearch(
  tree: PocDirectoryTree,
  search: string,
): { resellerIds: string[]; parentIds: string[]; childIds: string[] } {
  const q = search.trim().toLowerCase();
  if (!q) return { resellerIds: [], parentIds: [], childIds: [] };

  const resellerIds: string[] = [];
  const parentIds: string[] = [];
  const childIds: string[] = [];

  for (const reseller of tree.resellers) {
    let resellerMatch = reseller.name.toLowerCase().includes(q);
    for (const parent of reseller.parents) {
      let parentMatch = parent.name.toLowerCase().includes(q);
      for (const child of parent.children) {
        const childMatch = child.name.toLowerCase().includes(q);
        const contactMatch = child.contacts.some((c) =>
          [c.pocName, c.pocEmail, c.designationTitle, c.departmentName]
            .join(' ')
            .toLowerCase()
            .includes(q),
        );
        if (childMatch || contactMatch) {
          parentMatch = true;
          resellerMatch = true;
          childIds.push(childExpandKey(reseller.id, parent.id, child.id));
        }
      }
      if (parentMatch) {
        parentIds.push(`${reseller.id}::${parent.id}`);
        resellerMatch = true;
      }
    }
    if (resellerMatch) resellerIds.push(reseller.id);
  }

  return { resellerIds, parentIds, childIds };
}

export function formatChildPreview(children: PocChildGroup[], maxNames = 3): string {
  if (children.length === 0) return '';
  const names = children.slice(0, maxNames).map((c) => c.name);
  const rest = children.length - names.length;
  if (rest > 0) return `${names.join(' · ')} · +${rest} more`;
  return names.join(' · ');
}
