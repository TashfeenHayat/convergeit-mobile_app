import {
  getRefreshToken,
  setTokenPair,
} from '@/api/storage/token-storage';
import type { ApiEnvelope, AuthTokenPair, LoginSuccessData } from '@/api/types/auth.types';
import { apiClient } from '@/api/http/axios-instance';

let refreshPromise: Promise<string> | null = null;

export async function refreshSessionWithStoredRefresh(): Promise<AuthTokenPair> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const { data } = await apiClient.post<
    AuthTokenPair | ApiEnvelope<AuthTokenPair | LoginSuccessData>
  >('/auth/refresh', { refreshToken });

  const root =
    typeof data === 'object' && data !== null && 'data' in data
      ? (data as ApiEnvelope<AuthTokenPair | LoginSuccessData>).data
      : (data as AuthTokenPair | LoginSuccessData);

  const tokenPair: AuthTokenPair = {
    accessToken: String(root.accessToken ?? '').trim(),
    refreshToken: String(root.refreshToken ?? '').trim(),
  };

  if (!tokenPair.accessToken || !tokenPair.refreshToken) {
    throw new Error('Invalid refresh response');
  }

  await setTokenPair(tokenPair);
  return tokenPair;
}

/** Single-flight refresh for concurrent 401s. */
export async function queueRequestUntilRefreshed(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshSessionWithStoredRefresh()
      .then((pair) => pair.accessToken)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function waitForSessionRefresh(): Promise<void> {
  if (refreshPromise) {
    await refreshPromise.catch(() => undefined);
  }
}
