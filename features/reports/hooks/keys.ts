export const reportsKeys = {
  all: ["reports"] as const,
  monthlySummary: (params: unknown) => [...reportsKeys.all, "monthly-chat-summary", params] as const,
  trafficConversion: (params: unknown) =>
    [...reportsKeys.all, "traffic-chat-conversion-ratios", params] as const,
  chatTranscripts: (params: unknown) => [...reportsKeys.all, "chat-transcripts", params] as const,
  visitorInfoWithTranscript: (params: unknown) =>
    [...reportsKeys.all, "visitor-info-with-transcript", params] as const,
  websiteDistribution: (params: unknown) =>
    [...reportsKeys.all, "website-distribution", params] as const,
  monthWiseChatCount: (params: unknown) =>
    [...reportsKeys.all, "month-wise-chat-count", params] as const,
  configurations: () => [...reportsKeys.all, "configurations"] as const,
  configuration: (id: string) => [...reportsKeys.all, "configuration", id] as const,
  generated: (configId?: string) => [...reportsKeys.all, "generated", configId ?? "all"] as const,
};
