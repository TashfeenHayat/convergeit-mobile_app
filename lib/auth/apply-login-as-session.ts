import type { LoginSuccessData } from "@/api";

/**
 * Lets login-as mutation apply impersonated user + permissions immediately
 * before optional `/auth/me` sync or navigation.
 */
let applyHandler: ((response: LoginSuccessData) => void) | null = null;

export function registerApplyLoginAsSession(
  handler: ((response: LoginSuccessData) => void) | null,
): void {
  applyHandler = handler;
}

export function requestApplyLoginAsSession(response: LoginSuccessData): void {
  applyHandler?.(response);
}
