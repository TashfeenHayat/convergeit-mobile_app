const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getRequiredError(value: string, label = 'This field'): string | null {
  return value.trim() ? null : `${label} is required.`;
}

export function getEmailValidationError(
  value: string,
  options: { required?: boolean; label?: string } = {},
): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return options.required ? `${options.label ?? 'Email'} is required.` : null;
  }
  if (trimmed.length > 255) return 'Email is too long.';
  if (!EMAIL_RE.test(trimmed)) return 'Enter a valid email address.';
  return null;
}

export function isEmailValid(value: string, options: { required?: boolean } = {}): boolean {
  return getEmailValidationError(value, options) === null;
}
