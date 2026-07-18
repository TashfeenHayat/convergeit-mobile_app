import { apiClient } from "../http/axios-instance";

export type ResellerBillingPolicyView = {
  resellerId: string;
  resellerName: string;
  webhookSlug: string;
  publishableKey: string | null;
  hasSecretKey: boolean;
  hasWebhookSecret: boolean;
  isEnabled: boolean;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
  webhookUrl: string;
  webhookEvents: string[];
  invoiceFromEmail: string | null;
  invoiceCcEmails: string | null;
  invoiceBccEmails: string | null;
};

export type UpsertResellerStripeConfigBody = {
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  isEnabled?: boolean;
};

export type TestResellerStripeConfigBody = {
  secretKey?: string;
};

export async function getResellerBillingPolicy(resellerId: string) {
  const { data } = await apiClient.get<{
    success: boolean;
    data: ResellerBillingPolicyView;
  }>(`/resellers/${encodeURIComponent(resellerId)}/billing/policy`);
  return data;
}

export async function putResellerStripeConfig(
  resellerId: string,
  body: UpsertResellerStripeConfigBody,
) {
  const { data } = await apiClient.put<{
    success: boolean;
    data: ResellerBillingPolicyView;
  }>(`/resellers/${encodeURIComponent(resellerId)}/billing/stripe-config`, body);
  return data;
}

export async function deleteResellerStripeConfig(resellerId: string) {
  const { data } = await apiClient.delete<{
    success: boolean;
    data: { cleared: boolean };
  }>(`/resellers/${encodeURIComponent(resellerId)}/billing/stripe-config`);
  return data;
}

export async function testResellerStripeConfig(
  resellerId: string,
  body?: TestResellerStripeConfigBody,
) {
  const { data } = await apiClient.post<{
    success: boolean;
    data: { ok: boolean };
  }>(
    `/resellers/${encodeURIComponent(resellerId)}/billing/stripe-config/test`,
    body ?? {},
  );
  return data;
}
