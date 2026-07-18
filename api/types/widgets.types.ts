import type { ApiEnvelope } from "./auth.types";
import type { JsonRecord } from "./common.types";

export type WidgetTypeApi = "CHAT" | "TEXT_US" | "BOTH";

export type WidgetChatModeApi = "AI_ONLY" | "AGENT_ONLY" | "HYBRID";

export type WidgetAiTypeApi = "AI_CHATBOT" | "AI_ASSISTANT";

/** Query for `GET /widgets` (ListWidgetsQueryDto — align names with backend). */
export interface ListWidgetsQuery {
  page?: number;
  limit?: number;
  /** When true, disables paging cap for dropdown/admin lists. */
  all?: boolean;
  search?: string;
  widgetType?: WidgetTypeApi;
  websiteId?: string;
  childCompanyId?: string;
  parentCompanyId?: string;
  resellerId?: string;
  embedAllowAnyOrigin?: boolean;
  hasPublishedVersion?: boolean;
}

/** Normalized row for dashboard table (mapped from list item). */
export interface AdminWidgetTableRow extends Record<string, unknown> {
  id: string;
  widgetKey: string;
  websiteId: string;
  websiteLabel: string;
  parentCompany: string;
  childCompany: string;
  resellerName: string;
  widgetTypeLabel: string;
  /** "Yes" when embed snapshot is published. */
  publishedLabel: string;
  /** "Pending" when website draft is newer than published embed. */
  draftPendingLabel: string;
  hasUnpublishedDraft: boolean;
  chatEnabled: boolean;
  textUsEnabled: boolean;
  statusLabel: string;
  raw: JsonRecord;
}

export type WidgetListResponseEnvelope = ApiEnvelope<JsonRecord>;

export type WidgetInstallationResponseEnvelope = ApiEnvelope<JsonRecord>;

export type WidgetEmbedSnippetEnvelope = ApiEnvelope<JsonRecord>;

export type WidgetAssetUploadEnvelope = ApiEnvelope<JsonRecord>;
