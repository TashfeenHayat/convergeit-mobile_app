import { apiClient } from "../http/axios-instance";
import { unwrapApiData } from "../email/unwrap-api-data";

export type DashboardTrend = {
  current: number;
  previous: number;
  changePercent: number | null;
};

export type DashboardRevenueChartPoint = {
  day: number;
  label: string;
  value: number;
  value2: number;
};

export type DashboardChatAnalyticsPoint = {
  name: string;
  value: number;
  fill: "first" | "second";
};

export type DashboardDepartmentSlice = {
  name: string;
  value: number;
  color: string;
};

export type PlatformOverviewData = {
  generatedAt: string;
  currency: string;
  metrics: {
    todayTotalChats: DashboardTrend;
    totalCompanies: DashboardTrend;
    totalActiveWebsites: DashboardTrend;
    totalActiveUsers: DashboardTrend;
    liveChats: DashboardTrend;
    todayClosedChats: DashboardTrend;
    monthlyRevenue: DashboardTrend;
    todayRevenue: DashboardTrend;
    agentsOnline: number;
    agentsTotal: number;
    licensesMissing: number;
    platformFeesReceived: DashboardTrend;
    systemStatus: "operational" | "degraded";
    systemStatusDetail: string;
  };
  revenueChart: DashboardRevenueChartPoint[];
  chatAnalytics: DashboardChatAnalyticsPoint[];
  chatsByDepartment: DashboardDepartmentSlice[];
};

export type PlatformOverviewQuery = {
  days?: number;
  revenueGranularity?: "weekly" | "monthly" | "today";
  chatAnalyticsWindow?: "7days" | "monthly";
};

export async function fetchPlatformOverview(
  query: PlatformOverviewQuery = {},
): Promise<PlatformOverviewData> {
  const { data } = await apiClient.get<unknown>("/dashboard/platform-overview", {
    params: query,
  });
  return unwrapApiData<PlatformOverviewData>(data);
}
