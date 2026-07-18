import type { AgentVisitorPresentation } from "./chat.types";

export type TranscriptSearchField =
  | "reseller"
  | "parentCompany"
  | "childCompany"
  | "website"
  | "agent"
  | "visitor"
  | "conversationId";

export type TranscriptSuggestionKind =
  | "reseller"
  | "parentCompany"
  | "childCompany"
  | "website"
  | "agent"
  | "conversationId";

export interface TranscriptListFilters {
  resellerId?: string;
  parentCompanyId?: string;
  childCompanyId?: string;
  websiteId?: string;
  conversationId?: string;
  status?: string;
  agentId?: string;
  searchField?: TranscriptSearchField;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface TranscriptSuggestionItem {
  id: string;
  label: string;
  subtitle?: string;
}

export interface TranscriptParticipant {
  role: "visitor" | "agent" | "ai" | "supervisor";
  userId?: string | null;
  label: string;
  email?: string | null;
  messageCount?: number;
}

export interface TranscriptListItem {
  id: string;
  websiteId: string;
  visitorId: string | null;
  agentId: string | null;
  status: string;
  routingKey?: string | null;
  serviceChannel?: string | null;
  startedAt?: string;
  endedAt?: string | null;
  messageCount: number;
  visitorPresentation?: AgentVisitorPresentation;
  lastMessage?: Record<string, unknown> | null;
  participants: TranscriptParticipant[];
  reseller?: { id: string; name: string } | null;
  parentCompany?: { id: string; name: string } | null;
  childCompany?: { id: string; name: string } | null;
  website?: { id: string; name: string | null; url: string } | null;
  agent?: {
    id: string;
    email?: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  /** Human agent name, or "AI" for AI-only / AI-handled chats without an assignee. */
  resolvedAgentLabel?: string | null;
  department?: { id: string; name: string; type?: string } | null;
  pool?: { id: string; name: string } | null;
  /** Enriched close classification (transcript API). */
  transcriptStatus?: string | null;
  closeBucket?: string | null;
  closeOutcome?: string | null;
  spamCategory?: string | null;
    requiresDistributionForm?: boolean;
  requiresDistributionSetup?: boolean;
  distributionSubmitted?: boolean;
  isMeaningfulChat?: boolean;
}

export interface TranscriptListResponse {
  items: TranscriptListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TranscriptDetailResponse {
  conversation: Record<string, unknown>;
  messages: import("./chat.types").ChatMessage[];
  assignments: unknown[];
  participants: TranscriptParticipant[];
  readOnly: true;
  [key: string]: unknown;
}
