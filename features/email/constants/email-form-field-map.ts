import type { EmailTemplateBlockKey } from "./email-template-blocks";
import type { EmailBlockFieldDef } from "./email-block-fields";

/** Template block field key → email form catalog key (per-website Email forms). */
export const EMAIL_BLOCK_FIELD_TO_FORM_KEY: Partial<
  Record<EmailTemplateBlockKey, Partial<Record<string, string>>>
> = {
  visitor_info: {
    name: "name",
    email: "email",
    phone: "phone",
    company: "company",
    location: "location",
    timezone: "timezone",
    sessionId: "session_id",
  },
  chat_info: {
    website: "website",
    time: "chat_time",
    agent: "agent",
    duration: "duration",
    chatId: "chat_id",
  },
  acquisition: {
    browser: "browser",
    os: "os",
    device: "device",
    ip: "ip",
    visitorId: "visitor_id",
    leadSource: "lead_source",
    chatOrigin: "chat_origin",
    referrer: "referrer",
    landingPage: "landing_page",
    currentPage: "current_page",
    sessionStartedAt: "session_started_at",
  },
};

export const EMAIL_BLOCK_ALWAYS_INCLUDED: ReadonlySet<EmailTemplateBlockKey> = new Set([
  "additional_notes",
  "visitor_feedback",
  "footer",
]);

/** Whole template blocks gated by a single email form field. */
export const EMAIL_BLOCK_FORM_GATE_KEY: Partial<Record<EmailTemplateBlockKey, string>> = {
  transcript: "transcript",
  visitor_journey: "journey",
};

export function filterFieldsByEmailForm(
  blockKey: EmailTemplateBlockKey,
  catalog: EmailBlockFieldDef[],
  enabledFormFieldKeys?: ReadonlySet<string> | null,
): EmailBlockFieldDef[] {
  if (!enabledFormFieldKeys || enabledFormFieldKeys.size === 0) return catalog;
  const blockMap = EMAIL_BLOCK_FIELD_TO_FORM_KEY[blockKey];
  return catalog.filter((field) => {
    const formKey = blockMap?.[field.key];
    if (!formKey) return false;
    return enabledFormFieldKeys.has(formKey);
  });
}

export function isEmailBlockAllowedByForm(
  blockKey: EmailTemplateBlockKey,
  enabledFormFieldKeys?: ReadonlySet<string> | null,
): boolean {
  if (EMAIL_BLOCK_ALWAYS_INCLUDED.has(blockKey)) return true;
  if (!enabledFormFieldKeys) return true;
  const gate = EMAIL_BLOCK_FORM_GATE_KEY[blockKey];
  if (!gate) return true;
  return enabledFormFieldKeys.has(gate);
}
