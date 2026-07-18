import { apiClient } from "@/api";
import { agentChatSocketAckOrRest } from "./agent-socket-api.util";
import { unwrapChatHttpData } from "./http";

export type WebsiteAnalyticsReport = {
  website: {
    id: string;
    name: string | null;
    url: string;
    childCompanyName: string;
    parentCompanyName: string;
  };
  range: { from: string; to: string };
  summary: {
    uniqueVisitors: number;
    pageViews: number;
    browsingOnlyVisitors: number;
    widgetOpens: number;
    chatsStarted: number;
    meaningfulChats: number;
    leadsCaptured: number;
    chatsWithoutLead: number;
    chatRatePct: number | null;
    leadRatePct: number | null;
    widgetOpenRatePct: number | null;
    browsingOnlyRatePct: number | null;
  };
  funnel: {
    visitors: number;
    browsingOnly: number;
    widgetOpened: number;
    chatted: number;
    leads: number;
  };
  trafficSources: Array<{ source: string; label: string; visitors: number }>;
  trafficSourceTotals: Record<string, number>;
  leadSourceTotals: Record<string, number>;
  dailyTrend: Array<{
    date: string;
    visitors: number;
    pageViews: number;
    widgetOpens: number;
    chats: number;
    meaningfulChats: number;
    leads: number;
  }>;
  topCountries: Array<{ country: string; visitors: number }>;
  topCities: Array<{ city: string; country: string; visitors: number }>;
  topLandingPages: Array<{ url: string; visitors: number }>;
  deviceBreakdown: Array<{ device: string; visitors: number }>;
};

export type WebsiteVisitorRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  hasLead: boolean;
  ipAddress: string | null;
  location: string | null;
  locationCity: string | null;
  locationRegion: string | null;
  locationCountry: string | null;
  countryCode: string | null;
  trafficSource: string | null;
  trafficSourceLabel: string;
  referrerUrl: string | null;
  landingPageUrl: string | null;
  currentPageUrl: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  pageViewCount: number;
  widgetOpened: boolean;
  hasChatted: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  latestConversationId: string | null;
  latestConversationStatus: string | null;
  latestConversationStartedAt: string | null;
};

export type WebsiteVisitorsListResponse = {
  items: WebsiteVisitorRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  range: { from: string; to: string };
};

export type WebsiteVisitorsQuery = {
  websiteId: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  trafficSource?: string;
  hasLead?: boolean;
  hasChatted?: boolean;
  widgetOpened?: boolean;
  search?: string;
  sortBy?: string;
  sortDir?: string;
};

export async function fetchWebsiteAnalyticsReport(params: {
  websiteId: string;
  from?: string;
  to?: string;
}): Promise<WebsiteAnalyticsReport> {
  const query = {
    ...(params.from ? { from: params.from } : {}),
    ...(params.to ? { to: params.to } : {}),
  };

  return agentChatSocketAckOrRest(
    (socket) =>
      socket.fetchWebsiteAnalyticsReportWithAck(
        {
          websiteId: params.websiteId,
          from: params.from,
          to: params.to,
        },
        20_000,
      ),
    async () => {
      const { data } = await apiClient.get<unknown>(
        `/websites/${encodeURIComponent(params.websiteId)}/analytics/report`,
        { params: query },
      );
      return unwrapChatHttpData<WebsiteAnalyticsReport>(data);
    },
  );
}

export async function fetchWebsiteVisitors(
  params: WebsiteVisitorsQuery,
): Promise<WebsiteVisitorsListResponse> {
  const query: Record<string, string | number | boolean> = {
    ...(params.from ? { from: params.from } : {}),
    ...(params.to ? { to: params.to } : {}),
    ...(params.page ? { page: params.page } : {}),
    ...(params.limit ? { limit: params.limit } : {}),
    ...(params.trafficSource ? { trafficSource: params.trafficSource } : {}),
    ...(params.hasLead === true ? { hasLead: true } : {}),
    ...(params.hasChatted === true ? { hasChatted: true } : {}),
    ...(params.widgetOpened === true ? { widgetOpened: true } : {}),
    ...(params.widgetOpened === false ? { widgetOpened: false } : {}),
    ...(params.search?.trim() ? { search: params.search.trim() } : {}),
    ...(params.sortBy ? { sortBy: params.sortBy } : {}),
    ...(params.sortDir ? { sortDir: params.sortDir } : {}),
  };

  return agentChatSocketAckOrRest(
    (socket) =>
      socket.fetchWebsiteVisitorsWithAck(
        {
          websiteId: params.websiteId,
          ...query,
        },
        20_000,
      ),
    async () => {
      const { data } = await apiClient.get<unknown>(
        `/websites/${encodeURIComponent(params.websiteId)}/analytics/visitors`,
        { params: query },
      );
      return unwrapChatHttpData<WebsiteVisitorsListResponse>(data);
    },
  );
}

export async function fetchWebsiteVisitorDetail(
  websiteId: string,
  visitorId: string,
): Promise<Record<string, unknown>> {
  return agentChatSocketAckOrRest(
    (socket) =>
      socket.fetchWebsiteVisitorDetailWithAck(
        { websiteId, visitorId },
        20_000,
      ),
    async () => {
      const { data } = await apiClient.get<unknown>(
        `/websites/${encodeURIComponent(websiteId)}/analytics/visitors/${encodeURIComponent(visitorId)}`,
      );
      return unwrapChatHttpData<Record<string, unknown>>(data);
    },
  );
}
