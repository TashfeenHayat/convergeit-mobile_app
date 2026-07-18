import { decodeJwtExpMs } from "@/lib/widget-runtime/jwt-expiry";

/** Parse backend duration hints such as `7d`, `30m`, `3600`, or `604800`. */
export function parseAuthDurationToSec(value: string | null | undefined): number | null {
  if (value == null) return null;
  const raw = String(value).trim().toLowerCase();
  if (!raw) return null;

  if (/^\d+$/.test(raw)) {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  const match = raw.match(
    /^(\d+(?:\.\d+)?)\s*(ms|s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|wk|wks|week|weeks)$/,
  );
  if (!match) return null;

  const amount = Number.parseFloat(match[1] ?? "");
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const unit = match[2] ?? "";
  const multipliers: Record<string, number> = {
    ms: 0.001,
    s: 1,
    sec: 1,
    secs: 1,
    second: 1,
    seconds: 1,
    m: 60,
    min: 60,
    mins: 60,
    minute: 60,
    minutes: 60,
    h: 3600,
    hr: 3600,
    hrs: 3600,
    hour: 3600,
    hours: 3600,
    d: 86400,
    day: 86400,
    days: 86400,
    w: 604800,
    wk: 604800,
    wks: 604800,
    week: 604800,
    weeks: 604800,
  };

  const mult = multipliers[unit];
  if (!mult) return null;
  return Math.max(60, Math.floor(amount * mult));
}

/**
 * Cookie Max-Age should match JWT lifetime (or API `expiresIn`) so the browser
 * does not drop tokens before the issuer considers them valid.
 */
export function resolveTokenCookieMaxAgeSec(
  token: string,
  expiresInHint: string | null | undefined,
  fallbackSec: number,
): number {
  const fromHint = parseAuthDurationToSec(expiresInHint);

  const expMs = decodeJwtExpMs(token);
  if (expMs) {
    const remainingSec = Math.floor((expMs - Date.now()) / 1000);
    if (remainingSec > 60) {
      return Math.max(remainingSec, fromHint ?? fallbackSec);
    }
  }

  if (fromHint != null) return fromHint;

  return fallbackSec;
}
