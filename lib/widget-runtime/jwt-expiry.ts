/** Best-effort read of JWT `exp` (seconds since epoch); no cryptographic verification. */
export function decodeJwtExpMs(token: string | null | undefined): number | null {
  if (token == null || typeof token !== "string") return null;
  const trimmed = token.trim();
  if (!trimmed) return null;

  const segments = trimmed.split(".");
  if (segments.length < 2 || typeof segments[1] !== "string") return null;

  try {
    if (typeof atob === "undefined") return null;
    const b64 = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json = atob(b64 + pad);
    const payload = JSON.parse(json) as { exp?: unknown };
    if (typeof payload.exp !== "number" || Number.isNaN(payload.exp))
      return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}
