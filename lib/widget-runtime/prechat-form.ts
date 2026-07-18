import { z } from "zod";

export type PrechatFieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "select"
  | "checkbox";

export interface PrechatFieldDto {
  key: string;
  type?: PrechatFieldType | string;
  fieldType?: PrechatFieldType | string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
}

function slugFieldKey(label: string, index: number): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 48);
  return base || `field_${index + 1}`;
}

/** Normalize admin/API rows (`fieldKey`, `type`, etc.) into stable react-hook-form keys. */
export function normalizePrechatFields(raw: PrechatFieldDto[]): PrechatFieldDto[] {
  const out: PrechatFieldDto[] = [];
  const usedKeys = new Set<string>();

  raw.forEach((row, index) => {
    const o = row as PrechatFieldDto & { fieldKey?: string };
    const label = String(o.label ?? o.key ?? o.fieldKey ?? "").trim();
    const rawKey = String(o.key ?? "").trim();
    const rawFieldKey = String(o.fieldKey ?? "").trim();
    let key = rawKey || rawFieldKey;
    if (!key) key = slugFieldKey(label || "field", index);
    while (usedKeys.has(key)) {
      key = `${key}_${index + 1}`;
    }
    usedKeys.add(key);

    const placeholder =
      typeof o.placeholder === "string" && o.placeholder.trim()
        ? o.placeholder.trim()
        : undefined;

    out.push({
      ...o,
      key,
      label: label || key,
      type: o.type ?? o.fieldType ?? "text",
      fieldType: o.fieldType ?? o.type ?? "text",
      required: o.required === true,
      ...(placeholder ? { placeholder } : {}),
    });
  });

  return out;
}

function fieldKind(field: PrechatFieldDto): string {
  const raw = field.fieldType ?? field.type ?? "text";
  const low = String(raw).toLowerCase();
  if (low === "textarea") return "textarea";
  if (low === "email") return "email";
  if (low === "phone") return "phone";
  if (low === "select") return "select";
  if (low === "checkbox") return "checkbox";
  return "text";
}

const defaultVisitorFields: PrechatFieldDto[] = [
  { key: "name", type: "text", label: "Name", required: true },
  { key: "email", type: "email", label: "Email", required: false },
  { key: "phone", type: "phone", label: "Phone", required: false },
];

function formHasPrechatToggles(form: Record<string, unknown>): boolean {
  return (
    "prechatNameEnabled" in form ||
    "prechatEmailEnabled" in form ||
    "prechatPhoneEnabled" in form ||
    "prechatMessageEnabled" in form
  );
}

function boolFlag(v: unknown, defaultOn: boolean): boolean {
  if (v === false || v === "false" || v === 0) return false;
  if (v === true || v === "true" || v === 1) return true;
  return defaultOn;
}

/** Build pre-chat fields from wizard `config.form` toggles (notifications step). */
function prechatFieldsFromFormFlags(form: Record<string, unknown>): PrechatFieldDto[] {
  if (!formHasPrechatToggles(form)) return [];

  const nameOn = boolFlag(form.prechatNameEnabled, true);
  const emailOn = boolFlag(form.prechatEmailEnabled, true);
  const phoneOn = boolFlag(form.prechatPhoneEnabled, false);
  const messageOn = boolFlag(form.prechatMessageEnabled, false);
  const messageRequired = boolFlag(form.prechatMessageRequired, false);

  const fields: PrechatFieldDto[] = [];
  if (nameOn) {
    fields.push({ key: "name", type: "text", label: "Name", required: true });
  }
  if (emailOn) {
    fields.push({ key: "email", type: "email", label: "Email", required: true });
  }
  if (phoneOn) {
    fields.push({ key: "phone", type: "phone", label: "Phone", required: false });
  }
  if (messageOn) {
    fields.push({
      key: "message",
      type: "textarea",
      label: "Message",
      required: messageRequired,
    });
  }
  return fields;
}

function isLegacyWizardPlaceholderFields(fields: PrechatFieldDto[]): boolean {
  if (fields.length !== 2) return false;
  const keys = new Set(fields.map((f) => f.key));
  return keys.has("company") && keys.has("topic");
}

