/** True when the current route is the main dashboard home (shows global search in header). */
export function isDashboardHomePath(pathname: string): boolean {
  const clean = pathname.split('?')[0]?.replace(/\/+$/, '') || '';
  return clean === '/home' || clean === '/' || clean === '';
}

export const DASHBOARD_HEADER_COMPACT_HEIGHT = 68;
export const DASHBOARD_HEADER_FULL_HEIGHT = 128;

export function dashboardHeaderBodyHeight(pathname: string): number {
  return isDashboardHomePath(pathname)
    ? DASHBOARD_HEADER_FULL_HEIGHT
    : DASHBOARD_HEADER_COMPACT_HEIGHT;
}
