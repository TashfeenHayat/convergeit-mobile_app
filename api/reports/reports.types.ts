export type ReportType =
  | "monthly_chat_summary"
  | "traffic_chat_conversion_ratios"
  | "chat_transcripts_report"
  | "website_distribution_report"
  | "month_wise_chat_count"
  | "visitor_info_with_transcript";

export type ReportScopeType = "website" | "child_company" | "parent_company" | "reseller";

export type ReportHierarchy = {
  reseller: { id: string; name: string } | null;
  parentCompany: { id: string; name: string } | null;
  childCompany: { id: string; name: string } | null;
  website: { id: string; name: string | null; url: string } | null;
};

export type ReportPeriod = {
  label: string;
  from: string;
  to: string;
};

export type ReportMetadataBase = {
  reportType: ReportType;
  period?: ReportPeriod;
  previousPeriod?: { from: string; to: string };
  scope: { type: ReportScopeType | string; id: string; name: string };
  hierarchy: ReportHierarchy;
  definitions: Record<string, string>;
};

export type MetricWithTrend = {
  value: number;
  percentage: number | null;
  trend: "up" | "down" | "flat";
  trendChangePct: number | null;
};

export type ReportScopeQueryParams = {
  websiteId?: string;
  companyId?: string;
  parentCompanyId?: string;
  resellerId?: string;
};

export type ReportPeriodQueryParams = {
  year?: number;
  month?: number;
  from?: string;
  to?: string;
  monthCount?: number;
};

export type ReportPaginationParams = {
  page?: number;
  limit?: number;
  all?: boolean;
};

export type MonthlyChatSummaryResponse = {
  reportMetadata: ReportMetadataBase & {
    reportType: "monthly_chat_summary";
    period: ReportPeriod;
    previousPeriod: { from: string; to: string };
  };
  accountSummary: {
    visitors: { total: MetricWithTrend; mobile: MetricWithTrend; desktop: MetricWithTrend };
    chats: { total: MetricWithTrend; mobile: MetricWithTrend; desktop: MetricWithTrend };
    meaningfulChats: { total: MetricWithTrend; mobile: MetricWithTrend; desktop: MetricWithTrend };
  };
  topMetrics: {
    updatesReceived: MetricWithTrend;
    qualityCoverage: MetricWithTrend;
  };
  systemInformation: {
    serviceUptimePercentage: MetricWithTrend;
    teamStrength: MetricWithTrend;
    avgChatPopupTimeSeconds: MetricWithTrend;
  };
  departmentDistribution: Array<{
    distributionDepartmentId: string;
    department: string;
    count: number;
  }>;
  trafficTrends: {
    weekdays: Array<{ hour: number; label: string; count: number }>;
    weekends: Array<{ hour: number; label: string; count: number }>;
  };
  meaningfulChatsWithContacts: {
    mobile: MetricWithTrend;
    outOfMeaningfulChats: MetricWithTrend;
    desktop: MetricWithTrend;
    label: string;
    previousMeaningfulTotal: number;
  };
  performance: {
    negativeClientFeedback: MetricWithTrend;
    positiveClientFeedback: MetricWithTrend;
    distributionWrapUpsSent: MetricWithTrend;
    qaAchievements: MetricWithTrend;
  };
  chatCloseOutcomes: {
    completed: MetricWithTrend;
    spam: MetricWithTrend;
    auto: MetricWithTrend;
    supervisor: MetricWithTrend;
    unset: MetricWithTrend;
    spamByCategory: Record<string, MetricWithTrend>;
  };
  topSources: {
    topTrafficSources: Array<{ source: string; value: number; percentage: number }>;
    topChatSources: Array<{ source: string; value: number; percentage: number }>;
  };
  chatsToLeadComparison: Array<{
    monthName: string;
    totalChats: number;
    billableChats: number;
    billableRatio: number | null;
  }>;
};

export type TrafficConversionRow = {
  websiteId: string;
  domainName: string;
  websiteUrl: string;
  uniqueVisitors: number;
  greets: number;
  notGreeted: number;
  chats: number;
  meaningfulChats: number;
  visitorToChatRatio: number | null;
  greetToChatRatio: number | null;
  chatToMeaningfulChatsRatio: number | null;
};

export type TrafficConversionRatiosResponse = {
  reportMetadata: ReportMetadataBase & { reportType: "traffic_chat_conversion_ratios"; period: ReportPeriod };
  rows: TrafficConversionRow[];
  totals: TrafficConversionRow;
};

export type ChatTranscriptItem = {
  conversationId: string;
  chatId: string;
  userName: string | null;
  visitorName: string;
  domainName: string;
  websiteId: string;
  websiteUrl: string;
  day: string;
  chatStartTime: string;
  chatEndTime: string | null;
  startedAt: string;
  endedAt: string | null;
  department: string | null;
  departmentId: string | null;
  leadType: "Billable" | "Closed";
  chatTranscript: { label: string; url: string };
  source: { label: string; url: string | null };
};