/** Extract field list from nested widget configuration blobs. */
export function extractPrechatFieldsFromWidgetConfig(
  cfg: Record<string, unknown>,
): PrechatFieldDto[] {
  const form = cfg.form as Record<string, unknown> | undefined;
  const settingsJson = cfg.settingsJson as Record<string, unknown> | undefined;
  const nestedForm = settingsJson?.form as Record<string, unknown> | undefined;
  const formForFlags =
    nestedForm && typeof nestedForm === "object"
      ? nestedForm
      : form && typeof form === "object"
        ? form
        : null;

  const fromFlags = formForFlags ? prechatFieldsFromFormFlags(formForFlags) : [];
  if (fromFlags.length > 0) return normalizePrechatFields(fromFlags);

  const fromForm = Array.isArray(form?.fields)
    ? (form?.fields as PrechatFieldDto[])
    : null;
  const fromSettings = nestedForm?.fields ?? settingsJson?.preChatFields;
  const merged =
    Array.isArray(fromSettings) && fromSettings.length > 0
      ? fromSettings
      : fromForm;
  if (Array.isArray(merged) && merged.length > 0) {
    if (isLegacyWizardPlaceholderFields(merged as PrechatFieldDto[])) {
      return normalizePrechatFields(defaultVisitorFields);
    }
    return normalizePrechatFields(merged as PrechatFieldDto[]);
  }

  const rootFields = cfg.preChatFields;
  return normalizePrechatFields(
    Array.isArray(rootFields)
      ? (rootFields as PrechatFieldDto[])
      : defaultVisitorFields,
  );
}

/** Offline capture form — uses `config.offlineForm` toggles/fields when present. */
export function extractOfflineFormFieldsFromWidgetConfig(
  cfg: Record<string, unknown>,
): PrechatFieldDto[] {
  const offlineForm = cfg.offlineForm;
  if (offlineForm && typeof offlineForm === "object" && !Array.isArray(offlineForm)) {
    return extractPrechatFieldsFromWidgetConfig({
      ...cfg,
      form: offlineForm as Record<string, unknown>,
    });
  }
  return extractPrechatFieldsFromWidgetConfig(cfg);
}

/** React Hook Form + zod resolver schema for pre-chat intake. */
export function buildDynamicPrechatZod(
  fields: PrechatFieldDto[],
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  if (!fields.length) {
    return z.object({});
  }

  const shape: Record<string, z.ZodTypeAny> = {};
  for (const raw of fields) {
    const key = String(raw.key || "field").trim();
    const t = fieldKind(raw);
    let s: z.ZodTypeAny;
    switch (t) {
      case "email":
        s = raw.required
          ? z.string().min(1).email("Invalid email")
          : z
              .union([z.string().email("Invalid email"), z.literal("")])
              .optional();
        break;
      case "checkbox":
        s = raw.required
          ? z.boolean().refine((v) => v === true, { message: "Required" })
          : z.boolean().optional();
        break;
      case "select":
        s = raw.required ? z.string().min(1) : z.string().optional().or(z.literal(""));
        break;
      case "textarea":
      case "text":
      case "phone":
      default:
        s = raw.required
          ? z.string().min(1, "Required")
          : z.string().optional().or(z.literal(""));
        break;
    }
    shape[key] = s;
  }
  return z.object(shape);
}

/** Visitor object + synthesized first message for POST /chat/widget/conversations */
export function buildVisitorPayloadParts(
  values: Record<string, unknown>,
  fields: PrechatFieldDto[],
  sessionId: string,
  inquiryLabel?: string,
) {
  const nameCoerced = coerceField(values.name ?? values.Name, "") || "Guest";
  const email = coerceField(values.email ?? values.Email, "");
  const phone = coerceField(values.phone ?? values.Phone, "");
  let firstMessageTail = "";

  const orderedKeys = [...new Set(fields.map((f) => String(f.key)).filter(Boolean))];
  const lines: string[] = [];
  for (const key of orderedKeys) {
    if (["name", "email", "phone"].includes(key)) continue;
    const v = values[key];
    const label =
      fields.find((f) => f.key === key)?.label ?? fields.find((f) => f.key === key)?.key ?? key;
    lines.push(`${label}: ${formatValue(v)}`);
  }
  firstMessageTail = lines.join("\n");

  const messageField = coerceField(values.message ?? values.Message, "");
  const metaLines: string[] = [];
  if (inquiryLabel) metaLines.push(`Inquiry: ${inquiryLabel}`);
  metaLines.push(`Visitor: ${nameCoerced}`);
  if (email) metaLines.push(`Email: ${email}`);
  if (phone) metaLines.push(`Phone: ${phone}`);
  if (firstMessageTail) {
    for (const line of firstMessageTail.split("\n")) {
      if (line.trim()) metaLines.push(line);
    }
  }

  let firstMessage: string;
  if (messageField) {
    firstMessage = messageField;
    const meta = metaLines.join("\n");
    if (meta) firstMessage += `\n\n${meta}`;
  } else {
    firstMessage =
      metaLines.join("\n") || (inquiryLabel ? `Inquiry: ${inquiryLabel}` : "Chat started.");
  }

  return {
    visitor: {
      sessionId,
      name: nameCoerced,
      email: email || undefined,
      phone: phone || undefined,
    },
    firstMessage,
  };
}

