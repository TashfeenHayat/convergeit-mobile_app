/**
 * RN auth form helpers (no react-hook-form — native controlled inputs).
 * Mirrors web message constants from converge_saas_frontend/lib/auth/auth-form-validation.
 */

export const AUTH_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AUTH_EMAIL_MESSAGES = {
  required: 'Email is required',
  invalid: 'Enter a valid email address',
} as const;

export const AUTH_PASSWORD_MESSAGES = {
  required: 'Password is required',
  minLength: 'Password must be at least 8 characters',
  mismatch: 'Passwords do not match',
} as const;

export const AUTH_OTP_MESSAGES = {
  required: 'Verification code is required',
  invalid: 'Enter the 6-digit code from your email',
} as const;

export type AuthFieldRule = {
  required?: string;
  minLength?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
};

export function getAuthEmailRules(): AuthFieldRule {
  return {
    required: AUTH_EMAIL_MESSAGES.required,
    pattern: {
      value: AUTH_EMAIL_REGEX,
      message: AUTH_EMAIL_MESSAGES.invalid,
    },
  };
}

export function getAuthPasswordRules(): AuthFieldRule {
  return {
    required: AUTH_PASSWORD_MESSAGES.required,
    minLength: { value: 8, message: AUTH_PASSWORD_MESSAGES.minLength },
  };
}

export function getAuthOtpRules(): AuthFieldRule {
  return {
    required: AUTH_OTP_MESSAGES.required,
    pattern: {
      value: /^\d{6}$/,
      message: AUTH_OTP_MESSAGES.invalid,
    },
  };
}

/** Validate email; returns error message or null. */
export function validateAuthEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return AUTH_EMAIL_MESSAGES.required;
  if (!AUTH_EMAIL_REGEX.test(trimmed)) return AUTH_EMAIL_MESSAGES.invalid;
  return null;
}

/** Validate password; returns error message or null. */
export function validateAuthPassword(value: string): string | null {
  if (!value) return AUTH_PASSWORD_MESSAGES.required;
  if (value.length < 8) return AUTH_PASSWORD_MESSAGES.minLength;
  return null;
}

/** Validate OTP; returns error message or null. */
export function validateAuthOtp(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return AUTH_OTP_MESSAGES.required;
  if (!/^\d{6}$/.test(trimmed)) return AUTH_OTP_MESSAGES.invalid;
  return null;
}
