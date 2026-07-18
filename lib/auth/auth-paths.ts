/**
 * Single source of truth for auth UI URLs + post-login redirect.
 * Update here when routes change — also referenced by remote-hydration skip list.
 */
export const AUTH_PATHS = {
  login: "/auth/login",
  forgotPassword: "/auth/forgot-password",
  setPassword: "/auth/set-password",
  verifyCode: "/auth/verify-code",
} as const;

export type AuthPathValue = (typeof AUTH_PATHS)[keyof typeof AUTH_PATHS];

export const APP_PATHS = {
  /** Dashboard shell; prefer `resolveDashboardLandingHref` from `@/lib/permissions` for RBAC-aware entry. */
  dashboard: "/dashboard",
} as const;

/** Extra prefixes that skip `/auth/me` hydrate (not in `AUTH_PATHS`). */
const EXTRA_SKIP_REMOTE_AUTH_PREFIXES = ["/signup", "/chat/guest", "/embed"] as const;

/** Public embed iframe routes — no dashboard AuthProvider or login redirects. */
export function isEmbedAppPath(pathname: string): boolean {
  const path = pathname.trim() || "/";
  return path === "/embed" || path.startsWith("/embed/");
}

const SKIP_REMOTE_AUTH_PREFIXES: readonly string[] = [
  ...Object.values(AUTH_PATHS),
  ...EXTRA_SKIP_REMOTE_AUTH_PREFIXES,
];

/**
 * App routes where we should not call session sync, verify, or `/auth/me` on load.
 */
export function shouldSkipRemoteAuthHydration(pathname: string): boolean {
  const path = pathname.trim() || "/";
  return SKIP_REMOTE_AUTH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
