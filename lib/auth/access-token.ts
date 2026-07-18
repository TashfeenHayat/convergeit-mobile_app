import { decodeJwtExpMs } from "@/lib/widget-runtime/jwt-expiry";

type JwtPayloadShape = {
  tokenType?: unknown;
  token_type?: unknown;
  type?: unknown;
  userId?: unknown;
  sub?: unknown;
  email?: unknown;
};

function decodeJwtPayload(token: string): JwtPayloadShape | null {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const segments = trimmed.split(".");
  if (segments.length < 2 || typeof segments[1] !== "string") return null;
  try {
    if (typeof atob === "undefined") return null;
    const b64 = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    return JSON.parse(atob(b64 + pad)) as JwtPayloadShape;
  } catch {
    return null;
  }
}

function readTokenType(payload: JwtPayloadShape | null): string {
  if (!payload) return "";
  const raw = payload.tokenType ?? payload.token_type ?? payload.type;
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

/** Widget embed JWT — must never be sent as dashboard Bearer auth. */
export function isWidgetSessionToken(token: string | null | undefined): boolean {
  if (!token?.trim()) return false;
  const tt = readTokenType(decodeJwtPayload(token));
  return tt.includes("widget");
}

/**
 * True for dashboard login JWTs. Accepts `tokenType: access`, legacy `Bearer`,
 * or user-shaped JWTs without an explicit type (backend may omit claim in payload).
 */
export function isDashboardAccessToken(token: string | null | undefined): boolean {
  if (!token?.trim()) return false;
  if (isWidgetSessionToken(token)) return false;

  const payload = decodeJwtPayload(token);
  if (!payload) return true;

  const tt = readTokenType(payload);
  if (tt === "access" || tt === "bearer") return true;
  if (tt === "refresh") return false;
  if (tt) return !tt.includes("widget");

  return Boolean(
    (typeof payload.userId === "string" && payload.userId.trim()) ||
      (typeof payload.sub === "string" && payload.sub.trim()) ||
      (typeof payload.email === "string" && payload.email.trim()),
  );
}

/** Refresh this many ms before JWT `exp` (also true when already expired). */
export function isAccessTokenExpiringSoon(
  token: string | null | undefined,
  skewMs = 300_000,
): boolean {
  const expMs = decodeJwtExpMs(token);
  if (!expMs) return false;
  return expMs - Date.now() <= skewMs;
}
