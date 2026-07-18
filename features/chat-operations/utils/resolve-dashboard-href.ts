/**
 * Agent dashboard links stored as SPA paths (preferred) or legacy absolute URLs.
 * RN has no `window.location.origin` — relative `/dashboard/...` paths are
 * resolved by the app router (`expo-router` `Link`/`router.push`) instead of
 * being turned into an absolute URL.
 */
export function resolveDashboardHref(href: string): string {
  return href.trim();
}
