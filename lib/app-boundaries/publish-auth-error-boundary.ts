import { retrySessionHydration } from "@/lib/auth/session-hydration-retry";
import { shouldSkipRemoteAuthHydration } from "@/lib/auth/auth-paths";
import { isAuthSessionTerminated } from "@/api/session/terminate-auth-session";
import { getRefreshToken } from "@/api/storage/auth-cookies";
import { classifyApiError } from "./classify-api-error";
import { dismissAppBoundary } from "./app-boundary-bus";
import { networkBoundary } from "./presets";
import { publishAppBoundary } from "./app-boundary-bus";

const authRetry = () => {
  void retrySessionHydration();
};

/** Shows the appropriate SaaS boundary modal for auth/session API failures. */
export function publishAuthErrorBoundary(error?: unknown): void {
  if (isAuthSessionTerminated()) return;

  if (typeof window !== "undefined") {
    if (shouldSkipRemoteAuthHydration(window.location.pathname)) {
      dismissAppBoundary("session_expired");
      return;
    }
  }

  if (error != null) {
    const classified = classifyApiError(error);
    if (classified.kind === "session_expired" && !getRefreshToken()) {
      dismissAppBoundary("session_expired");
      return;
    }
    if (classified.kind) {
      publishAppBoundary({
        kind: classified.kind,
        title: classified.title,
        description: classified.description,
        dedupeByKind: true,
        onRetry: classified.kind === "network" ? authRetry : undefined,
      });
      return;
    }
  }

  publishAppBoundary(
    networkBoundary({
      title: "Unable to verify session",
      description:
        "We could not reach the server to confirm your session. Check your connection and try again.",
      onRetry: authRetry,
    }),
  );
}
