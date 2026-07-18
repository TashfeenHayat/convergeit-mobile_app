/** Provider form fields hidden under Advanced (still saved on PUT). */
export const EMAIL_ADVANCED_FIELD_KEYS = new Set(["api_base_url"]);

export function isAdvancedEmailField(fieldKey: string): boolean {
  return EMAIL_ADVANCED_FIELD_KEYS.has(fieldKey);
}
