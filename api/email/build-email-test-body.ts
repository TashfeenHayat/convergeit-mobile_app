import type { EmailTestBody } from "../types/email.types";

export function normalizeTestToEmail(value?: string | null): string | undefined {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || undefined;
}

/** Omit `toEmail` when blank so the API does not receive `""` or whitespace. */
export function buildEmailTestRequestBody(toEmail?: string | null): EmailTestBody {
  const email = normalizeTestToEmail(toEmail);
  return email ? { toEmail: email } : {};
}
