import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { PERMISSION_BUCKET_OPERATIONAL, PERMISSION_BUCKET_PAGE, toPermissionSet } from "@/lib/auth/permissions-model";
import { getVisibleDashboardNavItems, type DashboardNavItem } from "@/lib/permissions";

/** Max unvisited module chips on the home dashboard (rest stay in the sidebar). */
export const DASHBOARD_UNVISITED_CHIP_LIMIT = 6;

export function useDashboardActivityNavItems(): DashboardNavItem[] {
  const { user, rbacEnabled, permissionsByType, isPlatformAdmin } = useAuth();
  const isDemoUser = user?.email?.trim().toLowerCase() === "demo@gmail.com";

  const pagePermissionSet = useMemo(
    () => toPermissionSet(permissionsByType?.[PERMISSION_BUCKET_PAGE]),
    [permissionsByType],
  );
  const operationalPermissionSet = useMemo(
    () => toPermissionSet(permissionsByType?.[PERMISSION_BUCKET_OPERATIONAL]),
    [permissionsByType],
  );

  return useMemo(
    () =>
      getVisibleDashboardNavItems({
        section: "activity",
        rbacEnabled,
        pagePermissionSet,
        operationalPermissionSet,
        isDemoUser,
        isPlatformAdmin,
        isInternalUser: user?.userType === "Internal",
        isPoolHead: user?.isPoolHead === true,
      }),
    [
      rbacEnabled,
      pagePermissionSet,
      operationalPermissionSet,
      isDemoUser,
      isPlatformAdmin,
      user?.userType,
      user?.isPoolHead,
    ],
  );
}
