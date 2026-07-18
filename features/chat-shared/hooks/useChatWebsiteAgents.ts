import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMonitorDirectoryAgents } from "@/services/chat/monitor.api";
import {
  filterChatWebsiteAgentRows,
  mergeMonitorAgentRows,
  type ChatWebsiteAgentRow,
} from "../utils/flatten-website-agents";

/**
 * Sourced from `GET /chat/monitor/directory/agents` — the mobile app does not
 * wire the platform-admin website-assignments roster API, so this reads the
 * agent directory straight from chat monitor (department roster + live
 * involvement) instead of the web's website-assignment-detail fallback.
 */
export function useChatWebsiteAgents(
  websiteId: string,
  parentCompanyId: string,
  filters: {
    departmentId?: string;
    poolId?: string;
    search?: string;
  },
  options: { enabled: boolean },
) {
  const wid = websiteId.trim();
  const pcId = parentCompanyId.trim();

  const monitorQuery = useQuery({
    queryKey: ["chat-website-agents-monitor", wid, pcId, filters.departmentId, filters.poolId] as const,
    queryFn: () =>
      fetchMonitorDirectoryAgents({
        parentCompanyId: pcId || undefined,
        websiteId: wid,
        departmentId: filters.departmentId?.trim() || undefined,
        poolId: filters.poolId?.trim() || undefined,
      }),
    enabled: options.enabled && Boolean(wid),
    staleTime: 20_000,
  });

  const baseRows = useMemo(
    (): ChatWebsiteAgentRow[] => mergeMonitorAgentRows(monitorQuery.data?.roster ?? [], wid),
    [monitorQuery.data?.roster, wid],
  );

  const rows = useMemo(
    () =>
      filterChatWebsiteAgentRows(baseRows, {
        departmentId: filters.departmentId,
        search: filters.search,
      }),
    [baseRows, filters.departmentId, filters.search],
  );

  return {
    rows,
    isLoading: monitorQuery.isLoading,
    isError: monitorQuery.isError,
    detail: null,
  };
}
