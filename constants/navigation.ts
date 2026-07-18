/**
 * Mobile app path helpers. Dashboard module tree lives in
 * `@/lib/permissions/dashboard-nav-tree` (same as web).
 */

export const AUTH_PATHS = {
  login: '/login',
  forgotPassword: '/forgot-password',
  verifyCode: '/verify-code',
  setPassword: '/set-password',
} as const;

export const APP_PATHS = {
  home: '/home',
  storybook: '/storybook',
} as const;

/**
 * Convert web `/dashboard/...` hrefs to Expo Router paths
 * (the `(dashboard)` group is omitted from the URL).
 */
export function webHrefToMobile(webHref: string): string {
  const clean = webHref.split('?')[0]?.replace(/\/+$/, '') || '/';
  if (clean === '/dashboard' || clean === '/') return APP_PATHS.home;
  if (clean.startsWith('/dashboard/')) {
    return `/${clean.slice('/dashboard/'.length)}`;
  }
  return clean;
}

/** Mobile pathname → comparable web-style path for nav active matching. */
export function mobilePathToWeb(pathname: string): string {
  const clean = pathname.split('?')[0]?.replace(/\/+$/, '') || '';
  if (clean === '/home' || clean === '/' || clean === '') return '/dashboard';
  if (clean.startsWith('/login') || clean.startsWith('/forgot') || clean.startsWith('/verify') || clean.startsWith('/set-password')) {
    return clean;
  }
  return `/dashboard${clean.startsWith('/') ? clean : `/${clean}`}`;
}
