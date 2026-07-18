/**
 * Mobile root redirect helper (web uses Next.js redirect).
 * Expo Router auth groups handle unauthenticated redirects.
 */
export function redirectRootToLogin(): void {
  /* no-op — see app/(auth) + AuthProvider gate */
}
