export const EMAIL_TEMPLATE_BLOCK_KEYS = [
  "visitor_info",
  "chat_info",
  "acquisition",
  "transcript",
  "additional_notes",
  "visitor_feedback",
  "visitor_journey",
  "footer",
] as const;

export type EmailTemplateBlockKey = (typeof EMAIL_TEMPLATE_BLOCK_KEYS)[number];
