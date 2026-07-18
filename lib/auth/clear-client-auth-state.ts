import { clearTokens } from "@/api/storage/auth-cookies";
import { clearImpersonationSession } from "./impersonation-session";

/** Wipes browser auth cookies and impersonation localStorage (client-only). */
export function clearClientAuthStorage(): void {
  clearImpersonationSession();
  clearTokens();
}
