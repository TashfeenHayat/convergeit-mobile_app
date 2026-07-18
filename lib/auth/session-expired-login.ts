import { AUTH_PATHS } from "./auth-paths";

export function sessionExpiredLoginHref(nextPath?: string | null): string {
  const params = new URLSearchParams({ session: "expired" });
  const safeNext = nextPath?.trim();
  if (safeNext) {
    params.set("next", safeNext);
  }
  return `${AUTH_PATHS.login}?${params.toString()}`;
}