export type ChatTranscriptsReportParams = ReportScopeQueryParams &
  ReportPeriodQueryParams &
  ReportPaginationParams & {
    leadType?: "Billable" | "Closed";
  };

export type ChatTranscriptsReportResponse = {
  reportMetadata: ReportMetadataBase & {
    reportType: "chat_transcripts_report";
    period: ReportPeriod;
    relatedApis: {
      listTranscripts: string;
      transcriptDetail: string;
    };
  };
  items: ChatTranscriptItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type VisitorInfoWithTranscriptItem = {
  conversationId: string;
  visitorId: string;
  chatId: string;
  fullName: string;
  chatStartTime: string;
  country: string;
  state: string;
  city: string;
  phone: string;
  email: string;
  leadSource: string;
  departmentName: string | null;
  companyName: string | null;
  pageChatStarted: string | null;
  visitorReferrer: string | null;
  chatTranscript: { label: string; url: string };
};

export type VisitorInfoWithTranscriptReportParams = ChatTranscriptsReportParams;

export type VisitorInfoWithTranscriptReportResponse = {
  reportMetadata: ReportMetadataBase & {
    reportType: "visitor_info_with_transcript";
    period: ReportPeriod;
    relatedApis: {
      listTranscripts: string;
      transcriptDetail: string;
    };
  };
  items: VisitorInfoWithTranscriptItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type WebsiteDistributionItem = {
  websiteId: string;
  distributionSetupId: string;
  distributionDepartmentId: string;
  recipientId: string;
  domainName: string;
  websiteUrl: string;
  departmentName: string;
  addressType: "To" | "Cc" | "Bcc";
  emailForm: string | null;
  emailAddress: string;
  distributionMethod: string;
  setupIsActive: boolean;
};

export type WebsiteDistributionReportResponse = {
  reportMetadata: ReportMetadataBase & {
    reportType: "website_distribution_report";
    relatedApis: {
      distributionSetups: string;
      distributionSetupDetail: string;
    };
    websiteCount: number;
    rowCount: number;
  };
  items: WebsiteDistributionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type MonthWiseChatCountResponse = {
  reportMetadata: ReportMetadataBase & {
    reportType: "month_wise_chat_count";
    title: string;
    companyName: string;
    period: ReportPeriod;
    websiteCount: number;
  };
  months: Array<{
    monthKey: string;
    monthLabel: string;
    visitors: number;
    totalChats: number;
    billableChats: number;
    isPartialMonth: boolean;
    period: { from: string; to: string };
  }>;
  chart: {
    yAxis: { type: "logarithmic"; title: string };
    categories: string[];
    series: Array<{
      key: "visitors" | "totalChats" | "billableChats";
      name: string;
      color: string;
      marker: "circle" | "triangle" | "square";
      data: number[];
    }>;
  };
};

export type ReportConfigurationRecipient = {
  id?: string;
  email: string;
  recipientType: string | null;
};

export type ReportConfigurationSchedule = {
  id?: string;
  scheduleType: "weekly" | "monthly" | null;
  dayOfWeek: number | null;
  dayOfWeekLabel?: string;
  dayOfMonth: number | null;
  scheduleTime: string | null;
  nextRun: string | null;
  isActive: boolean;
};

export type ReportConfiguration = {
  id: string;
  reportType: ReportType;
  template: { id: string; name: string; reportType: string | null } | null;
  scope: {
    resellerId: string | null;
    parentCompanyId: string | null;
    companyId: string | null;
    websiteId: string | null;
    departmentId: string | null;
  };
  recipients: ReportConfigurationRecipient[];
  schedules: ReportConfigurationSchedule[];
  createdBy: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type CreateReportConfigurationBody = {
  resellerId?: string;
  parentCompanyId?: string;
  companyId?: string;
  websiteId?: string;
  departmentId?: string;
  reportType?: ReportType;
  recipients: ReportConfigurationRecipient[];
  schedule: {
    scheduleType: "weekly" | "monthly";
    dayOfMonth?: number;
    dayOfWeek?: number;
    scheduleTime: string;
    isActive: boolean;
  };
};

export type UpdateReportConfigurationBody = Partial<CreateReportConfigurationBody>;

export type GenerateReportBody = {
  month?: number;
  year?: number;
  sendEmail?: boolean;
};

export type GenerateReportResponse = {
  generatedReportId: string;
  reportFileUrl: string;
  reportData: MonthlyChatSummaryResponse;
  delivery: { sent: number; failed: number };
};

export type GeneratedReportListItem = {
  id: string;
  reportConfigId: string;
  reportFileUrl: string | null;
  format: "json" | null;
  generatedAt: string;
  generatedBy: string | null;
};

export type ShareGeneratedReportBody = {
  emails: string[];
  message?: string;
};

export type ShareGeneratedReportResponse = {
  sent: number;
  failed: number;
};
