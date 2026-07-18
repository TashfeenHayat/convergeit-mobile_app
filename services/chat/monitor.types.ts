import type { AgentVisitorPresentation } from "./chat.types";

export type MonitorListTab = "live" | "closed";

export interface MonitorListFilters {
  websiteId?: string;
  departmentId?: string;
  poolId?: string;
  status?: string;
  agentId?: string;
}

export interface MonitorScopeSummary {
  kind: "platform" | "parent_company" | "department" | "pool" | "involvement";
  parentCompanyIds?: string[];
  departmentIds?: string[];
  poolIds?: string[];
  involvementAssignments?: Array<{ websiteId: string; departmentId: string }>;
}

export type MonitorUiMode =
  | "platform"
  | "parent_company"
  | "department"
  | "pool"
  | "involvement";

export interface MonitorCapabilities {
  scopes: MonitorScopeSummary[];
  socketRooms: string[];
  permissions: string[];
  mode?: MonitorUiMode;
  readOnly?: boolean;
  canWhisper?: boolean;
  canDirectControl?: boolean;
  showResellerDirectory?: boolean;
}

export interface MonitorDirectoryResellerRow {
  id: string;
  name: string;
  liveCount: number;
}

export interface MonitorDirectoryParentCompanyRow {
  id: string;
  name: string;
  resellerId: string | null;
  resellerName: string | null;
  liveCount: number;
}

export interface MonitorDirectoryDepartmentRow {
  id: string;
  name: string;
  type: string;
}

export interface MonitorDirectoryPoolRow {
  id: string;
  name: string;
}

export interface MonitorDirectoryAgentRow {
  kind: "roster" | "involvement";
  userId: string;
  userType: string;
  displayName: string;
  email: string;
  departmentId?: string | null;
  departmentName?: string | null;
  departmentType?: string | null;
  serviceChannel?: string | null;
  poolId?: string | null;
  poolName?: string | null;
  parentCompanyId?: string;
  parentCompanyName?: string | null;
  websiteId?: string;
  websiteName?: string | null;
  liveCount: number;
  waitingCount: number;
}

export interface MonitorDirectoryAgentsResponse {
  /** All website roster rows (internal + external). */
  roster: MonitorDirectoryAgentRow[];
  /** Internal users on client website roster under scope. */
  platformAssigned: MonitorDirectoryAgentRow[];
  /** External client agents on website roster. */
  clientAgents: MonitorDirectoryAgentRow[];
  involvement: MonitorDirectoryAgentRow[];
}

export interface MonitorAgentRef {
  id: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface MonitorConversationRow {
  id: string;
  websiteId: string;
  visitorId: string;
  agentId: string | null;
  supervisorControlUserId?: string | null;
  status: string;
  routingKey?: string | null;
  serviceChannel?: string | null;
  departmentId?: string | null;
  poolId?: string | null;
  startedAt?: string;
  endedAt?: string | null;
  department?: { id: string; name: string; type?: string } | null;
  pool?: { id: string; name: string } | null;
  agent?: MonitorAgentRef | null;
  visitorPresentation?: AgentVisitorPresentation;
  lastMessage?: Record<string, unknown> | null;
  childCompany?: { id: string; name: string } | null;
  parentCompany?: { id: string; name: string } | null;
}

export interface MonitorTranscriptResponse {
  conversationId: string;
  messages: import("./chat.types").ChatMessage[];
  readOnly: true;
  visitor?: Record<string, unknown>;
  [key: string]: unknown;
}
