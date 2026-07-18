import type { AppBoundaryPayload } from "./types";

export function sessionExpiredBoundary(
  overrides?: Partial<AppBoundaryPayload>,
): AppBoundaryPayload {
  return {
    kind: "session_expired",
    title: "Session expired",
    description: "For your security, sign in again to continue where you left off.",
    dismissible: false,
    dedupeByKind: true,
    ...overrides,
  };
}

export function networkBoundary(overrides?: Partial<AppBoundaryPayload>): AppBoundaryPayload {
  return {
    kind: "network",
    title: "Connection problem",
    description:
      "We couldn't reach the server. Check your network or VPN, then try again.",
    dismissible: true,
    dedupeByKind: true,
    ...overrides,
  };
}

export function permissionDeniedBoundary(
  overrides?: Partial<AppBoundaryPayload>,
): AppBoundaryPayload {
  return {
    kind: "permission_denied",
    title: "Access denied",
    description:
      "You don't have permission to view this area. Ask an administrator to assign the right access.",
    dismissible: true,
    dedupeByKind: true,
    ...overrides,
  };
}
