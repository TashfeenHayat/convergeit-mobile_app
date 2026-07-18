export type ChatReportQuery = {
  from?: string;
  to?: string;
  websiteId?: string;
  departmentId?: string;
};

export type ChatReportMetricBucket = {
  key: string;
  label: string;
  conversationCount: number;
  closedCount: number;
  avgFirstResponseSeconds: number | null;
  avgQueueSeconds: number | null;
  avgHandleSeconds: number | null;
  avgQaScore: number | null;
  avgCsatScore: number | null;
  takeoverCount: number;
};

export type ChatReportOverview = {
  range: { from: string; to: string };
  capped: boolean;
  summary: {
    conversationCount: number;
    closedCount: number;
    takeoverCount: number;
    avgFirstResponseSeconds: number | null;
    avgQueueSeconds: number | null;
    avgHandleSeconds: number | null;
    avgQaScore: number | null;
    avgCsatScore: number | null;
  };
  qa: {
    pending: number;
    inProgress: number;
    completed: number;
    avgOverallScore: number | null;
  };
  byDepartment: ChatReportMetricBucket[];
  byRoutingKey: ChatReportMetricBucket[];
  byAgent: ChatReportMetricBucket[];
};

export type QaQualityAgentRow = {
  key: string;
  label: string;
  reviewCount: number;
  avgScore: number | null;
  lowScoreCount: number;
  slowReplyChats: number;
  timelyResponseMisses: number;
  failureReasons: Record<string, number>;
};

export type QaQualityReport = {
  range: { from: string; to: string };
  slowReplyThresholdSeconds: number;
  summary: {
    completedReviews: number;
    avgQaScore: number | null;
    slowReplyChatCount: number;
    checklistMisses: Record<string, number>;
  };
  byAgent: QaQualityAgentRow[];
  byWebsite: Array<{
    key: string;
    label: string;
    reviewCount: number;
    avgScore: number | null;
    slowReplyChats: number;
  }>;
  recentIssues: Array<{
    conversationId: string;
    websiteLabel: string;
    agentLabel: string;
    poolName: string | null;
    overallScore: number | null;
    failureReason: string | null;
    slowReplyCount: number;
    maxReplySeconds: number | null;
    completedAt: string | null;
    routingKey: string | null;
  }>;
  reviewLog: Array<{
    conversationId: string;
    websiteLabel: string;
    agentLabel: string;
    qaReviewerLabel: string;
    poolName: string | null;
    overallScore: number | null;
    starRating: number | null;
    failureReason: string | null;
    slowReplyCount: number;
    maxReplySeconds: number | null;
    completedAt: string | null;
    routingKey: string | null;
  }>;
};
