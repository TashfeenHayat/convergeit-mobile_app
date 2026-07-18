import {
  hasPagePermission,
  isRbacActive,
  PAGE_PERMISSION_DASHBOARD,
  PERMISSION_BUCKET_PAGE,
  toPermissionSet,
  type PermissionsByType,
} from "@/lib/auth/permissions-model";
import type { DashboardNavItem, DashboardNavSection, RouteRule } from "./dashboard-nav.types";
import {
  getFirstDashboardPathSegment,
  PAGE_PERMISSION_ORDER,
  requiredPagePermissionFromDashboardSegment,
  ROUTE_RULES,
} from "./dashboard-route-table";

function getMatchingRouteRules(pathname: string): RouteRule[] {
  const matches = ROUTE_RULES.filter((rule) =>
    isNavPathSelected(pathname, rule.href, rule.prefixMatch),
  );
  if (matches.length === 0) return [];
  const maxLen = Math.max(...matches.map((m) => m.href.length));
  return matches.filter((m) => m.href.length === maxLen);
}
import { ALWAYS_VISIBLE_NAV_ITEMS, DASHBOARD_NAV_ITEMS } from "./dashboard-nav-tree";
import { canShowAgentInboxNav } from "./chat-access";
import { HRMS_MODULE_PAGE_PERMISSIONS, isHrmsProductPagePermission, PAGE } from "./permission-constants";

const AGENT_INBOX_NAV_HREF = "/dashboard/chat-operations";

function resellerHasHrmsProduct(pagePermissionSet: Set<string>): boolean {
  return HRMS_MODULE_PAGE_PERMISSIONS.some((p) => hasPagePermission(pagePermissionSet, p));
}

function navItemTouchesHrmsProduct(item: DashboardNavItem): boolean {
  if (item.permission && isHrmsProductPagePermission(item.permission)) return true;
  return (item.permissionsAny ?? []).some((p) => isHrmsProductPagePermission(p));
}

function hrmsProductNavAllowed(
  item: DashboardNavItem,
  pagePermissionSet: Set<string>,
): boolean {
  if (!navItemTouchesHrmsProduct(item)) return true;
  return resellerHasHrmsProduct(pagePermissionSet);
}

function isAgentInboxNavChild(item: DashboardNavItem): boolean {
  return (
    item.href === AGENT_INBOX_NAV_HREF ||
    item.permission === PAGE.CHAT_INBOX
  );
}

export function isNavPathSelected(
  pathname: string,
  href: string,
  prefixMatch?: boolean,
  extras?: { pathIncludes?: string; pathExcludes?: string[] },
): boolean {
  if (extras?.pathIncludes && pathname.includes(extras.pathIncludes)) return true;
  if (prefixMatch) {
    const matches = pathname === href || pathname.startsWith(`${href}/`);
    if (!matches) return false;
    if (extras?.pathExcludes?.some((ex) => pathname.includes(ex))) return false;
    return true;
  }
  return pathname === href;
}

