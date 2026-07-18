import type { ApiEnvelope } from "./auth.types";

export type EmailProviderCode =
  | "sendgrid"
  | "sendgrid_api"
  | "microsoft365"
  | "smtp"
  | (string & {});

export type EmailFieldType = "text" | "password" | "number" | "select" | "boolean";

export interface EmailProviderFieldSchema {
  /** Canonical field id for PUT `fields` map (API may send `fieldKey` instead). */
  key: string;
  fieldKey?: string;
  label: string;
  type: EmailFieldType;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  helpText?: string;
  options?: { label: string; value: string }[];
}

export type EmailProviderKind = "smtp" | "api";

export interface EmailProvider {
  id: string;
  code: EmailProviderCode;
  name: string;
  description?: string;
  providerType?: EmailProviderKind;
  type?: EmailProviderKind;
}

export interface EmailProviderFormSchema {
  provider: EmailProvider;
  fields: EmailProviderFieldSchema[];
}

/** Platform + reseller own mail (GET/PUT). */
export interface MailProviderSettings {
  emailProviderId: string | null;
  fromEmail: string | null;
  fromName: string | null;
  isEnabled: boolean;
  fields: Record<string, string>;
  lastTestedAt?: string | null;
  lastTestStatus?: "success" | "failed" | null;
  lastTestMessage?: string | null;
  lastTestedBy?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  /** Present when API nests `emailProvider` on GET (not sent on PUT). */
  providerName?: string | null;
  providerCode?: string | null;
  providerKind?: EmailProviderKind | null;
}

export type PlatformEmailSettings = MailProviderSettings;
export type ResellerOwnMailSettings = MailProviderSettings;

export interface MailProviderSettingsBody {
  emailProviderId: string;
  fromEmail: string;
  fromName?: string;
  isEnabled?: boolean;
  fields: Record<string, string>;
}

export type PlatformEmailSettingsBody = MailProviderSettingsBody;
export type ResellerOwnMailSettingsBody = MailProviderSettingsBody;

export interface ResellerOwnMailListItem extends Record<string, unknown> {
  resellerId: string;
  resellerName: string;
  provider?: string | null;
  providerName?: string | null;
  providerCode?: string | null;
  emailProviderId?: string | null;
  fromEmail?: string | null;
  isEnabled: boolean;
  lastTestStatus?: "success" | "failed" | null;
  lastTestedAt?: string | null;
  lastTestMessage?: string | null;
}

export interface PlatformMailAssignment {
  resellerId?: string;
  fromEmail?: string | null;
  fromName?: string | null;
  isEnabled: boolean;
  updatedAt?: string | null;
  updatedBy?: string | null;
  emailProviderId?: string | null;
  providerName?: string | null;
  providerCode?: string | null;
  providerKind?: EmailProviderKind | null;
}

export interface PlatformMailAssignmentListItem extends Record<string, unknown> {
  id: string;
  resellerId: string;
  resellerName: string;
  fromEmail?: string | null;
  fromName?: string | null;
  isEnabled: boolean;
  emailProviderId?: string | null;
  providerName?: string | null;
  providerCode?: string | null;
  providerKind?: EmailProviderKind | null;
  lastTestStatus?: "success" | "failed" | null;
  lastTestedAt?: string | null;
  lastTestMessage?: string | null;
  updatedAt?: string | null;
}

export interface PlatformMailAssignmentBody {
  isEnabled?: boolean;
}

export interface EmailTestBody {
  toEmail?: string;
}

export interface EmailTestResult {
  success: boolean;
  message?: string;
  testedAt?: string;
}

export type EmailTemplateBlockKey =
  | "visitor_info"
  | "chat_info"
  | "acquisition"
  | "transcript"
  | "additional_notes"
  | "visitor_feedback"
  | "visitor_journey"
  | "footer";

export interface EmailTemplateBlock {
  blockKey: EmailTemplateBlockKey;
  enabled: boolean;
  sortOrder: number;
  styleJson?: Record<string, unknown> | null;
}

export type EmailTemplateThemeJson = Record<string, unknown>;

