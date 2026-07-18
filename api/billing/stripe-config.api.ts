import { apiClient } from "../http/axios-instance";

export type PlatformStripeConfig = {
  id: string;
  publishableKey: string | null;
  hasSecretKey: boolean;
  hasWebhookSecret: boolean;
  isEnabled: boolean;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
  webhookUrl?: string;
  webhookEvents?: string[];
};

export type UpsertPlatformStripeConfigBody = {
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  isEnabled?: boolean;
};

export async function getPlatformStripeConfig() {
  const { data } = await apiClient.get<{ success: boolean; data: PlatformStripeConfig }>(
    "/platform/stripe-config",
  );
  return data;
}

export async function putPlatformStripeConfig(body: UpsertPlatformStripeConfigBody) {
  const { data } = await apiClient.put<{ success: boolean; data: PlatformStripeConfig }>(
    "/platform/stripe-config",
    body,
  );
  return data;
}

export async function deletePlatformStripeConfig() {
  const { data } = await apiClient.delete<{ success: boolean; data: { cleared: boolean } }>(
    "/platform/stripe-config",
  );
  return data;
}

export type TestPlatformStripeConfigBody = {
  secretKey?: string;
};

export async function testPlatformStripeConfig(body?: TestPlatformStripeConfigBody) {
  const { data } = await apiClient.post<{ success: boolean; data: { ok: boolean } }>(
    "/platform/stripe-config/test",
    body ?? {},
  );
  return data;
}
