import { useMemo } from 'react';

import { useAuth } from '@/lib/auth';
import { PERMISSION_BUCKET_OPERATIONAL, PERMISSION_BUCKET_PAGE, toPermissionSet } from '@/lib/auth/permissions-model';
import { getVisibleDashboardNavItems, type DashboardNavItem } from '@/lib/permissions';

const DASHBOARD_HOME: DashboardNavItem = {
  href: '/dashboard',
  label: 'Dashboard',
  section: 'activity',
  iconKey: 'dashboard',
  permission: null,
  prefixMatch: false,
};

/** Full sidebar tree (activity modules + always-visible footer links) for the drawer menu. */
export function useDashboardSidebarNavItems(): DashboardNavItem[] {
  const { user, rbacEnabled, permissionsByType, isPlatformAdmin } = useAuth();
  const isDemoUser = user?.email?.trim().toLowerCase() === 'demo@gmail.com';

  const pagePermissionSet = useMemo(
    () => toPermissionSet(permissionsByType?.[PERMISSION_BUCKET_PAGE]),
    [permissionsByType],
  );
  const operationalPermissionSet = useMemo(
    () => toPermissionSet(permissionsByType?.[PERMISSION_BUCKET_OPERATIONAL]),
    [permissionsByType],
  );

  return useMemo(() => {
    const visibility = {
      rbacEnabled,
      pagePermissionSet,
      operationalPermissionSet,
      isDemoUser,
      isPlatformAdmin,
      isInternalUser: user?.userType === 'Internal',
      isPoolHead: user?.isPoolHead === true,
    };

    const activity = getVisibleDashboardNavItems({
      section: 'activity',
      ...visibility,
    });

    const footer = getVisibleDashboardNavItems({
      section: 'footer',
      ...visibility,
    });

    const hasHome = activity.some((item) => item.href.replace(/\/+$/, '') === '/dashboard');
    const withHome = hasHome ? activity : [DASHBOARD_HOME, ...activity];
    return [...withHome, ...footer];
  }, [
    rbacEnabled,
    pagePermissionSet,
    operationalPermissionSet,
    isDemoUser,
    isPlatformAdmin,
    user?.userType,
    user?.isPoolHead,
  ]);
}
