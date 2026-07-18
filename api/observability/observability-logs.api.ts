import { apiClient } from "../http/axios-instance";
import { unwrapApiData } from "../email/unwrap-api-data";
import type {
  AnalyticsLogDetail,
  AnalyticsLogListItem,
  AuditLogDetail,
  AuditLogListItem,
  ObservabilityLogsQuery,
  PaginatedObservabilityLogs,
} from "./observability-logs.types";

function queryParams(
  query: ObservabilityLogsQuery,
): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (query.page != null) params.page = query.page;
  if (query.limit != null) params.limit = query.limit;
  if (query.websiteId) params.websiteId = query.websiteId;
  if (query.conversationId) params.conversationId = query.conversationId;
  if (query.actorUserId) params.actorUserId = query.actorUserId;
  if (query.eventType) params.eventType = query.eventType;
  if (query.severity) params.severity = query.severity;
  if (query.from) params.from = query.from;
  if (query.to) params.to = query.to;
  return params;
}

export async function fetchAuditLogs(
  query: ObservabilityLogsQuery = {},
): Promise<PaginatedObservabilityLogs<AuditLogListItem>> {
  const { data } = await apiClient.get<unknown>("/observability/audit-logs", {
    params: queryParams(query),
  });
  return unwrapApiData<PaginatedObservabilityLogs<AuditLogListItem>>(data);
}

export async function fetchAuditLogDetail(id: string): Promise<AuditLogDetail> {
  const { data } = await apiClient.get<unknown>(
    `/observability/audit-logs/${id}`,
  );
  return unwrapApiData<AuditLogDetail>(data);
}

export async function fetchAnalyticsLogs(
  query: ObservabilityLogsQuery = {},
): Promise<PaginatedObservabilityLogs<AnalyticsLogListItem>> {
  const { data } = await apiClient.get<unknown>(
    "/observability/analytics-logs",
    { params: queryParams(query) },
  );
  return unwrapApiData<PaginatedObservabilityLogs<AnalyticsLogListItem>>(data);
}

export async function fetchAnalyticsLogDetail(
  id: string,
): Promise<AnalyticsLogDetail> {
  const { data } = await apiClient.get<unknown>(
    `/observability/analytics-logs/${id}`,
  );
  return unwrapApiData<AnalyticsLogDetail>(data);
}
