import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchAnalyticsLogs,
  fetchAuditLogs,
} from "@/api/observability/observability-logs.api";
import type { ObservabilityLogsQuery } from "@/api/observability/observability-logs.types";
import { observabilityLogKeys } from "./keys";

export type ObservabilityLogTab = "audit" | "analytics";

export function useObservabilityLogs(options?: { apiEnabled?: boolean }) {
  const apiEnabled = options?.apiEnabled !== false;
  const [tab, setTab] = useState<ObservabilityLogTab>("audit");
  const [page, setPage] = useState(1);
  const [eventType, setEventType] = useState("");
  const [severity, setSeverity] = useState("");
  const [websiteId, setWebsiteId] = useState("");

  const query = useMemo((): ObservabilityLogsQuery => {
    const q: ObservabilityLogsQuery = { page, limit: 25 };
    if (websiteId.trim()) q.websiteId = websiteId.trim();
    if (eventType.trim()) q.eventType = eventType.trim();
    if (tab === "audit" && severity.trim()) q.severity = severity.trim();
    return q;
  }, [page, websiteId, eventType, severity, tab]);

  const auditQuery = useQuery({
    queryKey: observabilityLogKeys.auditList(query),
    queryFn: () => fetchAuditLogs(query),
    enabled: apiEnabled && tab === "audit",
  });

  const analyticsQuery = useQuery({
    queryKey: observabilityLogKeys.analyticsList(query),
    queryFn: () => fetchAnalyticsLogs(query),
    enabled: apiEnabled && tab === "analytics",
  });

  const active = tab === "audit" ? auditQuery : analyticsQuery;

  const auditItems = auditQuery.data?.items ?? [];
  const analyticsItems = analyticsQuery.data?.items ?? [];

  return {
    tab,
    setTab: (next: ObservabilityLogTab) => {
      setTab(next);
      setPage(1);
    },
    page,
    setPage,
    eventType,
    setEventType,
    severity,
    setSeverity,
    websiteId,
    setWebsiteId,
    auditItems,
    analyticsItems,
    items: tab === "audit" ? auditItems : analyticsItems,
    totalPages: active.data?.totalPages ?? 1,
    total: active.data?.total ?? 0,
    retentionDays: active.data?.retentionDays ?? 30,
    loading: active.isLoading,
    error: active.error,
    refresh: () => void active.refetch(),
  };
}