const NAME_PLACEHOLDER_RE = /\{\{\s*(?:name|visitorName)\s*\}\}|\{\s*(?:name|visitorName)\s*\}/gi;

/** First assistant line after pre-chat — not an AI model reply to registration metadata. */
export function resolvePersonalizedAssistantWelcome(
  visitorName: string,
  template?: string | null,
): string {
  const name = visitorName.trim() || "there";
  const tpl = template?.trim();
  if (tpl) {
    const withName = tpl.replace(NAME_PLACEHOLDER_RE, name);
    return withName !== tpl ? withName : tpl;
  }
  return `Hi ${name}, how can I help you today? You can ask me anything.`;
}

/** True when content is the auto first message from pre-chat (name/email for DB), not a real chat turn. */
export function isPrechatBootstrapVisitorMessage(
  content: string,
  apiFirstMessage?: string | null,
): boolean {
  const t = content.trim();
  if (!t) return false;
  const api = apiFirstMessage?.trim();
  if (api && t === api) return true;
  if (/^Visitor:\s*.+/im.test(t) && /^Email:\s*\S+/im.test(t)) return true;
  if (/^Visitor:\s*.+/im.test(t) && /^Phone:\s*\S+/im.test(t) && !/\?/.test(t)) return true;
  return false;
}

/** Visitor bubble text in the transcript (readable; API `firstMessage` stays metadata-rich). */
export function buildVisitorTranscriptDisplay(
  values: Record<string, unknown>,
  fields: PrechatFieldDto[],
  inquiryLabel?: string,
): string {
  const messageField = coerceField(values.message ?? values.Message, "");
  if (messageField) return messageField;

  const name = coerceField(values.name ?? values.Name, "") || "Guest";
  const email = coerceField(values.email ?? values.Email, "");
  const phone = coerceField(values.phone ?? values.Phone, "");

  const extra: string[] = [];
  const orderedKeys = [...new Set(fields.map((f) => String(f.key)).filter(Boolean))];
  for (const key of orderedKeys) {
    if (["name", "email", "phone", "message", "Message"].includes(key)) continue;
    const v = values[key];
    const label =
      fields.find((f) => f.key === key)?.label ?? fields.find((f) => f.key === key)?.key ?? key;
    const formatted = formatValue(v);
    if (formatted) extra.push(`${label}: ${formatted}`);
  }

  const who = email ? `${name} (${email})` : phone ? `${name} (${phone})` : name;
  if (inquiryLabel) {
    return extra.length
      ? `Hi, I'm ${who}. Topic: ${inquiryLabel}\n${extra.join("\n")}`
      : `Hi, I'm ${who}. Topic: ${inquiryLabel}`;
  }
  return extra.length ? `Hi, I'm ${who}.\n${extra.join("\n")}` : `Hi, I'm ${who}.`;
}

function coerceField(v: unknown, fallback: string): string {
  if (typeof v === "boolean") return v ? "yes" : "";
  if (typeof v === "number") return String(v);
  return typeof v === "string" ? v.trim() : fallback;
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

export function buildDefaultFormValues(
  fields: PrechatFieldDto[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  fields.forEach((f) => {
    if (String(f.type || "").toLowerCase() === "checkbox")
      out[f.key] = false;
    else out[f.key] = "";
  });
  return out;
}
