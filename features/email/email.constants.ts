import type { EmailProviderCode, EmailTemplateBlockKey } from "./types";

export const EMAIL_BASE_PATH = "/dashboard/email";

/** Top-level product area label in hub header + sidebar */
export const EMAIL_HUB_LABEL = "Email Configuration";

/** SMTP / transport subsection under Email Configuration */
export const EMAIL_SETUP_LABEL = "SMTP & mail";

export const EMAIL_BREADCRUMB = `Settings → ${EMAIL_HUB_LABEL}`;

/** @deprecated Use EMAIL_HUB_LABEL */
export const EMAIL_CONFIGURATION_LABEL = EMAIL_HUB_LABEL;

export const EMAIL_ROUTES = {
  home: EMAIL_BASE_PATH,
  setup: `${EMAIL_BASE_PATH}/setup`,
  setupReseller: `${EMAIL_BASE_PATH}/setup/reseller`,
  setupPlatform: `${EMAIL_BASE_PATH}/setup/platform`,
  setupAssignment: `${EMAIL_BASE_PATH}/setup/assignment`,
  setupTemplateAssignment: `${EMAIL_BASE_PATH}/setup/template-assignment`,
  design: `${EMAIL_BASE_PATH}/design`,
  designReseller: `${EMAIL_BASE_PATH}/design/reseller`,
  designPlatform: `${EMAIL_BASE_PATH}/design/platform`,
  designPlatformEditor: `${EMAIL_BASE_PATH}/design/platform/editor`,
  designAssignment: `${EMAIL_BASE_PATH}/design/assignment`,
  designResellerEdit: (resellerId: string) =>
    `${EMAIL_BASE_PATH}/design/reseller/${encodeURIComponent(resellerId.trim())}`,
  forms: `${EMAIL_BASE_PATH}/forms`,
  formsStandard: `${EMAIL_BASE_PATH}/forms/standard`,
  formsCustom: `${EMAIL_BASE_PATH}/forms/custom`,
  formsSet: `${EMAIL_BASE_PATH}/forms/set`,
  feedback: "/dashboard/feedback",
  /** Legacy paths — redirects */
  connection: `${EMAIL_BASE_PATH}/connection`,
  connectionReseller: `${EMAIL_BASE_PATH}/connection/reseller`,
  form: `${EMAIL_BASE_PATH}/form`,
} as const;

/** @deprecated Distribution moved to `/dashboard/distribution-setup` */
export const EMAIL_ROUTES_LEGACY_DISTRIBUTION = {
  distribution: "/dashboard/distribution-setup",
} as const;

export function resellerOwnMailEditPath(resellerId: string): string {
  return `${EMAIL_ROUTES.setupReseller}?edit=${encodeURIComponent(resellerId.trim())}`;
}

/** Matches API `maskSensitiveFields` placeholder for saved secrets. */
export const MASKED_SECRET_VALUE = "********";

export const EMAIL_RECOMMENDED_PROVIDER_CODE = "sendgrid_api";

export const PROVIDER_CODE_LABELS: Record<string, string> = {
  resend_api: "Resend",
  sendgrid_api: "SendGrid",
  sendgrid: "SendGrid",
  mailgun_api: "Mailgun",
  microsoft365: "Microsoft 365",
  custom_smtp: "Custom SMTP",
  smtp: "Custom SMTP",
};

export const PROVIDER_KIND_LABELS: Record<string, string> = {
  smtp: "SMTP",
  api: "API",
};

export const EMAIL_TEMPLATE_BLOCK_LABELS: Record<EmailTemplateBlockKey, string> = {
  visitor_info: "Visitor information",
  chat_info: "Chat information",
  acquisition: "Acquisition",
  transcript: "Chat transcript",
  additional_notes: "Additional notes",
  visitor_feedback: "Visitor feedback",
  visitor_journey: "Visitor journey",
  footer: "Footer",
};

export const EMAIL_TEMPLATE_BLOCK_DESCRIPTIONS: Record<EmailTemplateBlockKey, string> = {
  visitor_info: "Name, email, phone, company, location, and session fields.",
  chat_info: "Website, time, agent, duration, and chat ID.",
  acquisition: "Browser, device, IP, referrer, pages, and lead source.",
  transcript: "Full message history between visitor and agent.",
  additional_notes: "Gray notes box for agent wrap-up comments.",
  visitor_feedback: "Thumbs up / down rating prompt.",
  visitor_journey: "Numbered page URLs with timestamps.",
  footer: "Disclaimer bar at the bottom.",
};

export const EMAIL_TEMPLATE_BLOCK_ICON_KEYS: Record<EmailTemplateBlockKey, string> = {
  visitor_info: "person",
  chat_info: "forum",
  acquisition: "travel_explore",
  transcript: "chat",
  additional_notes: "notes",
  visitor_feedback: "feedback",
  visitor_journey: "route",
  footer: "info",
};

export const EMAIL_BRAND_COLOR_PRESETS = [
  "#1a57a5",
  "#2563eb",
  "#1e40af",
  "#0d9488",
  "#7c3aed",
  "#334155",
] as const;

export const DEFAULT_TEMPLATE_BLOCKS: EmailTemplateBlockKey[] = [
  "visitor_info",
  "chat_info",
  "acquisition",
  "transcript",
  "additional_notes",
  "visitor_feedback",
  "visitor_journey",
  "footer",
];

export const GMAIL_SMTP_TIP =
  "Use a Gmail App Password with Custom SMTP (host smtp.gmail.com, port 587, TLS).";
