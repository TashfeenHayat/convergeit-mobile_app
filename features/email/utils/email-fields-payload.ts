import type { EmailProviderFieldSchema } from "../types";
import { MASKED_SECRET_VALUE } from "../email.constants";
import { schemaFieldKey } from "./schema-fields";

export function isMaskedSecret(value: string | undefined): boolean {
  return value === MASKED_SECRET_VALUE;
}

/** Password fields and common secret keys (e.g. apiKey) from form-schema. */
export function isSecretField(field: Pick<EmailProviderFieldSchema, "key" | "type">): boolean {
  if (field.type === "password") return true;
  return /api[_-]?key|secret|token|password|credential/i.test(schemaFieldKey(field));
}

/** Strip masked placeholders so inputs stay empty (“leave blank to keep”). */
export function normalizeFieldValuesForDisplay(
  values: Record<string, string>,
  schemaFields?: EmailProviderFieldSchema[],
): Record<string, string> {
  const out = { ...values };
  for (const [key, raw] of Object.entries(out)) {
    if (!isMaskedSecret(raw)) continue;
      const field = schemaFields?.find((f) => schemaFieldKey(f) === key);
    if (!field || isSecretField(field)) {
      out[key] = "";
    }
  }
  return out;
}

export function buildFieldsPayload(
  schemaFields: EmailProviderFieldSchema[],
  values: Record<string, string>,
  existing?: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of schemaFields) {
    const fk = schemaFieldKey(field);
    let next = values[fk]?.trim() ?? "";
    const prev = existing?.[fk];
    const secret = isSecretField(field);

    if (isMaskedSecret(next)) {
      next = "";
    }

    if (secret && !next && isMaskedSecret(prev)) {
      continue;
    }

    if (next) {
      out[fk] = next;
    }
  }
  return out;
}

/** Client-side required check before saving provider fields. */
export function validateRequiredMailFields(
  schemaFields: EmailProviderFieldSchema[],
  values: Record<string, string>,
  existing?: Record<string, string>,
): string | null {
  for (const field of schemaFields) {
    if (!field.required) continue;
    const fk = schemaFieldKey(field);
    let next = values[fk]?.trim() ?? "";
    if (isMaskedSecret(next)) next = "";
    const prev = existing?.[fk];
    const secret = isSecretField(field);
    if (secret && !next && isMaskedSecret(prev)) {
      continue;
    }
    if (!next) {
      return `${field.label} is required.`;
    }
  }
  return null;
}

export function secretFieldPlaceholder(
  field: EmailProviderFieldSchema,
  existing?: Record<string, string>,
): string | undefined {
  if (field.placeholder) return field.placeholder;
  if (isSecretField(field) && isMaskedSecret(existing?.[schemaFieldKey(field)])) {
    return "Leave blank to keep existing value";
  }
  return undefined;
}
