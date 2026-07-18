import type { DashboardNavItem } from "@/lib/permissions";
import { isNavPathSelected } from "@/lib/permissions";
import { safeLocalGet, safeLocalSet } from "@/lib/storage/safe-web-storage";

const STORAGE_PREFIX = "converge:dashboard-module-visits:";
const MAX_STORED_VISITS = 64;

export function dashboardModuleVisitsStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function readVisitedModuleHrefs(userId: string | undefined | null): Set<string> {
  if (!userId?.trim()) return new Set();

  try {
    const raw = safeLocalGet(dashboardModuleVisitsStorageKey(userId));
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((entry): entry is string => typeof entry === "string" && entry.length > 0));
  } catch {
    return new Set();
  }
}

export function writeVisitedModuleHrefs(userId: string, hrefs: Iterable<string>): void {
  const next = [...new Set(hrefs)].slice(-MAX_STORED_VISITS);
  safeLocalSet(dashboardModuleVisitsStorageKey(userId), JSON.stringify(next));
}

export function recordDashboardModuleVisit(userId: string, href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed) return false;

  const visited = readVisitedModuleHrefs(userId);
  if (visited.has(trimmed)) return false;

  visited.add(trimmed);
  writeVisitedModuleHrefs(userId, visited);
  return true;
}

export function navItemMatchesDashboardPath(item: DashboardNavItem, pathname: string): boolean {
  if (pathname === "/dashboard") return false;

  return isNavPathSelected(pathname, item.href, item.prefixMatch, {
    pathIncludes: item.pathIncludes,
    pathExcludes: item.pathExcludes,
  });
}

/** Map a dashboard pathname to the top-level activity nav module href, if any. */
export function resolveVisitedNavItemHref(
  pathname: string,
  items: readonly DashboardNavItem[],
): string | null {
  for (const item of items) {
    if (navItemMatchesDashboardPath(item, pathname)) {
      return item.href;
    }
  }
  return null;
}

export function partitionNavItemsByVisit(
  items: readonly DashboardNavItem[],
  visited: ReadonlySet<string>,
): { unvisited: DashboardNavItem[]; visited: DashboardNavItem[] } {
  const unvisited: DashboardNavItem[] = [];
  const seen: DashboardNavItem[] = [];

  for (const item of items) {
    if (visited.has(item.href)) {
      seen.push(item);
    } else {
      unvisited.push(item);
    }
  }

  return { unvisited, visited: seen };
}
