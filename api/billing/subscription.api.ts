import { apiClient } from "../http/axios-instance";

export type ResellerSubscriptionModuleLine = {
  code: string;
  name: string;
  monthlyPrice: number;
  cyclePrice: number;
};

export type ResellerSubscriptionSummary = {
  resellerId: string;
  resellerName: string;
  planName: string;
  billingCycle: "monthly" | "yearly" | string;
  basePrice: string;
  price: string;
  currency: string;
  startDate: string;
  endDate: string;
  status: string;
  daysRemaining: number;
  showCountdown: boolean;
  paymentPending?: boolean;
  isExpired: boolean;
  modules: ResellerSubscriptionModuleLine[];
  modulesTotal: string;
};

export type UpsertResellerSubscriptionBody = {
  resellerId: string;
  planName: string;
  billingCycle: "monthly" | "yearly";
  /** Monthly platform base fee. Total is computed server-side as base + modules. */
  basePrice: number;
  /** @deprecated Prefer basePrice. Kept for older clients. */
  price?: number;
  currency?: string;
  startDate: string;
  endDate?: string;
  status?: string;
  notifyReseller?: boolean;
};

export type PlanPricingPreview = {
  basePrice: number;
  modulesTotalMonthly: number;
  modulesTotalCycle: number;
  total: number;
  billingCycle: string;
  lines: ResellerSubscriptionModuleLine[];
};

export type StripeCheckoutSession = {
  checkoutUrl: string | null;
  sessionId: string;
  publishableKey: string;
};

export async function getMyResellerSubscription() {
  const { data } = await apiClient.get<{
    success: boolean;
    data: ResellerSubscriptionSummary | null;
  }>("/resellers/me/subscription");
  return data;
}

export async function listPlatformResellerSubscriptions() {
  const { data } = await apiClient.get<{
    success: boolean;
    data: ResellerSubscriptionSummary[];
  }>("/platform/reseller-subscriptions");
  return data;
}

export async function previewPlatformResellerSubscriptionPricing(params: {
  resellerId: string;
  basePrice: number;
  billingCycle: string;
}) {
  const { data } = await apiClient.get<{
    success: boolean;
    data: PlanPricingPreview;
  }>("/platform/reseller-subscriptions/preview", {
    params: {
      resellerId: params.resellerId,
      basePrice: params.basePrice,
      billingCycle: params.billingCycle,
    },
  });
  return data;
}

export async function putPlatformResellerSubscription(body: UpsertResellerSubscriptionBody) {
  const { data } = await apiClient.put<{
    success: boolean;
    data: ResellerSubscriptionSummary;
  }>("/platform/reseller-subscriptions", body);
  return data;
}

export async function createResellerSubscriptionCheckout() {
  const { data } = await apiClient.post<{
    success: boolean;
    data: StripeCheckoutSession;
  }>("/resellers/me/subscription/checkout");
  return data;
}

export async function renewResellerSubscription(resellerId: string, endDate?: string) {
  const { data } = await apiClient.post<{
    success: boolean;
    data: ResellerSubscriptionSummary;
  }>(`/resellers/${encodeURIComponent(resellerId)}/subscription/renew`, {
    ...(endDate ? { endDate } : {}),
  });
  return data;
}
