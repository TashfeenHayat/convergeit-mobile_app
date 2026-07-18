import type { LoginSuccessData } from "@/api";
import {
  extractIsPlatformAdmin,
  extractPermissionsByType,
  PERMISSION_BUCKET_PAGE,
  toPermissionSet,
} from "@/lib/auth/permissions-model";
import { getFirstAccessibleDashboardPath } from "@/lib/permissions";

const DASHBOARD_ROOT = "/dashboard";

/** Landing route after login-as — first page the impersonated user may access. */
export function resolveLoginAsDashboardHref(data: LoginSuccessData): string {
  const permissionsByType = extractPermissionsByType(data);
  const pagePermissionSet = toPermissionSet(permissionsByType?.[PERMISSION_BUCKET_PAGE]);
  const isPlatformAdmin = extractIsPlatformAdmin(data);
  const email = data.user?.email?.trim().toLowerCase() ?? "";
  const isDemoUser = email === "demo@gmail.com";

  return (
    getFirstAccessibleDashboardPath({
      rbacEnabled: true,
      pagePermissionSet,
      isDemoUser,
      isPlatformAdmin,
    }) ?? DASHBOARD_ROOT
  );
}
