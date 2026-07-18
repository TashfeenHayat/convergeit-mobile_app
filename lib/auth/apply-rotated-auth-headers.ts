import type { AuthTokenPair } from "@/api/types/auth.types";
import {
  getRefreshToken,
  setAccessToken,
  setTokenPair,
  type TokenCookieHints,
} from "@/api/storage/auth-cookies";
import { isAuthTransitionActive } from "@/lib/auth/auth-transition";

function readHeader(
  headers: Record<string, unknown> | undefined,
  name: string,
): string | null {
  if (!headers) return null;
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== lower) continue;
    if (typeof value === "string" && value.trim()) return value.trim();
    if (Array.isArray(value)) {
      const first = value.find((v) => typeof v === "string" && v.trim());
      if (typeof first === "string") return first.trim();
    }
  }
  return null;
}

/**
 * Backend JwtAuthGuard may rotate tokens on expired access JWT and return:
 * `X-Access-Token`, `X-Refresh-Token` (optional expiry hint headers).
 */
export function applyRotatedAuthHeaders(
  headers: Record<string, unknown> | undefined,
  options?: { allowDuringAuthTransition?: boolean },
): boolean {
  if (isAuthTransitionActive() && !options?.allowDuringAuthTransition) {
    return false;
  }

  const accessToken = readHeader(headers, "X-Access-Token");
  if (!accessToken) return false;

  const refreshToken = readHeader(headers, "X-Refresh-Token") ?? getRefreshToken() ?? "";
  if (!refreshToken.trim()) return false;

  const hints: TokenCookieHints = {
    accessExpiresIn: readHeader(headers, "X-Token-Expires-In"),
    refreshExpiresIn: readHeader(headers, "X-Refresh-Expires-In"),
  };

  const pair: AuthTokenPair = {
    accessToken,
    refreshToken: refreshToken.trim(),
  };

  void setTokenPair(pair, hints);
  return true;
}

/** Persist only a rotated access token when refresh token is unchanged. */
export function applyRotatedAccessHeaderOnly(
  headers: Record<string, unknown> | undefined,
): boolean {
  const accessToken = readHeader(headers, "X-Access-Token");
  if (!accessToken) return false;
  void setAccessToken(accessToken, readHeader(headers, "X-Token-Expires-In"));
  return true;
}
