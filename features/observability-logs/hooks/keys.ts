import type { ObservabilityLogsQuery } from "@/api/observability/observability-logs.types";

export const observabilityLogKeys = {
  auditList: (query: ObservabilityLogsQuery) =>
    ["observability", "audit-logs", query] as const,
  auditDetail: (id: string) => ["observability", "audit-logs", id] as const,
  analyticsList: (query: ObservabilityLogsQuery) =>
    ["observability", "analytics-logs", query] as const,
  analyticsDetail: (id: string) =>
    ["observability", "analytics-logs", id] as const,
};
