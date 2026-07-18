import { flattenPermissionCodes } from "./permission-constants";

export type PermissionChecker = {
  hasPage: (code: string) => boolean;
  hasOperational: (code: string) => boolean;
  isPlatformAdmin?: boolean;
};

export function hasAnyOperational(
  hasOperational: (code: string) => boolean,
  codes: readonly string[] | readonly (readonly string[])[],
): boolean {
  return flattenPermissionCodes(codes).some((c) => hasOperational(c));
}

export function hasPagePermission(
  hasPage: (code: string) => boolean,
  code: string,
  isPlatformAdmin = false,
): boolean {
  if (isPlatformAdmin) return true;
  return hasPage(code);
}

/**
 * Route / screen access: page gate AND (optional) any operational alternative.
 * Mirrors backend guards (page AND, operational OR).
 */
export function canAccessRoute(
  perms: PermissionChecker,
  page: string,
  operationalAlternatives: readonly string[] | readonly (readonly string[])[] = [],
): boolean {
  if (perms.isPlatformAdmin) return true;
  if (!perms.hasPage(page)) return false;
  const ops = flattenPermissionCodes(operationalAlternatives);
  if (ops.length === 0) return true;
  return hasAnyOperational(perms.hasOperational, ops);
}

export function hasPoolPage(hasPage: (code: string) => boolean): boolean {
  return hasPage("page:pool") || hasPage("page:pool-members") || hasPage("page:pool-heads");
}

export function hasDepartmentsPage(hasPage: (code: string) => boolean): boolean {
  return hasPage("page:departments");
}

export type AuthPermissionArrays = {
  page: readonly string[];
  operational: readonly string[];
  isPlatformAdmin?: boolean;
};

/**
 * Check expanded `/auth/me` permission arrays (page OR operational).
 * Do not client-expand role bundles — backend already did on `/auth/me`.
 */
export function canPermissionCode(
  code: string,
  perms: AuthPermissionArrays,
): boolean {
  if (perms.isPlatformAdmin) return true;
  const c = code.trim();
  if (!c) return false;
  return perms.page.includes(c) || perms.operational.includes(c);
}

export function createPermissionCan(perms: AuthPermissionArrays): (code: string) => boolean {
  return (code) => canPermissionCode(code, perms);
}
