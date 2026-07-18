/**
 * Validates `next` (post-login / post-gate redirect) to prevent open redirects.
 * Only same-app paths starting with `/dashboard` are allowed.
 */
export function parseSafeDashboardNextPath(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== "string") return null;
  let decoded = raw.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return null;
  }
  if (!decoded.startsWith("/") || !decoded.startsWith("/dashboard")) return null;
  if (decoded.includes("//")) return null;
  if (decoded.includes("\\")) return null;
  return decoded;
}
