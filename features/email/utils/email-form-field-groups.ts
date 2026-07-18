import type { EmailFormFieldRow } from "@/api/email/email-forms.api";

export type EmailFormFieldGroup = {
  id: string;
  label: string;
  description: string;
  keys: readonly string[];
};

export const EMAIL_FORM_FIELD_GROUPS: readonly EmailFormFieldGroup[] = [
  {
    id: "visitor",
    label: "Visitor information",
    description: "Identity and session details from the chat visitor.",
    keys: [
      "name",
      "email",
      "phone",
      "company",
      "location",
      "timezone",
      "session_id",
    ],
  },
  {
    id: "chat",
    label: "Chat information",
    description: "Website, timing, agent, and chat identifiers.",
    keys: ["website", "chat_time", "agent", "duration", "chat_id"],
  },
  {
    id: "acquisition",
    label: "Acquisition",
    description: "Browser, device, source, and page context.",
    keys: [
      "browser",
      "os",
      "device",
      "ip",
      "visitor_id",
      "lead_source",
      "chat_origin",
      "referrer",
      "landing_page",
      "current_page",
      "session_started_at",
    ],
  },
  {
    id: "content",
    label: "Transcript & journey",
    description: "Transcript and journey auto-fill from chat.",
    keys: ["transcript", "journey"],
  },
] as const;

export function groupEmailFormFields(fields: EmailFormFieldRow[]): {
  group: EmailFormFieldGroup;
  fields: EmailFormFieldRow[];
}[] {
  const byKey = new Map(fields.map((f) => [f.fieldKey, f]));
  const used = new Set<string>();

  const grouped = EMAIL_FORM_FIELD_GROUPS.map((group) => {
    const rows = group.keys
      .map((key) => byKey.get(key))
      .filter((f): f is EmailFormFieldRow => Boolean(f));
    rows.forEach((f) => used.add(f.fieldKey));
    return { group, fields: rows };
  }).filter((g) => g.fields.length > 0);

  const remainder = fields.filter((f) => !used.has(f.fieldKey));
  if (remainder.length > 0) {
    grouped.push({
      group: {
        id: "other",
        label: "Other fields",
        description: "Additional configured fields.",
        keys: [],
      },
      fields: remainder,
    });
  }

  return grouped;
}
