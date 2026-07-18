/**
 * Session terminate for RN — clears tokens (web also redirects via window.location).
 * Wire `registerAuthSessionTeardown` from AuthProvider for navigation.
 */
import { clearImpersonationSession } from '@/lib/auth/impersonation-session';
import { getAuthSessionTeardown } from '@/api/session/auth-session-teardown';
import type { AuthSessionTeardownReason } from '@/api/session/auth-session-teardown';

let terminated = false;

export function isAuthSessionTerminated(): boolean {
  return terminated;
}

export async function terminateAuthSession(
  reason: AuthSessionTeardownReason | string = 'refresh_failed',
): Promise<void> {
  terminated = true;
  clearImpersonationSession();
  const { clearTokens } = await import('@/api/storage/token-storage');
  await clearTokens();
  const teardown = getAuthSessionTeardown();
  if (teardown) {
    await teardown({
      reason: reason as AuthSessionTeardownReason,
    });
  }
}

export function resetAuthSessionTerminatedFlag(): void {
  terminated = false;
}
