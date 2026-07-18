import { apiClient } from "@/api";
import { agentChatSocketAckOrRest } from "./agent-socket-api.util";
import { unwrapChatHttpData } from "./http";

export type WebsiteLeadsSummaryRow = {
  statDate: string;
  totalTraffic?: number;
  totalPageViews?: number;
  widgetOpened?: number;
  totalChats?: number;
  meaningfulChats?: number;
  leadsCaptured?: number;
  chatsWithoutLead?: number;
  [key: string]: unknown;
};

export type WebsiteLeadsSummaryResponse = {
  daily: WebsiteLeadsSummaryRow[];
  totals: Record<string, number>;
};

export async function fetchWebsiteLeadsSummary(params: {
  websiteId: string;
  from?: string;
  to?: string;
}): Promise<WebsiteLeadsSummaryResponse> {
  const query = {
    ...(params.from ? { from: params.from } : {}),
    ...(params.to ? { to: params.to } : {}),
  };

  return agentChatSocketAckOrRest(
    (socket) =>
      socket.fetchWebsiteLeadsSummaryWithAck(
        {
          websiteId: params.websiteId,
          from: params.from,
          to: params.to,
        },
        15_000,
      ),
    async () => {
      const { data } = await apiClient.get<unknown>(
        `/websites/${encodeURIComponent(params.websiteId)}/leads/summary`,
        { params: query },
      );
      return unwrapChatHttpData<WebsiteLeadsSummaryResponse>(data);
    },
  );
}
