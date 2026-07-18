import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dashboardHeaderBodyHeight } from '@/components/layout/dashboard/dashboard-header.utils';

const DashboardChromeContext = createContext(0);

export function DashboardChromeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const contentPaddingTop = useMemo(
    () => insets.top + dashboardHeaderBodyHeight(pathname) + 6,
    [insets.top, pathname],
  );

  return (
    <DashboardChromeContext.Provider value={contentPaddingTop}>{children}</DashboardChromeContext.Provider>
  );
}

/** Top inset for scroll content under the dashboard glass header. Zero outside the drawer layout. */
export function useDashboardChromeInset(): number {
  return useContext(DashboardChromeContext);
}
