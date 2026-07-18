export type ObservabilityLogActor = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
} | null;

export type ObservabilityLogWebsite = {
  id: string;
  name: string | null;
  url: string;
} | null;

export type AuditLogListItem = {
  id: string;
  eventType: string;
  severity: string;
  createdAt: string;
  actorUserId: string | null;
  websiteId: string | null;
  conversationId: string | null;
  actor: ObservabilityLogActor;
  website: ObservabilityLogWebsite;
};

export type AnalyticsLogListItem = {
  id: string;
  eventType: string;
  createdAt: string;
  actorUserId: string | null;
  websiteId: string | null;
  conversationId: string | null;
  actor: ObservabilityLogActor;
  website: ObservabilityLogWebsite;
};

export type AuditLogDetail = AuditLogListItem & {
  detailsJson: unknown;
  expiresAt: string | null;
};

export type AnalyticsLogDetail = AnalyticsLogListItem & {
  payloadJson: unknown;
  expiresAt: string | null;
};

export type PaginatedObservabilityLogs<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  retentionDays: number;
};

export type ObservabilityLogsQuery = {
  page?: number;
  limit?: number;
  websiteId?: string;
  conversationId?: string;
  actorUserId?: string;
  eventType?: string;
  severity?: string;
  from?: string;
  to?: string;
};