export interface EmailTemplateDraft {
  name: string;
  primaryColor?: string | null;
  themeJson?: EmailTemplateThemeJson | null;
  blocks: EmailTemplateBlock[];
  logoUrl?: string | null;
  bannerUrl?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  publishedAt?: string | null;
  id?: string;
  /** Live template source when GET published (effective). */
  source?: "platform" | "reseller";
  usesPlatformDefault?: boolean;
  templateMode?: "PLATFORM" | "OWN";
}

export interface EmailTemplateAssignment {
  resellerId: string;
  templateMode: "PLATFORM" | "OWN";
  usesPlatformDefault: boolean;
  hasCustomPublished: boolean;
  customPublishedAt?: string | null;
  assigned?: boolean;
}

export interface EmailTemplateDraftBody {
  name: string;
  primaryColor?: string;
  themeJson?: EmailTemplateThemeJson | null;
  blocks: EmailTemplateBlock[];
}

export interface EmailPreviewData {
  html: string;
}

export interface EmailTemplateVersionRow {
  id: string;
  name: string;
  primaryColor: string | null;
  publishedAt: string | null;
  isCurrent: boolean;
  isArchived: boolean;
  versionLabel: string;
  blockCount: number;
  publishedBy?: { id: string; displayName: string | null; email: string | null } | null;
}

export interface EmailTemplateVersionRestoreResult {
  restored: boolean;
  versionId: string;
  message: string;
}

export type EmailProvidersEnvelope = ApiEnvelope<EmailProvider[]>;
export type EmailProviderFormSchemaEnvelope = ApiEnvelope<EmailProviderFormSchema>;
export type PlatformEmailSettingsEnvelope = ApiEnvelope<PlatformEmailSettings>;
export type ResellerOwnMailSettingsEnvelope = ApiEnvelope<ResellerOwnMailSettings>;
export type ResellerOwnMailListEnvelope = ApiEnvelope<ResellerOwnMailListItem[]>;
export type PlatformMailAssignmentEnvelope = ApiEnvelope<PlatformMailAssignment>;
export type PlatformMailAssignmentListEnvelope = ApiEnvelope<PlatformMailAssignmentListItem[]>;
export type EmailTestResultEnvelope = ApiEnvelope<EmailTestResult>;
export type EmailTemplateDraftEnvelope = ApiEnvelope<EmailTemplateDraft>;
export type EmailPreviewEnvelope = ApiEnvelope<EmailPreviewData>;

/** Platform agent wrap-up feedback (rating + notes) for live chat / transcript flows. */
export interface PlatformAgentFeedbackSettings {
  id: string;
  ratingEnabled: boolean;
  goodLabel: string;
  poorLabel: string;
  ratingRequired: boolean;
  notesEnabled: boolean;
  notesPlaceholder: string;
  notesSubmitLabel: string;
  notesRequired: boolean;
  poorFormTitle: string;
  poorFormPrompt: string;
  poorReasonOptions: string[];
  poorSubmitLabel: string;
  goodThankYouMessage: string;
  updatedAt: string | null;
}

export type PlatformAgentFeedbackSettingsBody = Partial<
  Omit<PlatformAgentFeedbackSettings, "id" | "updatedAt">
>;

export type DistributionFeedbackSubmissionRow = {
  id: string;
  feedbackType: "rating" | "note";
  rating: string | null;
  reasonKeys: string[];
  comment: string | null;
  submittedAt: string;
  send: {
    id: string;
    conversationId: string | null;
    conversation: {
      id: string;
      shortId: string;
      startedAt: string;
      status: string | null;
    } | null;
    subject: string;
    recipientEmail: string;
    recipientRole: string;
    departmentName: string;
    sentAt: string;
    websiteId: string;
    websiteName: string;
    resellerName: string;
    childCompanyName: string;
    parentCompanyName: string;
  };
};

export type DistributionFeedbackSubmissionList = {
  items: DistributionFeedbackSubmissionRow[];
  websiteOptions: Array<{ id: string; name: string }>;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
