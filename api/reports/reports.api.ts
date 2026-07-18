import { apiClient } from "../http/axios-instance";
import type {
  ChatTranscriptsReportParams,
  ChatTranscriptsReportResponse,
  CreateReportConfigurationBody,
  GenerateReportBody,
  GenerateReportResponse,
  GeneratedReportListItem,
  MonthlyChatSummaryResponse,
  MonthWiseChatCountResponse,
  ReportConfiguration,
  ReportPeriodQueryParams,
  ReportPaginationParams,
  ReportScopeQueryParams,
  ShareGeneratedReportBody,
  ShareGeneratedReportResponse,
  TrafficConversionRatiosResponse,
  UpdateReportConfigurationBody,
  VisitorInfoWithTranscriptReportParams,
  VisitorInfoWithTranscriptReportResponse,
  WebsiteDistributionReportResponse,
} from "./reports.types";

function unwrap<T>(data: unknown): T {
  const envelope = data as { success?: boolean; data?: T };
  if (envelope?.data !== undefined) return envelope.data as T;
  return data as T;
}

export type ScopedPeriodParams = ReportScopeQueryParams & ReportPeriodQueryParams;

export async function getMonthlyChatSummary(
  params: ScopedPeriodParams,
): Promise<MonthlyChatSummaryResponse> {
  const { data } = await apiClient.get("/reports/monthly-chat-summary", { params });
  return unwrap<MonthlyChatSummaryResponse>(data);
}

export async function getTrafficChatConversionRatios(
  params: ScopedPeriodParams,
): Promise<TrafficConversionRatiosResponse> {
  const { data } = await apiClient.get("/reports/traffic-chat-conversion-ratios", { params });
  return unwrap<TrafficConversionRatiosResponse>(data);
}

export async function getChatTranscriptsReport(
  params: ChatTranscriptsReportParams,
): Promise<ChatTranscriptsReportResponse> {
  const { data } = await apiClient.get("/reports/chat-transcripts", { params });
  return unwrap<ChatTranscriptsReportResponse>(data);
}

export async function getVisitorInfoWithTranscriptReport(
  params: VisitorInfoWithTranscriptReportParams,
): Promise<VisitorInfoWithTranscriptReportResponse> {
  const { data } = await apiClient.get("/reports/visitor-info-with-transcript", { params });
  return unwrap<VisitorInfoWithTranscriptReportResponse>(data);
}

export async function getWebsiteDistributionReport(
  params: ReportScopeQueryParams & ReportPaginationParams,
): Promise<WebsiteDistributionReportResponse> {
  const { data } = await apiClient.get("/reports/website-distribution", { params });
  return unwrap<WebsiteDistributionReportResponse>(data);
}

export async function getMonthWiseChatCount(
  params: ReportScopeQueryParams & ReportPeriodQueryParams,
): Promise<MonthWiseChatCountResponse> {
  const { data } = await apiClient.get("/reports/month-wise-chat-count", { params });
  return unwrap<MonthWiseChatCountResponse>(data);
}

export async function listReportConfigurations(): Promise<ReportConfiguration[]> {
  const { data } = await apiClient.get("/reports/configurations");
  return unwrap<ReportConfiguration[]>(data);
}

export async function getReportConfiguration(id: string): Promise<ReportConfiguration> {
  const { data } = await apiClient.get(`/reports/configurations/${encodeURIComponent(id)}`);
  return unwrap<ReportConfiguration>(data);
}

export async function createReportConfiguration(
  body: CreateReportConfigurationBody,
): Promise<ReportConfiguration> {
  const { data } = await apiClient.post("/reports/configurations", body);
  return unwrap<ReportConfiguration>(data);
}

export async function updateReportConfiguration(
  id: string,
  body: UpdateReportConfigurationBody,
): Promise<ReportConfiguration> {
  const { data } = await apiClient.patch(`/reports/configurations/${encodeURIComponent(id)}`, body);
  return unwrap<ReportConfiguration>(data);
}

export async function deleteReportConfiguration(id: string): Promise<{ deleted: boolean }> {
  const { data } = await apiClient.delete(`/reports/configurations/${encodeURIComponent(id)}`);
  return unwrap<{ deleted: boolean }>(data);
}

export async function generateReportFromConfiguration(
  id: string,
  body?: GenerateReportBody,
): Promise<GenerateReportResponse> {
  const { data } = await apiClient.post(
    `/reports/configurations/${encodeURIComponent(id)}/generate`,
    body ?? {},
  );
  return unwrap<GenerateReportResponse>(data);
}

export async function listGeneratedReports(configId?: string): Promise<GeneratedReportListItem[]> {
  const { data } = await apiClient.get("/reports/generated", {
    params: configId ? { configId } : undefined,
  });
  return unwrap<GeneratedReportListItem[]>(data);
}

export async function shareGeneratedReport(
  id: string,
  body: ShareGeneratedReportBody,
): Promise<ShareGeneratedReportResponse> {
  const { data } = await apiClient.post(`/reports/generated/${encodeURIComponent(id)}/share`, body);
  return unwrap<ShareGeneratedReportResponse>(data);
}
