import { apiClient } from "@/api/http/axios-instance";
import { agentChatSocketAckOrRest } from "./agent-socket-api.util";
import { chatAuthHeaders, unwrapChatHttpData } from "./http";
import type { QaReviewBundle } from "./qa.types";
import type {
  ChatReportOverview,
  ChatReportQuery,
  QaQualityReport,
} from "./reports.types";

function reportParams(query: ChatReportQuery): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.from) params.from = query.from;
  if (query.to) params.to = query.to;
  if (query.websiteId) params.websiteId = query.websiteId;
  if (query.departmentId) params.departmentId = query.departmentId;
  return params;
}

export async function fetchChatReportOverview(
  query: ChatReportQuery = {},
  token?: string,
): Promise<ChatReportOverview> {
  return agentChatSocketAckOrRest(
    (socket) =>
      socket.fetchChatReportOverviewWithAck(
        {
          from: query.from,
          to: query.to,
          websiteId: query.websiteId,
          departmentId: query.departmentId,
        },
        20_000,
      ),
    async () => {
      const { data } = await apiClient.get<unknown>("/chat/reports/overview", {
        params: reportParams(query),
        headers: chatAuthHeaders(token),
      });
      return unwrapChatHttpData<ChatReportOverview>(data);
    },
  );
}

export async function fetchQaQualityReport(
  query: ChatReportQuery = {},
  token?: string,
): Promise<QaQualityReport> {
  const { data } = await apiClient.get<unknown>("/chat/reports/qa-quality", {
    params: reportParams(query),
    headers: chatAuthHeaders(token),
  });
  return unwrapChatHttpData<QaQualityReport>(data);
}

/** Supervisors (pool/dept/external heads) — full read-only QA review without QA inbox. */
export async function fetchSupervisorQaReviewBundle(
  conversationId: string,
  token?: string,
): Promise<QaReviewBundle> {
  const { data } = await apiClient.get<unknown>(
    `/chat/reports/qa-review/${encodeURIComponent(conversationId)}`,
    { headers: chatAuthHeaders(token) },
  );
  return unwrapChatHttpData<QaReviewBundle>(data);
}
