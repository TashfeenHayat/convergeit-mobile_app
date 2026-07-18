import type { MonitorListFilters } from "@/services/chat/monitor.types";

export const chatMonitorKeys = {
  all: ["chat-monitor"] as const,
  capabilities: () => [...chatMonitorKeys.all, "capabilities"] as const,
  live: (filters: MonitorListFilters) => [...chatMonitorKeys.all, "live", filters] as const,
  closed: (filters: MonitorListFilters) => [...chatMonitorKeys.all, "closed", filters] as const,
  transcript: (conversationId: string) =>
    [...chatMonitorKeys.all, "transcript", conversationId] as const,
  directoryResellers: () => [...chatMonitorKeys.all, "directory", "resellers"] as const,
  directoryParents: (resellerId?: string) =>
    [...chatMonitorKeys.all, "directory", "parents", resellerId ?? ""] as const,
  directoryDepartments: (parentCompanyId: string) =>
    [...chatMonitorKeys.all, "directory", "departments", parentCompanyId] as const,
  directoryPools: (departmentId: string) =>
    [...chatMonitorKeys.all, "directory", "pools", departmentId] as const,
  directoryAgents: (params: {
    parentCompanyId?: string;
    departmentId?: string;
    poolId?: string;
  }) => [...chatMonitorKeys.all, "directory", "agents", params] as const,
};
