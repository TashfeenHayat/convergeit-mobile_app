import type { EmailProviderFieldSchema } from "../types";

/** API may send `fieldKey`; UI and payloads use a single `key`. */
export function schemaFieldKey(field: Pick<EmailProviderFieldSchema, "key" | "fieldKey">): string {
  const k = (field.fieldKey ?? field.key)?.trim();
  return k || field.key;
}

export function normalizeProviderSchemaFields(
  fields: EmailProviderFieldSchema[],
): EmailProviderFieldSchema[] {
  return fields.map((field) => {
    const key = schemaFieldKey(field);
    return key === field.key ? field : { ...field, key };
  });
}
