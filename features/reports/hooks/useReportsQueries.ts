import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReportConfiguration,
  deleteReportConfiguration,
  generateReportFromConfiguration,
  getChatTranscriptsReport,
  getMonthWiseChatCount,
  getMonthlyChatSummary,
  getReportConfiguration,
  getTrafficChatConversionRatios,
  getVisitorInfoWithTranscriptReport,
  getWebsiteDistributionReport,
  listGeneratedReports,
  listReportConfigurations,
  shareGeneratedReport,
  updateReportConfiguration,
  type ScopedPeriodParams,
} from "@/api/reports/reports.api";
import type {
  ChatTranscriptsReportParams,
  CreateReportConfigurationBody,
  GenerateReportBody,
  ReportScopeQueryParams,
  ShareGeneratedReportBody,
  UpdateReportConfigurationBody,
} from "@/api/reports/reports.types";
import { reportsKeys } from "./keys";

export function useMonthlyChatSummaryQuery(params: ScopedPeriodParams, enabled: boolean) {
  return useQuery({
    queryKey: reportsKeys.monthlySummary(params),
    queryFn: () => getMonthlyChatSummary(params),
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useTrafficConversionQuery(params: ScopedPeriodParams, enabled: boolean) {
  return useQuery({
    queryKey: reportsKeys.trafficConversion(params),
    queryFn: () => getTrafficChatConversionRatios(params),
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useChatTranscriptsReportQuery(params: ChatTranscriptsReportParams, enabled: boolean) {
  return useQuery({
    queryKey: reportsKeys.chatTranscripts(params),
    queryFn: () => getChatTranscriptsReport(params),
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useVisitorInfoWithTranscriptReportQuery(
  params: ChatTranscriptsReportParams,
  enabled: boolean,
) {
  return useQuery({
    queryKey: reportsKeys.visitorInfoWithTranscript(params),
    queryFn: () => getVisitorInfoWithTranscriptReport(params),
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useWebsiteDistributionReportQuery(
  params: ReportScopeQueryParams & { page?: number; limit?: number; all?: boolean },
  enabled: boolean,
) {
  return useQuery({
    queryKey: reportsKeys.websiteDistribution(params),
    queryFn: () => getWebsiteDistributionReport(params),
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useMonthWiseChatCountQuery(
  params: ReportScopeQueryParams & { from?: string; to?: string; monthCount?: number },
  enabled: boolean,
) {
  return useQuery({
    queryKey: reportsKeys.monthWiseChatCount(params),
    queryFn: () => getMonthWiseChatCount(params),
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useReportConfigurationsQuery(enabled = true) {
  return useQuery({
    queryKey: reportsKeys.configurations(),
    queryFn: listReportConfigurations,
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useReportConfigurationQuery(id: string | null) {
  return useQuery({
    queryKey: reportsKeys.configuration(id ?? ""),
    queryFn: () => getReportConfiguration(id!),
    enabled: Boolean(id?.trim()),
  });
}

export function useGeneratedReportsQuery(configId?: string, enabled = true) {
  return useQuery({
    queryKey: reportsKeys.generated(configId),
    queryFn: () => listGeneratedReports(configId),
    enabled,
    staleTime: 0,
  });
}

export function useCreateReportConfigurationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateReportConfigurationBody) => createReportConfiguration(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reportsKeys.configurations() });
    },
  });
}

export function useUpdateReportConfigurationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateReportConfigurationBody }) =>
      updateReportConfiguration(id, body),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: reportsKeys.configurations() });
      void qc.invalidateQueries({ queryKey: reportsKeys.configuration(data.id) });
    },
  });
}

export function useDeleteReportConfigurationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteReportConfiguration(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reportsKeys.configurations() });
      void qc.invalidateQueries({ queryKey: reportsKeys.all });
    },
  });
}

export function useGenerateReportMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: GenerateReportBody }) =>
      generateReportFromConfiguration(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reportsKeys.generated() });
    },
  });
}

export function useShareGeneratedReportMutation() {
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ShareGeneratedReportBody }) =>
      shareGeneratedReport(id, body),
  });
}
