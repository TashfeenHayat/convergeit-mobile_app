export type AuthSessionTeardownReason = "verify_failed" | "refresh_failed" | "missing_tokens";

export type AuthSessionTeardownContext = {
  reason: AuthSessionTeardownReason;
};

export type AuthSessionTeardownHandler = (
  ctx: AuthSessionTeardownContext,
) => void | Promise<void>;

let teardownHandler: AuthSessionTeardownHandler | null = null;

export function registerAuthSessionTeardown(
  handler: AuthSessionTeardownHandler | null,
): void {
  teardownHandler = handler;
}

export function getAuthSessionTeardown(): AuthSessionTeardownHandler | null {
  return teardownHandler;
}
