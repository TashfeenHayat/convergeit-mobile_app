import { isAuthTransitionActive } from "@/lib/auth/auth-transition";
import { isImpersonatingSessionActive } from "@/lib/auth/impersonation-session";
import { isTransientNetworkError } from "@/lib/app-boundaries/classify-api-error";
import { refreshSessionWithStoredRefresh } from "./refresh-access-token";
import { terminateAuthSession } from "./terminate-auth-session";

export type RefreshAttemptResult = "ok" | "unreachable" | "invalid";

/**
 * Refresh tokens; never force-logout on transient network failures.
 */
export async function refreshSessionOrClassifyFailure(): Promise<RefreshAttemptResult> {
  try {
    await refreshSessionWithStoredRefresh();
    return "ok";
  } catch (firstErr) {
    if (isTransientNetworkError(firstErr)) {
      return "unreachable";
    }
    try {
      await new Promise((r) => setTimeout(r, 200));
      await refreshSessionWithStoredRefresh();
      return "ok";
    } catch (secondErr) {
      if (isTransientNetworkError(secondErr)) {
        return "unreachable";
      }
      if (!isAuthTransitionActive() && !isImpersonatingSessionActive()) {
        await terminateAuthSession("refresh_failed");
      }
      return "invalid";
    }
  }
}
