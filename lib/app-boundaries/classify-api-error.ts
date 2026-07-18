import { isAxiosError } from "axios";
import { extractApiErrorMessageForToast } from "@/lib/notify";
import type { AppBoundaryKind } from "./types";

export type ClassifiedApiError = {
  kind: AppBoundaryKind | null;
  title: string;
  description: string;
  /** When true, global toast handler should still show a toast. */
  shouldToast: boolean;
};

function isBrowserOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/** True for offline, timeouts, and other non-auth transport failures. */
export function isTransientNetworkError(error: unknown): boolean {
  if (isBrowserOffline()) return true;

  if (isAxiosError(error)) {
    if (!error.response) {
      const code = error.code?.toUpperCase() ?? "";
      return code !== "ERR_CANCELED";
    }
    const status = error.response.status;
    if (status === 408 || status === 429 || (status >= 502 && status <= 504)) {
      return true;
    }
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("network error") ||
      msg.includes("timeout") ||
      msg.includes("failed to fetch")
    ) {
      return true;
    }
  }

  return false;
}

export function classifyApiError(error: unknown): ClassifiedApiError {
  if (isBrowserOffline()) {
    return {
      kind: "network",
      title: "You're offline",
      description: "Check your internet connection. We'll keep your work on this page when you're back online.",
      shouldToast: false,
    };
  }

  if (isAxiosError(error)) {
    if (!error.response) {
      const code = error.code?.toUpperCase() ?? "";
      if (code === "ERR_CANCELED" || code === "ECONNABORTED") {
        return {
          kind: null,
          title: "",
          description: "",
          shouldToast: false,
        };
      }
      return {
        kind: "network",
        title: "Connection problem",
        description:
          "We couldn't reach the server. Check your network or VPN, then try again.",
        shouldToast: false,
      };
    }

    const status = error.response.status;
    const apiMessage = extractApiErrorMessageForToast(error);

    if (status === 401) {
      return {
        kind: "session_expired",
        title: "Session expired",
        description: "For your security, sign in again to continue where you left off.",
        shouldToast: false,
      };
    }

    if (status === 403) {
      return {
        kind: "permission_denied",
        title: "Access denied",
        description:
          apiMessage ??
          "You don't have permission to perform this action. Ask an administrator to update your role.",
        shouldToast: false,
      };
    }

    if (status >= 500) {
      return {
        kind: "server_error",
        title: "Something went wrong on our side",
        description:
          apiMessage ??
          "Our servers hit a snag. Try again in a moment — if it keeps happening, contact support.",
        shouldToast: false,
      };
    }
  }

  return {
    kind: null,
    title: "",
    description: "",
    shouldToast: true,
  };
}
