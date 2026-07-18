import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createResellerSubscriptionCheckout,
  getMyResellerSubscription,
  listPlatformResellerSubscriptions,
  previewPlatformResellerSubscriptionPricing,
  putPlatformResellerSubscription,
  renewResellerSubscription,
  type UpsertResellerSubscriptionBody,
} from "@/api/billing/subscription.api";
import {
  deletePlatformStripeConfig,
  getPlatformStripeConfig,
  putPlatformStripeConfig,
  testPlatformStripeConfig,
  type UpsertPlatformStripeConfigBody,
} from "@/api/billing/stripe-config.api";

import {
  checkoutInvoice,
  checkoutPublicInvoice,
  confirmCheckoutSession,
  createInvoice,
  getInvoice,
  getPublicInvoice,
  issueInvoice,
  listInvoices,
  previewWebsiteInvoice,
  syncInvoicePayment,
  updateInvoice,
  type CreateInvoiceBody,
  type InvoiceListParams,
  type UpdateInvoiceBody,
  type WebsiteInvoicePreviewParams,
} from "@/api/billing/invoice.api";
import {
  deleteResellerStripeConfig,
  getResellerBillingPolicy,
  putResellerStripeConfig,
  testResellerStripeConfig,
  type TestResellerStripeConfigBody,
  type UpsertResellerStripeConfigBody,
} from "@/api/billing/reseller-billing-policy.api";
import {
  getWebsiteBillingProfile,
  listWebsiteBillingProfiles,
  putWebsiteBillingProfile,
  type UpsertWebsiteBillingProfileBody,
} from "@/api/billing/website-billing-profile.api";
import {
  createParentInvoice,
  getAgencyBillingContract,
  getAgencyBillingPreview,
  putAgencyBillingContract,
  putParentCompanyBillingProfile,
  type BillingPreviewParams,
  type CreateParentInvoiceBody,
  type UpsertParentCompanyBillingProfileBody,
  type UpsertResellerBillingContractBody,
} from "@/api/billing/agency-billing-contract.api";

export const billingKeys = {
  all: ["billing"] as const,
  mySubscription: () => [...billingKeys.all, "my-subscription"] as const,
  platformSubscriptions: () => [...billingKeys.all, "platform-subscriptions"] as const,
  stripeConfig: () => [...billingKeys.all, "stripe-config"] as const,
  invoices: (params: InvoiceListParams) => [...billingKeys.all, "invoices", params] as const,
  invoice: (id: string) => [...billingKeys.all, "invoice", id] as const,
  publicInvoice: (token: string) => [...billingKeys.all, "public-invoice", token] as const,
  websiteInvoicePreview: (params: WebsiteInvoicePreviewParams) =>
    [...billingKeys.all, "website-invoice-preview", params] as const,
  websiteProfiles: (params: object) => [...billingKeys.all, "website-profiles", params] as const,
  websiteProfile: (websiteId: string) => [...billingKeys.all, "website-profile", websiteId] as const,
  resellerPolicy: (resellerId: string) => [...billingKeys.all, "reseller-policy", resellerId] as const,
  agencyContract: (resellerId: string) => [...billingKeys.all, "agency-contract", resellerId] as const,
  agencyPreview: (params: BillingPreviewParams) => [...billingKeys.all, "agency-preview", params] as const,
  planPreview: (params: { resellerId: string; basePrice: number; billingCycle: string }) =>
    [...billingKeys.all, "plan-preview", params] as const,
};

export function useMyResellerSubscriptionQuery(options?: {
  enabled?: boolean;
  refetchInterval?: number | false;
}) {
  return useQuery({
    queryKey: billingKeys.mySubscription(),
    queryFn: getMyResellerSubscription,
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
  });
}

export function usePlatformResellerSubscriptionsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: billingKeys.platformSubscriptions(),
    queryFn: listPlatformResellerSubscriptions,
    enabled: options?.enabled ?? true,
  });
}

export function usePlatformResellerPlanPreviewQuery(
  params: { resellerId: string; basePrice: number; billingCycle: string },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: billingKeys.planPreview(params),
    queryFn: () => previewPlatformResellerSubscriptionPricing(params),
    enabled: (options?.enabled ?? true) && Boolean(params.resellerId.trim()),
  });
}

export function usePlatformStripeConfigQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: billingKeys.stripeConfig(),
    queryFn: getPlatformStripeConfig,
    enabled: options?.enabled ?? true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

export function usePutPlatformStripeConfigMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertPlatformStripeConfigBody) => putPlatformStripeConfig(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.stripeConfig() });
    },
  });
}

export function useDeletePlatformStripeConfigMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePlatformStripeConfig,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.stripeConfig() });
    },
  });
}

export function useTestPlatformStripeConfigMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: testPlatformStripeConfig,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.stripeConfig() });
    },
  });
}

export function usePutPlatformResellerSubscriptionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertResellerSubscriptionBody) => putPlatformResellerSubscription(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.platformSubscriptions() });
      void qc.invalidateQueries({ queryKey: billingKeys.mySubscription() });
    },
  });
}

export function useCreateResellerCheckoutMutation() {
  return useMutation({
    mutationFn: createResellerSubscriptionCheckout,
  });
}

export function useRenewResellerSubscriptionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ resellerId, endDate }: { resellerId: string; endDate?: string }) =>
      renewResellerSubscription(resellerId, endDate),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.platformSubscriptions() });
      void qc.invalidateQueries({ queryKey: billingKeys.mySubscription() });
    },
  });
}

export function useInvoicesQuery(params: InvoiceListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: billingKeys.invoices(params),
    queryFn: () => listInvoices(params),
    enabled: options?.enabled ?? true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

export function useInvoiceQuery(invoiceId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: billingKeys.invoice(invoiceId),
    queryFn: () => getInvoice(invoiceId),
    enabled: options?.enabled ?? Boolean(invoiceId),
  });
}

export function useCreateInvoiceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateInvoiceBody) => createInvoice(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}

export function useWebsiteInvoicePreviewQuery(
  params: WebsiteInvoicePreviewParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: billingKeys.websiteInvoicePreview(params),
    queryFn: () => previewWebsiteInvoice(params),
    enabled: (options?.enabled ?? true) && Boolean(params.websiteId.trim()),
    staleTime: 0,
  });
}

export function useIssueInvoiceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => issueInvoice(invoiceId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}

export function useUpdateInvoiceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, body }: { invoiceId: string; body: UpdateInvoiceBody }) =>
      updateInvoice(invoiceId, body),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: billingKeys.all });
      void qc.invalidateQueries({ queryKey: billingKeys.invoice(vars.invoiceId) });
    },
  });
}

export function useSyncInvoicePaymentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => syncInvoicePayment(invoiceId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}

export function useCheckoutInvoiceMutation() {
  return useMutation({
    mutationFn: (invoiceId: string) => checkoutInvoice(invoiceId),
  });
}

export function usePublicInvoiceQuery(token: string, options?: { enabled?: boolean }) {
  const trimmed = token.trim();
  return useQuery({
    queryKey: billingKeys.publicInvoice(trimmed),
    queryFn: () => getPublicInvoice(trimmed),
    enabled: options?.enabled ?? trimmed.length > 0,
  });
}

export function useCheckoutPublicInvoiceMutation() {
  return useMutation({
    mutationFn: (token: string) => checkoutPublicInvoice(token.trim()),
  });
}

export function useConfirmCheckoutSessionMutation() {
  return useMutation({
    mutationFn: (sessionId: string) => confirmCheckoutSession(sessionId.trim()),
  });
}

export function useWebsiteBillingProfilesQuery(
  params: { resellerId?: string; parentCompanyId?: string; companyId?: string },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: billingKeys.websiteProfiles(params),
    queryFn: () => listWebsiteBillingProfiles(params),
    enabled: options?.enabled ?? true,
  });
}

export function useWebsiteBillingProfileQuery(websiteId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: billingKeys.websiteProfile(websiteId),
    queryFn: () => getWebsiteBillingProfile(websiteId),
    enabled: options?.enabled ?? Boolean(websiteId),
  });
}

export function usePutWebsiteBillingProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertWebsiteBillingProfileBody) => putWebsiteBillingProfile(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}

export function useResellerBillingPolicyQuery(resellerId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: billingKeys.resellerPolicy(resellerId),
    queryFn: () => getResellerBillingPolicy(resellerId),
    enabled: options?.enabled ?? Boolean(resellerId),
  });
}

export function usePutResellerStripeConfigMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      resellerId,
      body,
    }: {
      resellerId: string;
      body: UpsertResellerStripeConfigBody;
    }) => putResellerStripeConfig(resellerId, body),
    onSuccess: (_d, { resellerId }) => {
      void qc.invalidateQueries({ queryKey: billingKeys.resellerPolicy(resellerId) });
    },
  });
}

export function useDeleteResellerStripeConfigMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (resellerId: string) => deleteResellerStripeConfig(resellerId),
    onSuccess: (_d, resellerId) => {
      void qc.invalidateQueries({ queryKey: billingKeys.resellerPolicy(resellerId) });
    },
  });
}

export function useTestResellerStripeConfigMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      resellerId,
      body,
    }: {
      resellerId: string;
      body?: TestResellerStripeConfigBody;
    }) => testResellerStripeConfig(resellerId, body),
    onSuccess: (_d, { resellerId }) => {
      void qc.invalidateQueries({ queryKey: billingKeys.resellerPolicy(resellerId) });
    },
  });
}

export function useAgencyBillingContractQuery(resellerId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: billingKeys.agencyContract(resellerId),
    queryFn: () => getAgencyBillingContract(resellerId),
    enabled: options?.enabled ?? Boolean(resellerId),
  });
}

export function useAgencyBillingPreviewQuery(
  params: BillingPreviewParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: billingKeys.agencyPreview(params),
    queryFn: () => getAgencyBillingPreview(params),
    enabled: options?.enabled ?? Boolean(params.resellerId && params.periodStart && params.periodEnd),
  });
}

export function usePutAgencyBillingContractMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertResellerBillingContractBody) => putAgencyBillingContract(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}

export function usePutParentCompanyBillingProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertParentCompanyBillingProfileBody) => putParentCompanyBillingProfile(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}

export function useCreateParentInvoiceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateParentInvoiceBody) => createParentInvoice(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}
