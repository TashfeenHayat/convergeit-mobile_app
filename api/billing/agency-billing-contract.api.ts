import { apiClient } from "../http/axios-instance";



export type BillingTotalsBreakdown = {

  billableChats: number;

  chargeableChats: number;

  chatCharges: number;

  platformFees: number;

  aiToolsFees: number;

  extraCharges: number;

  modulesFees: number;

  subtotal: number;

};



export type ResellerBillingContractView = {

  resellerId: string;

  resellerName: string;

  status: string;

  billingCycle: string;

  costPerChat: number;

  freeChatsPerMonth: number;

  monthlyChatsPerSite: number | null;

  platformFeeMonthly: number;

  aiToolsMonthly: number;

  modulesFeeMonthly: number;

  extraCharges: number;

  currency: string;

  invoiceToEmails: string | null;

  invoiceCcEmails: string | null;

  discountPercent: number | null;

  discountAmount: number | null;

  maxParentCompanies: number | null;

  clientBillingMode: string;

  clientTrialDays: number;

};



export type WebsiteBillingPreviewLine = {

  websiteId: string;

  websiteUrl: string;

  websiteName: string | null;

  childCompanyId: string;

  childCompanyName: string;

  billingStatus: string;

  trialEndDate: string | null;

  graceEndDate: string | null;

  totalChats: number;

  billableChats: number;

  chargeableChats: number;

  costPerChat: number;

  freeChatsPerMonth: number;

  monthlyChatsPerSite: number | null;

  platformFeeMonthly: number;

  aiToolsMonthly: number;

  modulesFeeMonthly: number;

  chatCharges: number;

  platformFee: number;

  aiToolsFee: number;

  extraCharges: number;

  modulesFee: number;

  lineTotal: number;

  moduleLines: Array<{ code: string; name: string; monthlyPrice: number }>;
};



export type ParentBillingPreview = {

  parentCompanyId: string;

  parentCompanyName: string;

  onAgencyContract: boolean;

  billingLimitMonthly: number | null;

  invoiceToEmails: string | null;

  invoiceCcEmails: string | null;

  websiteCount: number;

  subtotal: number;

  withinLimit: boolean;

  totals: BillingTotalsBreakdown;

  websites: WebsiteBillingPreviewLine[];

  existingInvoice: {
    id: string;
    invoiceNumber: string | null;
    status: string;
  } | null;

};



export type AgencyBillingPreview = {

  resellerId: string;

  resellerName: string;

  periodStart: string;

  periodEnd: string;

  currency: string;

  totalWebsites: number;

  parentCompanyCount: number;

  maxParentCompanies: number | null;

  withinParentCompanyLimit: boolean;

  agencyTotal: number;

  totals: BillingTotalsBreakdown;

  parents: ParentBillingPreview[];

  contract: ResellerBillingContractView;

  enabledModules: Array<{ code: string; name: string; monthlyPrice: number }>;
};



export type UpsertResellerBillingContractBody = {

  resellerId: string;

  status?: string;

  billingCycle?: string;

  costPerChat?: number;

  freeChatsPerMonth?: number;

  monthlyChatsPerSite?: number;

  platformFeeMonthly?: number;

  aiToolsMonthly?: number;

  modulesFeeMonthly?: number;

  extraCharges?: number;

  currency?: string;

  invoiceToEmails?: string;

  invoiceCcEmails?: string;

  discountPercent?: number;

  discountAmount?: number;

  maxParentCompanies?: number;

  clientBillingMode?: string;

  clientTrialDays?: number;

};



export type UpsertParentCompanyBillingProfileBody = {

  parentCompanyId: string;

  billingLimitMonthly?: number;

  invoiceToEmails?: string;

  invoiceCcEmails?: string;

  status?: string;

};



export type BillingPreviewParams = {

  resellerId: string;

  periodStart: string;

  periodEnd: string;

  parentCompanyId?: string;

  costPerChat?: number;

  freeChatsPerMonth?: number;

  monthlyChatsPerSite?: number;

  platformFeeMonthly?: number;

  aiToolsMonthly?: number;

  modulesFeeMonthly?: number;

  extraCharges?: number;

};



export type CreateParentInvoiceBody = {

  parentCompanyId: string;

  periodStart: string;

  periodEnd: string;

  notes?: string;

  issueNow?: boolean;

};



export async function getAgencyBillingContract(resellerId: string) {

  const { data } = await apiClient.get<{ success: boolean; data: ResellerBillingContractView }>(

    `/billing/agency-contracts/resellers/${encodeURIComponent(resellerId)}`,

  );

  return data;

}



export async function putAgencyBillingContract(body: UpsertResellerBillingContractBody) {

  const { data } = await apiClient.put<{ success: boolean; data: ResellerBillingContractView }>(

    "/billing/agency-contracts",

    body,

  );

  return data;

}



export async function putParentCompanyBillingProfile(body: UpsertParentCompanyBillingProfileBody) {

  const { data } = await apiClient.put<{

    success: boolean;

    data: {

      parentCompanyId: string;

      parentCompanyName: string;

      billingLimitMonthly: number | null;

      invoiceToEmails: string | null;

      invoiceCcEmails: string | null;

      status: string;

    };

  }>("/billing/agency-contracts/parent-profiles", body);

  return data;

}



export async function getAgencyBillingPreview(params: BillingPreviewParams) {

  const { data } = await apiClient.get<{ success: boolean; data: AgencyBillingPreview }>(

    "/billing/agency-contracts/preview",

    { params },

  );

  return data;

}



export async function createParentInvoice(body: CreateParentInvoiceBody) {

  const { data } = await apiClient.post<{ success: boolean; data: { invoiceId: string } }>(

    "/billing/agency-contracts/parent-invoices",

    body,

  );

  return data;

}

