import type { AgentVisitorPresentation } from "./chat.types";

export type AgentWrapUpDisposition =
  | "resolved"
  | "pending_follow_up"
  | "no_response"
  | "spam"
  | "other";

export interface AgentWrapUpFormField {
  key: string;
  type: string;
  required?: boolean;
  label: string;
  maxLength?: number;
}

export interface AgentWrapUpEmailField {
  fieldKey: string;
  label: string;
  fieldType: string;
  isRequired: boolean;
  enabled: boolean;
  sortOrder: number;
  readOnly: boolean;
}

export interface AgentWrapUpPayload {
  conversationId: string;
  websiteId?: string;
  agentId?: string | null;
  status?: string;
  chatCompleted?: boolean;
  requiresAgentWrapUp?: boolean;
  requiresDistributionForm?: boolean;
  requiresDistributionSetup?: boolean;
  distributionFormPath?: string | null;
  distributionSetupPath?: string | null;
  wrapUpFormPath?: string | null;
  closeForm?: {
    fields: AgentWrapUpEmailField[];
    prefilledValues: Record<string, string>;
  } | null;
  distributionSubmitted?: boolean;
  distributionSubmission?: Record<string, unknown> | null;
  wrapUpSubmitted?: boolean;
  submission?: Record<string, unknown> | null;
  form?: {
    dispositionOptions?: Array<{ value: string; label: string }>;
    fields?: AgentWrapUpFormField[];
  };
  closedBy?: string;
  closedAt?: string;
  visitorPresentation?: AgentVisitorPresentation;
  visitor?: Record<string, unknown> | null;
  messageCounts?: { visitor: number; agent: number; ai: number; total: number };
  durationMinutes?: number;
  hint?: string;
  showInChat?: boolean;
  [key: string]: unknown;
}

export interface SubmitAgentWrapUpBody {
  disposition: AgentWrapUpDisposition;
  agentNotes: string;
  outcomeTag?: string;
  csatScore?: number;
  formValues?: Record<string, string>;
}
