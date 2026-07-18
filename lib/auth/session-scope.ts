import type { AuthUserType } from "./types";

export type SessionScopeUser = {
  userType?: AuthUserType;
  resellerId?: string | null;
  wideResellerScope?: boolean;
  parentCompanyId?: string | null;
};

export type UserListTypeFilter = "all" | "Internal" | "External";

export type SessionListFilterScope = {
  /** Platform internal or platform admin — may list/filter internal users. */
  mayPickInternal: boolean;
  /** Reseller / external portfolio sessions are external-only; platform may pick both. */
  mayPickExternal: boolean;
  /** Show reseller + parent-company scope controls in list filter panels. */
  showTenantScopeFilters: boolean;
  resellerPickerMode: "optional" | "locked" | "hidden";
  lockedResellerId: string | null;
  parentCompanyPickerMode: "optional" | "locked" | "hidden";
  lockedParentCompanyId: string | null;
  defaultUserTypeFilter: UserListTypeFilter;
};

/**
 * Explicit `resellerId` query filter — only platform admins (per Companies / Website Assignments APIs).
 * Reseller and tenant-scoped sessions use session scope via `GET /companies` or `GET /companies/by-reseller/{ownId}`.
 */
export function sessionCanFilterByResellerId(isPlatformAdmin: boolean): boolean {
  return isPlatformAdmin;
}

/** Resolved tenant reseller id for draft payloads (not for list `resellerId` filters). */
export function resolveSessionResellerId(
  userResellerId?: string | null,
  meResellerId?: string | null,
): string {
  return userResellerId?.trim() || meResellerId?.trim() || "";
}

function normalizeSessionScopeUser(
  sessionUser: AuthUserType | SessionScopeUser | null | undefined,
): SessionScopeUser | null {
  if (sessionUser == null) return null;
  if (typeof sessionUser === "string") {
    return { userType: sessionUser };
  }
  return sessionUser;
}

/**
 * List/filter panels: who may target **internal** users or org rows.
 * Internal reseller staff must not see Internal — backend rejects `userType=Internal` for reseller channel.
 */
export function sessionMayPickInternalUserScope(
  isPlatformAdmin: boolean,
  sessionUser?: AuthUserType | SessionScopeUser | null,
): boolean {
  return resolveSessionListFilterScope(isPlatformAdmin, sessionUser).mayPickInternal;
}

/**
 * Unified list-filter rules for Users, Departments, Shifts, HRMS pickers, etc.
 * Platform admin + SaaS internal: full filters. Reseller / external sessions: tenant-scoped external filters.
 */
export function resolveSessionListFilterScope(
  isPlatformAdmin: boolean,
  sessionUser?: AuthUserType | SessionScopeUser | null,
): SessionListFilterScope {
  const user = normalizeSessionScopeUser(sessionUser);
  const userType = user?.userType;
  const resellerId = user?.resellerId?.trim() || null;
  const parentCompanyId = user?.parentCompanyId?.trim() || null;
  const wideResellerScope = user?.wideResellerScope === true;

  const isInternalSaaS = userType === "Internal" && !resellerId;
  const isInternalReseller = userType === "Internal" && !!resellerId;
  const isExternalWide = userType === "External" && wideResellerScope && !!resellerId;
  const isExternalTenant = userType === "External" && !!resellerId && !wideResellerScope;

  if (isPlatformAdmin || isInternalSaaS) {
    return {
      mayPickInternal: true,
      mayPickExternal: true,
      showTenantScopeFilters: true,
      resellerPickerMode: "optional",
      lockedResellerId: null,
      parentCompanyPickerMode: "optional",
      lockedParentCompanyId: null,
      defaultUserTypeFilter: "all",
    };
  }

  if (isInternalReseller) {
    return {
      mayPickInternal: false,
      mayPickExternal: true,
      showTenantScopeFilters: true,
      resellerPickerMode: "locked",
      lockedResellerId: resellerId,
      parentCompanyPickerMode: "locked",
      lockedParentCompanyId: parentCompanyId,
      defaultUserTypeFilter: "External",
    };
  }

  if (isExternalWide) {
    return {
      mayPickInternal: false,
      mayPickExternal: true,
      showTenantScopeFilters: true,
      resellerPickerMode: "locked",
      lockedResellerId: resellerId,
      parentCompanyPickerMode: "optional",
      lockedParentCompanyId: null,
      defaultUserTypeFilter: "External",
    };
  }

  if (isExternalTenant) {
    return {
      mayPickInternal: false,
      mayPickExternal: true,
      showTenantScopeFilters: true,
      resellerPickerMode: "locked",
      lockedResellerId: resellerId,
      parentCompanyPickerMode: "locked",
      lockedParentCompanyId: parentCompanyId,
      defaultUserTypeFilter: "External",
    };
  }

  return {
    mayPickInternal: false,
    mayPickExternal: true,
    showTenantScopeFilters: false,
    resellerPickerMode: "hidden",
    lockedResellerId: null,
    parentCompanyPickerMode: "hidden",
    lockedParentCompanyId: null,
    defaultUserTypeFilter: "External",
  };
}

/**
 * May assign `wideResellerScope` / "Reseller admin" when creating external users or POC invites.
 * Parent-company–scoped external users must not see or set portfolio-wide access.
 */
export function sessionMayAssignWideResellerScope(
  isPlatformAdmin: boolean,
  sessionUserType: AuthUserType | undefined,
  wideResellerScope: boolean | undefined,
  resellerId: string | undefined | null,
): boolean {
  if (isPlatformAdmin) return true;
  const rid = resellerId?.trim();
  if (sessionUserType === "Internal" && rid) return true;
  if (sessionUserType === "External" && wideResellerScope === true && rid) {
    return true;
  }
  return false;
}

export function sessionShowPocDeptDesignationPickFromList(
  isPlatformAdmin: boolean,
  sessionUserType: AuthUserType | undefined,
  companySetupKind: "new_reseller" | "existing_reseller",
): boolean {
  if (companySetupKind !== "new_reseller") return true;
  if (!isPlatformAdmin) return true;
  if (sessionUserType === undefined) return true;
  return sessionUserType !== "Internal";
}

/**
 * Narrow client-root scope: reseller internal staff or external user without portfolio-wide access.
 * Matches backend `isNarrowResellerChannel`.
 */
export function sessionIsNarrowClientRootScope(
  isPlatformAdmin: boolean,
  user:
    | {
        userType?: AuthUserType;
        wideResellerScope?: boolean;
        resellerId?: string;
      }
    | null
    | undefined,
): boolean {
  if (isPlatformAdmin) return false;
  const rid = user?.resellerId?.trim();
  if (!rid) return false;
  if (user?.userType === "Internal") return true;
  if (user?.userType === "External" && user.wideResellerScope !== true) return true;
  return false;
}

export function resolveSessionParentCompanyId(
  userParentCompanyId?: string | null,
  jwtParentCompanyId?: string | null,
): string {
  return userParentCompanyId?.trim() || jwtParentCompanyId?.trim() || "";
}
