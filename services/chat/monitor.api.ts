import { apiClient } from "@/api";
import { agentChatSocketAckOrRest } from "./agent-socket-api.util";
import { normalizeConversationHistoryPayload } from "./conversation-normalizers";
import { unwrapChatHttpData } from "./http";
import { normalizeMonitorConversationList } from "./monitor-normalizers";
import type {
  MonitorCapabilities,
  MonitorConversationRow,
  MonitorDirectoryAgentsResponse,
  MonitorDirectoryDepartmentRow,
  MonitorDirectoryParentCompanyRow,
  MonitorDirectoryPoolRow,
  MonitorDirectoryResellerRow,
  MonitorListFilters,
  MonitorTranscriptResponse,
} from "./monitor.types";

function compactMonitorQuery(filters: MonitorListFilters): Record<string, string> {
  const q: Record<string, string> = {};
  if (filters.websiteId?.trim()) q.websiteId = filters.websiteId.trim();
  if (filters.departmentId?.trim()) q.departmentId = filters.departmentId.trim();
  if (filters.poolId?.trim()) q.poolId = filters.poolId.trim();
  if (filters.status?.trim()) q.status = filters.status.trim();
  if (filters.agentId?.trim()) q.agentId = filters.agentId.trim();
  return q;
}

export async function fetchMonitorCapabilities(): Promise<MonitorCapabilities> {
  const { data } = await apiClient.get<unknown>("/chat/monitor/me/capabilities");
  return unwrapChatHttpData<MonitorCapabilities>(data);
}

export async function fetchMonitorLive(
  filters: MonitorListFilters = {},
): Promise<MonitorConversationRow[]> {
  const query = compactMonitorQuery(filters);
  return agentChatSocketAckOrRest(
    (socket) => socket.fetchMonitorLiveWithAck(query, 15_000),
    async () => {
      const { data } = await apiClient.get<unknown>("/chat/monitor/live", {
        params: query,
      });
      return normalizeMonitorConversationList(unwrapChatHttpData(data));
    },
  );
}

export async function fetchMonitorClosed(
  filters: MonitorListFilters = {},
): Promise<MonitorConversationRow[]> {
  const query = compactMonitorQuery(filters);
  return agentChatSocketAckOrRest(
    (socket) => socket.fetchMonitorClosedWithAck(query, 15_000),
    async () => {
      const { data } = await apiClient.get<unknown>("/chat/monitor/closed", {
        params: query,
      });
      return normalizeMonitorConversationList(unwrapChatHttpData(data));
    },
  );
}

export async function fetchMonitorDirectoryResellers(): Promise<
  MonitorDirectoryResellerRow[]
> {
  const { data } = await apiClient.get<unknown>("/chat/monitor/directory/resellers");
  return unwrapChatHttpData<MonitorDirectoryResellerRow[]>(data);
}

export async function fetchMonitorDirectoryParentCompanies(
  resellerId?: string,
): Promise<MonitorDirectoryParentCompanyRow[]> {
  const { data } = await apiClient.get<unknown>("/chat/monitor/directory/parent-companies", {
    params: resellerId ? { resellerId } : {},
  });
  return unwrapChatHttpData<MonitorDirectoryParentCompanyRow[]>(data);
}

export async function fetchMonitorDirectoryDepartments(
  parentCompanyId: string,
): Promise<MonitorDirectoryDepartmentRow[]> {
  const { data } = await apiClient.get<unknown>("/chat/monitor/directory/departments", {
    params: { parentCompanyId },
  });
  return unwrapChatHttpData<MonitorDirectoryDepartmentRow[]>(data);
}

export async function fetchMonitorDirectoryPools(
  departmentId: string,
): Promise<MonitorDirectoryPoolRow[]> {
  const { data } = await apiClient.get<unknown>("/chat/monitor/directory/pools", {
    params: { departmentId },
  });
  return unwrapChatHttpData<MonitorDirectoryPoolRow[]>(data);
}

export async function fetchMonitorDirectoryAgents(params: {
  parentCompanyId?: string;
  departmentId?: string;
  poolId?: string;
  websiteId?: string;
}): Promise<MonitorDirectoryAgentsResponse> {
  const { data } = await apiClient.get<unknown>("/chat/monitor/directory/agents", {
    params: {
      ...(params.parentCompanyId ? { parentCompanyId: params.parentCompanyId } : {}),
      ...(params.departmentId ? { departmentId: params.departmentId } : {}),
      ...(params.poolId ? { poolId: params.poolId } : {}),
      ...(params.websiteId ? { websiteId: params.websiteId } : {}),
    },
  });
  return unwrapChatHttpData<MonitorDirectoryAgentsResponse>(data);
}

function parseMonitorTranscriptPayload(
  raw: unknown,
  conversationId: string,
): MonitorTranscriptResponse {
  const unwrapped = unwrapChatHttpData<Record<string, unknown>>(raw);
  const normalized = normalizeConversationHistoryPayload(unwrapped, conversationId);
  return {
    ...unwrapped,
    conversationId: normalized.conversationId,
    messages: normalized.messages,
    visitor: normalized.visitor,
    readOnly: true,
  };
}

export async function fetchMonitorTranscript(
  conversationId: string,
): Promise<MonitorTranscriptResponse> {
  return agentChatSocketAckOrRest(
    (socket) =>
      socket.fetchMonitorTranscriptWithAck({ conversationId }, 15_000),
    async () => {
      const { data } = await apiClient.get<unknown>(
        `/chat/monitor/conversations/${encodeURIComponent(conversationId)}/transcript`,
      );
      return parseMonitorTranscriptPayload(data, conversationId);
    },
  );
}

export type MonitorAssignTarget = {
  userId: string;
  name: string;
  email: string | null;
  label: string;
  serviceChannel: string;
};

export async function fetchMonitorAssignTargets(conversationId: string): Promise<{
  conversationId: string;
  agents: MonitorAssignTarget[];
}> {
  const { data } = await apiClient.get<unknown>(
    `/chat/monitor/conversations/${encodeURIComponent(conversationId)}/assign-targets`,
  );
  return unwrapChatHttpData(data);
}

export async function monitorAssignConversation(
  conversationId: string,
  toUserId: string,
): Promise<{
  conversationId: string;
  assignKind: "dispatch" | "reassign";
  toAgent: { id: string; label: string };
  assignedRank?: string;
}> {
  const { data } = await apiClient.post<unknown>(
    `/chat/monitor/conversations/${encodeURIComponent(conversationId)}/assign`,
    { toUserId },
  );
  return unwrapChatHttpData(data);
}
