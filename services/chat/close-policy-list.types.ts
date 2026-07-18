export interface ListClosePoliciesQuery {
  all?: boolean;
  resellerId?: string;
  parentCompanyId?: string;
  childCompanyId?: string;
  websiteId?: string;
  search?: string;
}

export interface ClosePolicyListSummary {
  enabled: boolean;
  visitorIdle: {
    enabled: boolean;
    nudgeAfterMinutes: number;
    closeAfterMinutes: number;
  };
  agentNoResponse: {
    enabled: boolean;
    firstAlertAgentAfterMinutes: number;
    fallbackToVisitorAfterMinutes: number;
    closeAfterMinutes: number;
  };
  supervisorClose: {
    enabled: boolean;
    requireReason: boolean;
  };
}

export interface ClosePolicyListRow {
  [key: string]: unknown;
  websiteId: string;
  websiteName?: string;
  websiteUrl?: string;
  resellerName?: string;
  resellerId?: string;
  parentCompanyName?: string;
  parentCompanyId?: string;
  childCompanyName?: string;
  childCompanyId?: string;
  hasCustomSettings: boolean;
  updatedAt: string | null;
  closePolicy: ClosePolicyListSummary;
}
