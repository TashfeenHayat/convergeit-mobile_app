/**
 * Build-time public flags (NEXT_PUBLIC_* are inlined at compile time in the client bundle).
 */
export function isForgotPasswordOtpApiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_FORGOT_PASSWORD_API === "true";
}
