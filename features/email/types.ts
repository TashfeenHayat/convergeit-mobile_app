/**
 * Email module types — mirrors NestJS API shapes.
 * Canonical definitions live in `@/api/types/email.types`; re-exported here for feature imports.
 */
export type {
  EmailFieldType,
  EmailPreviewData,
  EmailProvider,
  EmailProviderCode,
  EmailProviderFieldSchema,
  EmailProviderFormSchema,
  EmailProviderKind,
  EmailTemplateAssignment,
  EmailTemplateBlock,
  EmailTemplateBlockKey,
  EmailTemplateDraft,
  EmailTemplateDraftBody,
  EmailTestBody,
  EmailTestResult,
  MailProviderSettings,
  MailProviderSettingsBody,
  PlatformEmailSettings,
  PlatformEmailSettingsBody,
  PlatformMailAssignment,
  PlatformMailAssignmentBody,
  PlatformMailAssignmentListItem,
  ResellerOwnMailListItem,
  ResellerOwnMailSettings,
  ResellerOwnMailSettingsBody,
} from "@/api/types/email.types";
