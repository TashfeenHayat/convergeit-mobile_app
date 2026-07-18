/** Role names that grant the full permission catalog (platform operator). */

export const PLATFORM_ADMIN_ROLE_NAMES = ["Platform Admin", "SuperAdmin"] as const;



/** External admin scope → seeded global roles (see `external-admin-roles.ts` on API). */

export const RESELLER_ADMIN_ROLE_NAME = "Reseller Admin";

export const PARENT_COMPANY_ADMIN_ROLE_NAME = "Parent Company Admin";



export type InternalAdminScope = "standard" | "platform_admin";

export type ExternalAdminScope = "standard" | "parent_company" | "wide_reseller";



export function isPlatformAdminRoleName(name: string): boolean {

  const n = name.trim();

  return (PLATFORM_ADMIN_ROLE_NAMES as readonly string[]).includes(n);

}



export function isExternalAdminScope(scope: ExternalAdminScope): boolean {

  return scope === "parent_company" || scope === "wide_reseller";

}



export function externalScopeUsesWideReseller(scope: ExternalAdminScope): boolean {

  return scope === "wide_reseller";

}



function findRoleIdByName(

  roles: ReadonlyArray<{ value: string; label: string }>,

  roleName: string,

): string | null {

  const hit = roles.find((r) => r.label.trim() === roleName);

  return hit?.value ?? null;

}



export function findPlatformAdminRoleId(

  roles: ReadonlyArray<{ value: string; label: string }>,

): string | null {

  for (const name of PLATFORM_ADMIN_ROLE_NAMES) {

    const id = findRoleIdByName(roles, name);

    if (id) return id;

  }

  return null;

}



export function findResellerAdminRoleId(

  roles: ReadonlyArray<{ value: string; label: string }>,

): string | null {

  return findRoleIdByName(roles, RESELLER_ADMIN_ROLE_NAME);

}



export function findParentCompanyAdminRoleId(

  roles: ReadonlyArray<{ value: string; label: string }>,

): string | null {

  return findRoleIdByName(roles, PARENT_COMPANY_ADMIN_ROLE_NAME);

}



export function isExternalAdminRoleName(name: string): boolean {

  const n = name.trim();

  return n === RESELLER_ADMIN_ROLE_NAME || n === PARENT_COMPANY_ADMIN_ROLE_NAME;

}



export function resolveRoleIdForExternalAdminScope(

  scope: ExternalAdminScope,

  roles: ReadonlyArray<{ value: string; label: string }>,

): string | null {

  if (scope === "wide_reseller") return findResellerAdminRoleId(roles);

  if (scope === "parent_company") return findParentCompanyAdminRoleId(roles);

  return null;

}



/** First non-platform, non-external-admin role (for standard external staff). */

export function findDefaultStandardExternalRoleId(

  roles: ReadonlyArray<{ value: string; label: string }>,

): string | null {

  const hit = roles.find((r) => {

    const label = r.label.trim();

    return (

      !isPlatformAdminRoleName(label) && !isExternalAdminRoleName(label)

    );

  });

  return hit?.value ?? null;

}



export function resolveInternalAdminScope(

  roleId: string,

  roles: ReadonlyArray<{ value: string; label: string }>,

): InternalAdminScope {

  const role = roles.find((r) => r.value === roleId);

  if (role && isPlatformAdminRoleName(role.label)) return "platform_admin";

  return "standard";

}



export function resolveExternalAdminScope(

  roleId: string,

  roles: ReadonlyArray<{ value: string; label: string }>,

  wideResellerScope: boolean,

): ExternalAdminScope {

  const role = roles.find((r) => r.value === roleId);

  if (role?.label.trim() === RESELLER_ADMIN_ROLE_NAME) return "wide_reseller";

  if (role?.label.trim() === PARENT_COMPANY_ADMIN_ROLE_NAME) return "parent_company";

  if (wideResellerScope) return "wide_reseller";

  return "standard";

}


