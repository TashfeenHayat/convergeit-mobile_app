/**
 * Compatibility shim for web cookie helpers used by synced lib / api modules.
 * Tokens live in SecureStore (+ in-memory cache) via token-storage.
 */
export {
  getAccessToken,
  getRefreshToken,
  getTokenPair,
  hydrateTokenCache,
  AUTH_STORAGE_ACCESS as AUTH_COOKIE_ACCESS,
  AUTH_STORAGE_REFRESH as AUTH_COOKIE_REFRESH,
} from '@/api/storage/token-storage';

import {
  setTokenPair as persistTokenPair,
  clearTokens as clearPersistedTokens,
  getRefreshToken,
  getAccessToken as getAccess,
} from '@/api/storage/token-storage';
import type { AuthTokenPair } from '@/api/types/auth.types';
import { notifyAccessTokenChanged } from '@/lib/auth/access-token-events';

export type TokenCookieHints = {
  accessExpiresIn?: string | null;
  refreshExpiresIn?: string | null;
};

export async function clearTokens(): Promise<void> {
  await clearPersistedTokens();
  notifyAccessTokenChanged();
}

export async function setTokenPair(
  tokens: AuthTokenPair,
  _hints?: TokenCookieHints,
): Promise<void> {
  await persistTokenPair(tokens);
  notifyAccessTokenChanged();
}

export async function setAccessToken(
  accessToken: string,
  _hints?: TokenCookieHints | string | null,
): Promise<void> {
  const refresh = getRefreshToken();
  if (refresh) {
    await persistTokenPair({ accessToken, refreshToken: refresh });
    notifyAccessTokenChanged();
  }
}

export async function setRefreshToken(refreshToken: string): Promise<void> {
  const access = getAccess();
  if (access) {
    await persistTokenPair({ accessToken: access, refreshToken });
  }
}