export function getVisibleDashboardNavItems(opts: {
  section: DashboardNavSection;
  rbacEnabled: boolean;
  pagePermissionSet: Set<string>;
  operationalPermissionSet?: Set<string>;
  isDemoUser: boolean;
  /** When true with RBAC on, show the full module tree (same as RBAC off) — aligned with `useAuth().hasPage` bypass. */
  isPlatformAdmin?: boolean;
  isInternalUser?: boolean;
  isPoolHead?: boolean;
}): DashboardNavItem[] {
  const rbacFiltersNav = opts.rbacEnabled && !opts.isPlatformAdmin;
  const navPerms = {
    page: [...opts.pagePermissionSet],
    operational: [...(opts.operationalPermissionSet ?? [])],
    isPlatformAdmin: opts.isPlatformAdmin,
  };
  const agentInboxNavVisible = canShowAgentInboxNav(navPerms, {
    isPoolHead: opts.isPoolHead === true,
  });

  const itemVisible = (item: DashboardNavItem): boolean => {
    if (!rbacFiltersNav) {
      if (item.internalOnly && !opts.isInternalUser) return false;
      return true;
    }
    if (!hrmsProductNavAllowed(item, opts.pagePermissionSet)) return false;
    if (item.internalOnly && !opts.isInternalUser) return false;
    if (item.children?.length) {
      const any = item.permissionsAny;
      if (any?.length) {
        return any.some((p) => hasPagePermission(opts.pagePermissionSet, p));
      }
      return true;
    }
    if (item.permissionsAny?.length) {
      return item.permissionsAny.some((p) => hasPagePermission(opts.pagePermissionSet, p));
    }
    if (item.operationalAny?.length) {
      const ops = opts.operationalPermissionSet;
      if (!ops?.size) return false;
      if (!item.permission) {
        return item.operationalAny.some((p) => ops.has(p));
      }
      if (!hasPagePermission(opts.pagePermissionSet, item.permission)) return false;
      return item.operationalAny.some((p) => ops.has(p));
    }
    if (!item.permission) return true;
    return hasPagePermission(opts.pagePermissionSet, item.permission);
  };

  const permissionDriven = rbacFiltersNav
    ? DASHBOARD_NAV_ITEMS.filter(itemVisible)
    : DASHBOARD_NAV_ITEMS.filter((item) => !item.internalOnly || opts.isInternalUser);

  const withFilteredChildren = permissionDriven.map((item) => {
    if (!item.children?.length) return item;
    const children = item.children.filter((ch) => {
      if (!hrmsProductNavAllowed(ch, opts.pagePermissionSet)) return false;
      if (isAgentInboxNavChild(ch) && !agentInboxNavVisible) return false;
      if (!rbacFiltersNav) {
        if (ch.internalOnly && !opts.isInternalUser) return false;
        return true;
      }
      if (ch.internalOnly && !opts.isInternalUser) return false;
      if (ch.permission && hasPagePermission(opts.pagePermissionSet, ch.permission)) {
        if (isAgentInboxNavChild(ch) && !agentInboxNavVisible) return false;
        return true;
      }
      if (ch.permissionsAny?.length) {
        return ch.permissionsAny.some((p) => hasPagePermission(opts.pagePermissionSet, p));
      }
      if (ch.operationalAny?.length) {
        const ops = opts.operationalPermissionSet;
        if (!ops?.size) return false;
        if (ch.permission && !hasPagePermission(opts.pagePermissionSet, ch.permission)) return false;
        return ch.operationalAny.some((p) => ops.has(p));
      }
      if (!ch.permission) return true;
      return hasPagePermission(opts.pagePermissionSet, ch.permission);
    });
    return { ...item, children };
  });

  const withAlwaysVisible = [
    ...withFilteredChildren,
    ...ALWAYS_VISIBLE_NAV_ITEMS.filter((item) => item.section === opts.section),
  ];

  const dedupedByHref = Array.from(new Map(withAlwaysVisible.map((item) => [item.href, item])).values());

  return dedupedByHref.filter((item) => {
    if (item.section !== opts.section) return false;
    if (item.demoOnly && !opts.isDemoUser) return false;
    if (item.children?.length === 0) return false;
    return true;
  });
}

/** Depth-first sidebar order: parent-only hrefs (e.g. group rows) are skipped when they have children. */
function collectNavLeafHrefsInOrder(items: DashboardNavItem[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (item.children?.length) {
      out.push(...collectNavLeafHrefsInOrder(item.children));
    } else if (item.href?.trim()) {
      out.push(item.href);
    }
  }
  return out;
}

const PAGE_PERMISSION_ORDER_INDEX: ReadonlyMap<string, number> = new Map(
  PAGE_PERMISSION_ORDER.map((p, i) => [p, i]),
);

function sortPagePermissionsByNavOrder(perms: readonly string[]): string[] {
  return [...perms].sort(
    (a, b) =>
      (PAGE_PERMISSION_ORDER_INDEX.get(a) ?? Number.POSITIVE_INFINITY) -
      (PAGE_PERMISSION_ORDER_INDEX.get(b) ?? Number.POSITIVE_INFINITY),
  );
}

/**
 * Backend `page:*` keys that grant access to this pathname (OR semantics when multiple).
 * `null` means no page gate (always allowed under RBAC).
 */
export function getDashboardPathPageRequirements(pathname: string): readonly string[] | null {
  if (!pathname.startsWith("/dashboard")) return null;

  const publicRule = ALWAYS_VISIBLE_NAV_ITEMS.find((item) =>
    isNavPathSelected(pathname, item.href, item.prefixMatch),
  );
  if (publicRule) {
    return null;
  }

  const matches = ROUTE_RULES.filter((rule) => isNavPathSelected(pathname, rule.href, rule.prefixMatch));
  if (matches.length > 0) {
    const maxLen = Math.max(...matches.map((m) => m.href.length));
    const atMax = matches.filter((m) => m.href.length === maxLen);
    return sortPagePermissionsByNavOrder([...new Set(atMax.map((m) => m.permission))]);
  }
  const segment = getFirstDashboardPathSegment(pathname);
  if (!segment) {
    return [PAGE_PERMISSION_DASHBOARD];
  }
  return [requiredPagePermissionFromDashboardSegment(segment)];
}

