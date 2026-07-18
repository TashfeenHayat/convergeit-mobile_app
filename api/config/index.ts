import { env } from '@/constants/env';

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  const raw = env.apiBaseUrl;
  if (!raw) {
    throw new Error(
      'EXPO_PUBLIC_API_BASE_URL is not set. Sync from web via npm run sync:env.',
    );
  }
  return normalizeBaseUrl(raw);
}

/** Fallback Max-Age (seconds) when JWT `exp` / API `expiresIn` are unavailable. */
export const ACCESS_TOKEN_FALLBACK_MAX_AGE_SEC = 60 * 60 * 24 * 7;
export const REFRESH_TOKEN_FALLBACK_MAX_AGE_SEC = 60 * 60 * 24 * 30;

/** Web-compatible aliases used by synced lib helpers. */
export const ACCESS_TOKEN_COOKIE_MAX_AGE_SEC = ACCESS_TOKEN_FALLBACK_MAX_AGE_SEC;
export const REFRESH_TOKEN_COOKIE_MAX_AGE_SEC = REFRESH_TOKEN_FALLBACK_MAX_AGE_SEC;
