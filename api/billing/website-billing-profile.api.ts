import { apiClient } from "../http/axios-instance";

export type WebsiteBillingProfileView = {
  id: string;
  websiteId: string;
  websiteName: string | null;
  websiteUrl: string;
  companyId: string;
  companyName: string;
  parentCompanyId: string;
  parentCompanyName: string;
  resellerId: string;
  status: string;
  billingCycle: string;
  trialEndDate: string | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  costPerChat: number | null;
  freeChatsPerMonth: number;
  monthlyChatsPerSite: number | null;
  modulesFeeMonthly: number | null;
  platformFeeMonthly: number | null;
  aiToolsMonthly: number | null;
  currency: string;
  invoiceToEmails: string | null;
  invoiceCcEmails: string | null;
  discountPercent: number | null;
  discountAmount: number | null;
  waiverAmount: number | null;
  parentOnAgencyContract: boolean;
};

export type UpsertWebsiteBillingProfileBody = {
  websiteId: string;
  status?: string;
  billingCycle?: string;
  trialEndDate?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  costPerChat?: number;
  freeChatsPerMonth?: number;
  monthlyChatsPerSite?: number;
  modulesFeeMonthly?: number;
  platformFeeMonthly?: number;
  aiToolsMonthly?: number;
  currency?: string;
  invoiceToEmails?: string;
  invoiceCcEmails?: string;
  discountPercent?: number;
  discountAmount?: number;
  waiverAmount?: number;
};

export async function listWebsiteBillingProfiles(params?: {
  resellerId?: string;
  parentCompanyId?: string;
  companyId?: string;
}) {
  const { data } = await apiClient.get<{
    success: boolean;
    data: WebsiteBillingProfileView[];
  }>("/billing/website-profiles", { params });
  return data;
}

export async function getWebsiteBillingProfile(websiteId: string) {
  const { data } = await apiClient.get<{
    success: boolean;
    data: WebsiteBillingProfileView;
  }>(`/billing/website-profiles/${encodeURIComponent(websiteId)}`);
  return data;
}

export async function putWebsiteBillingProfile(body: UpsertWebsiteBillingProfileBody) {
  const { data } = await apiClient.put<{
    success: boolean;
    data: WebsiteBillingProfileView;
  }>("/billing/website-profiles", body);
  return data;
}
