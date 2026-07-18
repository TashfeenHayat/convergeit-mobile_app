import { apiClient } from "../http/axios-instance";

export type InvoiceView = {
  id: string;
  invoiceNumber: string | null;
  status: string;
  currency: string | null;
  companyId: string;
  companyName: string;
  websiteId: string | null;
  websiteName: string | null;
  websiteUrl: string | null;
  resellerId: string | null;
  resellerName: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  totalChats: number | null;
  billableChats: number | null;
  freeChatsIncluded: number | null;
  costPerChat: number | null;
  platformFee: number | null;
  aiToolsFee: number | null;
  extraCharges: number | null;
  subtotal: number | null;
  discountAmount: number | null;
  totalAmount: number;
  issuedDate: string;
  dueDate: string | null;
  paidDate: string | null;
  notes: string | null;
  publicPaymentToken: string | null;
  parentCompanyId: string | null;
  parentCompanyName: string | null;
  isAgencySelfBill: boolean;
  lineItems: InvoiceLineItemView[];
};

export type InvoiceLineItemView = {
  id: string;
  websiteId: string;
  websiteUrl: string;
  websiteName: string | null;
  childCompanyName: string | null;
  totalChats: number;
  billableChats: number;
  chargeableChats: number;
  costPerChat: number | null;
  chatCharges: number;
  platformFee: number;
  aiToolsFee: number;
  extraCharges: number;
  modulesFee: number;
  lineTotal: number;
};

export type InvoiceList = {
  items: InvoiceView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CreateInvoiceBody = {
  websiteId: string;
  periodStart: string;
  periodEnd: string;
  extraCharges?: number;
  notes?: string;
  issueNow?: boolean;
  costPerChat?: number;
  freeChatsPerMonth?: number;
  platformFeeMonthly?: number;
  aiToolsMonthly?: number;
  modulesFeeMonthly?: number;
  monthlyChatsPerSite?: number;
};

export type WebsiteInvoicePreviewParams = {
  websiteId: string;
  periodStart: string;
  periodEnd: string;
  extraCharges?: number;
  costPerChat?: number;
  freeChatsPerMonth?: number;
  platformFeeMonthly?: number;
  aiToolsMonthly?: number;
  modulesFeeMonthly?: number;
  monthlyChatsPerSite?: number;
};

export type WebsiteInvoicePreview = {
  websiteId: string;
  websiteUrl: string;
  websiteName: string | null;
  companyId: string;
  companyName: string;
  parentCompanyId: string;
  parentCompanyName: string;
  currency: string;
  status: string;
  billingCycle: string;
  costPerChat: number;
  freeChatsPerMonth: number;
  platformFeeMonthly: number;
  aiToolsMonthly: number;
  modulesFeeMonthly: number;
  discountPercent: number | null;
  discountAmount: number | null;
  waiverAmount: number | null;
  totalChats: number;
  billableChats: number;
  chargeableChats: number;
  chatCharges: number;
  platformFee: number;
  aiToolsFee: number;
  extraCharges: number;
  modulesFee: number;
  subtotal: number;
  discountTotal: number;
  totalAmount: number;
  existingInvoice: {
    id: string;
    invoiceNumber: string | null;
    status: string;
  } | null;
};

export type InvoiceListParams = {
  page?: number;
  limit?: number;
  status?: string;
  billingKind?: "agency_self" | "client";
  resellerId?: string;
  parentCompanyId?: string;
  companyId?: string;
  websiteId?: string;
};

export async function listInvoices(params?: InvoiceListParams) {
  const { data } = await apiClient.get<{ success: boolean; data: InvoiceList }>(
    "/billing/invoices",
    { params },
  );
  return data;
}

export async function getInvoice(invoiceId: string) {
  const { data } = await apiClient.get<{ success: boolean; data: InvoiceView }>(
    `/billing/invoices/${encodeURIComponent(invoiceId)}`,
  );
  return data;
}

export async function createInvoice(body: CreateInvoiceBody) {
  const { data } = await apiClient.post<{ success: boolean; data: InvoiceView }>(
    "/billing/invoices",
    body,
  );
  return data;
}

export async function previewWebsiteInvoice(params: WebsiteInvoicePreviewParams) {
  const { data } = await apiClient.get<{ success: boolean; data: WebsiteInvoicePreview }>(
    "/billing/invoices/preview",
    { params },
  );
  return data;
}

export type UpdateInvoiceBody = {
  notes?: string;
  dueDate?: string;
  discountAmount?: number;
  totalAmount?: number;
  lineItems?: Array<{
    id: string;
    modulesFee?: number;
    platformFee?: number;
    aiToolsFee?: number;
    extraCharges?: number;
    chatCharges?: number;
  }>;
};

export async function updateInvoice(invoiceId: string, body: UpdateInvoiceBody) {
  const { data } = await apiClient.put<{ success: boolean; data: InvoiceView }>(
    `/billing/invoices/${encodeURIComponent(invoiceId)}`,
    body,
  );
  return data;
}

export async function issueInvoice(invoiceId: string) {
  const { data } = await apiClient.post<{ success: boolean; data: InvoiceView }>(
    `/billing/invoices/${encodeURIComponent(invoiceId)}/issue`,
  );
  return data;
}

export async function checkoutInvoice(invoiceId: string) {
  const { data } = await apiClient.post<{
    success: boolean;
    data: { checkoutUrl: string | null; sessionId: string };
  }>(`/billing/invoices/${encodeURIComponent(invoiceId)}/checkout`);
  return data;
}

export async function syncInvoicePayment(invoiceId: string) {
  const { data } = await apiClient.post<{
    success: boolean;
    data: { confirmed: boolean; invoiceId?: string };
  }>(`/billing/invoices/${encodeURIComponent(invoiceId)}/sync-payment`);
  return data;
}

export async function getPublicInvoice(token: string) {
  const { data } = await apiClient.get<{ success: boolean; data: InvoiceView }>(
    `/public/billing/invoices/${encodeURIComponent(token)}`,
  );
  return data;
}

export async function checkoutPublicInvoice(token: string) {
  const { data } = await apiClient.post<{
    success: boolean;
    data: { checkoutUrl: string | null; sessionId: string };
  }>(`/public/billing/invoices/${encodeURIComponent(token)}/checkout`);
  return data;
}

export type CheckoutConfirmResult = {
  confirmed: boolean;
  invoiceId?: string;
  invoice?: InvoiceView;
  confirmedBy?: "api" | "webhook" | "api_fallback" | "already_paid";
  webhookConfigured?: boolean;
  paymentStatus?: string;
  sessionStatus?: string;
  syncError?: string;
};

export async function confirmCheckoutSession(sessionId: string) {
  const { data } = await apiClient.post<{
    success: boolean;
    data: CheckoutConfirmResult;
  }>("/public/billing/checkout/confirm", { sessionId });
  return data;
}
