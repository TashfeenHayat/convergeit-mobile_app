import type { TextUsFormFieldDraft } from "./widgetDraft";
import { textUsThemePreviewPayload } from "./text-us-design-json";

export const TEXT_US_FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "textarea", label: "Long text" },
] as const;

/** Built-in fields — keys are fixed; label and placeholder are editable. */
export const DEFAULT_TEXT_US_FORM_FIELDS: TextUsFormFieldDraft[] = [
  {
    key: "name",
    label: "Name",
    placeholder: "Your name",
    fieldType: "text",
    required: true,
  },
  {
    key: "email",
    label: "Email",
    placeholder: "you@company.com",
    fieldType: "email",
    required: true,
  },
  {
    key: "message",
    label: "Message",
    placeholder: "How can we help?",
    fieldType: "textarea",
    required: false,
  },
  {
    key: "phone",
    label: "Phone",
    placeholder: "+1 555 000 0000",
    fieldType: "phone",
    required: false,
  },
];

const DEFAULT_KEYS = new Set(DEFAULT_TEXT_US_FORM_FIELDS.map((f) => f.key));

export function isDefaultTextUsFieldKey(key: string): boolean {
  return DEFAULT_KEYS.has(key);
}

export function slugifyTextUsFieldKey(raw: string): string {
  const base = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 48);
  return base || "custom_field";
}

function normalizeCustomField(field: TextUsFormFieldDraft): TextUsFormFieldDraft | null {
  const key = slugifyTextUsFieldKey(field.key || field.label || "field");
  if (!key || DEFAULT_KEYS.has(key)) return null;
  const label = field.label?.trim() || key;
  const fieldType = String(field.fieldType || "text").toLowerCase();
  return {
    key,
    label,
    placeholder: field.placeholder?.trim() || "",
    fieldType,
    required: Boolean(field.required),
  };
}

/** Merge saved defaults + custom fields from draft. */
export function resolveTextUsFormFields(draft?: TextUsFormFieldDraft[]): TextUsFormFieldDraft[] {
  const saved = draft ?? [];
  const mergedDefaults = DEFAULT_TEXT_US_FORM_FIELDS.map((def) => {
    const match = saved.find((s) => s.key === def.key);
    if (!match) return { ...def };
    return {
      ...def,
      label: match.label?.trim() || def.label,
      placeholder: match.placeholder?.trim() || def.placeholder,
      required: match.required ?? def.required,
    };
  });

  const custom: TextUsFormFieldDraft[] = [];
  const used = new Set<string>(DEFAULT_KEYS);
  for (const row of saved) {
    const normalized = normalizeCustomField(row);
    if (!normalized || used.has(normalized.key)) continue;
    used.add(normalized.key);
    custom.push(normalized);
  }
  return [...mergedDefaults, ...custom];
}

function compactFieldRow(f: TextUsFormFieldDraft): Record<string, unknown> {
  const row: Record<string, unknown> = {
    key: f.key,
    label: f.label,
    type: String(f.fieldType).toLowerCase(),
    required: Boolean(f.required),
  };
  const ph = f.placeholder?.trim();
  if (ph) row.placeholder = ph;
  return row;
}

export function textUsFormFieldsPreviewPayload(
  fields: TextUsFormFieldDraft[],
): Record<string, unknown>[] {
  return resolveTextUsFormFields(fields).map(compactFieldRow);
}

/**
 * Persist under `theme.designJson.textUs.fields` (BOTH) or `config.form.fields` (TEXT_US-only).
 * Includes both `type` and `fieldType` so embed + admin hydrate agree.
 */
export function textUsFormFieldsToApiPayload(
  fields?: TextUsFormFieldDraft[],
): Record<string, unknown>[] {
  return resolveTextUsFormFields(fields).map((f) => {
    const type = String(f.fieldType ?? "text").toLowerCase();
    const row: Record<string, unknown> = {
      key: String(f.key),
      label: String(f.label ?? f.key),
      required: Boolean(f.required),
      type,
      fieldType: type,
    };
    const ph = f.placeholder?.trim();
    if (ph) row.placeholder = ph;
    return row;
  });
}

export function textUsSavedConfigPreview(input: {
  theme: Parameters<typeof textUsThemePreviewPayload>[0];
  fields: TextUsFormFieldDraft[];
}): Record<string, unknown> {
  return {
    textUs: textUsThemePreviewPayload(input.theme),
    form: {
      fields: textUsFormFieldsPreviewPayload(input.fields),
    },
  };
}

export function createEmptyCustomTextUsField(index: number): TextUsFormFieldDraft {
  const key = `custom_${index + 1}`;
  return {
    key,
    label: `Custom field ${index + 1}`,
    placeholder: "",
    fieldType: "text",
    required: false,
  };
}