/**
 * Primary `page:*` for this path (for logging / legacy callers). When several permissions
 * suffice (e.g. `/dashboard/companies`), returns the earliest in sidebar priority order.
 */
export function getRequiredPagePermission(pathname: string): string | null {
  const reqs = getDashboardPathPageRequirements(pathname);
  if (!reqs?.length) return null;
  return reqs[0] ?? null;
}

export function canAccessDashboardPath(opts: {
  pathname: string;
  rbacEnabled: boolean;
  pagePermissionSet: Set<string>;
  /** Matches `useAuth().hasPage` — full dashboard routes without enumerating `page:*` in the token. */
  isPlatformAdmin?: boolean;
  /** Platform internal staff (`userType === "Internal"`). Required for `internalOnly` routes. */
  isInternalUser?: boolean;
}): boolean {
  if (!opts.rbacEnabled) return true;
  if (opts.isPlatformAdmin) return true;
  const matchedRules = getMatchingRouteRules(opts.pathname);
  if (matchedRules.some((rule) => rule.internalOnly) && !opts.isInternalUser) {
    return false;
  }
  const reqs = getDashboardPathPageRequirements(opts.pathname);
  if (!reqs?.length) return true;
  const hrmsProductRoute = reqs.some((r) => isHrmsProductPagePermission(r));
  if (hrmsProductRoute && !resellerHasHrmsProduct(opts.pagePermissionSet)) return false;
  return reqs.some((r) => hasPagePermission(opts.pagePermissionSet, r));
}

const DASHBOARD_ROOT_PATH = "/dashboard";

function deprioritizeDashboardShell(hrefs: readonly string[]): string[] {
  const rest: string[] = [];
  const shell: string[] = [];
  const seen = new Set<string>();
  for (const href of hrefs) {
    const key = href.split("?")[0]?.replace(/\/+$/, "") || DASHBOARD_ROOT_PATH;
    if (seen.has(key)) continue;
    seen.add(key);
    if (key === DASHBOARD_ROOT_PATH) shell.push(href);
    else rest.push(href);
  }
  return [...rest, ...shell];
}

/** Preferred redirect target when current path is blocked or after sign-in. */
export function getFirstAccessibleDashboardPath(opts: {
  rbacEnabled: boolean;
  pagePermissionSet: Set<string>;
  operationalPermissionSet?: Set<string>;
  isDemoUser: boolean;
  isPlatformAdmin?: boolean;
  isInternalUser?: boolean;
}): string | null {
  const visible = getVisibleDashboardNavItems({
    section: "activity",
    rbacEnabled: opts.rbacEnabled,
    pagePermissionSet: opts.pagePermissionSet,
    operationalPermissionSet: opts.operationalPermissionSet,
    isDemoUser: opts.isDemoUser,
    isPlatformAdmin: opts.isPlatformAdmin,
    isInternalUser: opts.isInternalUser,
  });
  const candidates = deprioritizeDashboardShell(collectNavLeafHrefsInOrder(visible));
  for (const href of candidates) {
    if (
      canAccessDashboardPath({
        pathname: href,
        rbacEnabled: opts.rbacEnabled,
        pagePermissionSet: opts.pagePermissionSet,
        isPlatformAdmin: opts.isPlatformAdmin,
      })
    ) {
      return href;
    }
  }
  return null;
}

export function resolvePostAuthDashboardHref(_opts: {
  rbacEnabled: boolean;
  permissionsSyncing: boolean;
  pagePermissionSet: Set<string>;
  isPlatformAdmin: boolean;
  isDemoUser: boolean;
}): string {
  return DASHBOARD_ROOT_PATH;
}

export function resolveDashboardLandingHref(_opts: {
  permissionsByType: PermissionsByType | undefined;
  isPlatformAdmin: boolean;
  isDemoUser: boolean;
}): string {
  return DASHBOARD_ROOT_PATH;
}

/** Backward-compatible helper name used by older auth exports. */
export function getAccessibleDashboardHref(
  pagePermissionSet: Set<string>,
  opts?: { isPlatformAdmin?: boolean },
): string | null {
  return getFirstAccessibleDashboardPath({
    rbacEnabled: true,
    pagePermissionSet,
    isDemoUser: false,
    isPlatformAdmin: opts?.isPlatformAdmin,
  });
}

export { DASHBOARD_NAV_ITEMS } from "./dashboard-nav-tree";
