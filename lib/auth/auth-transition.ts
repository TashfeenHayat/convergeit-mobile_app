/** Suppresses forced logout while tokens/session are being swapped (login-as, revert). */
let transitionDepth = 0;
let transitionReason: string | null = null;

export function beginAuthTransition(reason = "auth-transition"): void {
  transitionDepth += 1;
  transitionReason = reason;
}

export function endAuthTransition(): void {
  transitionDepth = Math.max(0, transitionDepth - 1);
  if (transitionDepth === 0) {
    transitionReason = null;
  }
}

export function isAuthTransitionActive(): boolean {
  return transitionDepth > 0;
}

export function getAuthTransitionReason(): string | null {
  return transitionReason;
}
