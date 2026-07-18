import { AppState, type AppStateStatus } from 'react-native';
import { isAxiosError } from "axios";
import { getAccessToken, getRefreshToken } from "../storage/auth-cookies";
import type { AuthSessionSyncResult } from "../types/auth.types";
import { verifyBearer } from "../auth/auth.api";
import { isTransientNetworkError } from "@/lib/app-boundaries/classify-api-error";
import { isAuthTransitionActive } from "@/lib/auth/auth-transition";
import { isImpersonatingSessionActive } from "@/lib/auth/impersonation-session";
import { terminateAuthSession } from "./terminate-auth-session";
import { refreshSessionOrClassifyFailure } from "./refresh-session-guard";

function isUnauthorized(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 401;
}

/**
 * Validates the current session with the server and refreshes tokens when needed.
 */
export async function synchronizeAuthSession(): Promise<AuthSessionSyncResult> {
  const access = getAccessToken();
  const refresh = getRefreshToken();

  if (!access && !refresh) {
    return { status: "anonymous" };
  }

  let rotated = false;
  if (!access && refresh) {
    const outcome = await refreshSessionOrClassifyFailure();
    if (outcome === "unreachable") {
      return { status: "unreachable" };
    }
    if (outcome === "invalid") {
      return { status: "invalid" };
    }
    rotated = true;
  }

  try {
    await verifyBearer();
    return { status: rotated ? "refreshed" : "valid" };
  } catch (err: unknown) {
    if (!isUnauthorized(err)) {
      if (isTransientNetworkError(err)) {
        return { status: "unreachable", error: err };
      }
      return { status: "error", error: err };
    }

    const outcome = await refreshSessionOrClassifyFailure();
    if (outcome === "unreachable") {
      return { status: "unreachable" };
    }
    if (outcome === "invalid") {
      return { status: "invalid" };
    }

    try {
      await verifyBearer();
      return { status: "refreshed" };
    } catch (verifyErr: unknown) {
      if (isTransientNetworkError(verifyErr)) {
        return { status: "unreachable", error: verifyErr };
      }
      if (!isUnauthorized(verifyErr)) {
        return { status: "error", error: verifyErr };
      }
      if (!isAuthTransitionActive() && !isImpersonatingSessionActive()) {
        await terminateAuthSession("verify_failed");
      }
      return { status: "invalid" };
    }
  }
}

/**
 * Registers lightweight listeners so verify (+ refresh if needed) runs after
 * navigation restore and when the tab gains focus.
 */
export function attachAuthSessionLifecycleListeners(): () => void {
  let debounce: ReturnType<typeof setTimeout> | null = null;

  const schedule = () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      debounce = null;
      void synchronizeAuthSession();
    }, 250);
  };

  const onChange = (next: AppStateStatus) => {
    if (next === 'active') schedule();
  };

  const sub = AppState.addEventListener('change', onChange);
  return () => {
    sub.remove();
    if (debounce) clearTimeout(debounce);
  };
}
