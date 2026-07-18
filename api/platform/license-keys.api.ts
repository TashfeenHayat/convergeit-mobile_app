import { apiClient } from "../http/axios-instance";
import type { JsonRecord } from "../types/common.types";

export async function listPlatformLicenseKeys(
  params?: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.get("/platform/license-keys", { params });
  return data;
}

export async function generatePlatformLicenseKey(
  body: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.post(
    "/platform/license-keys/generate",
    body,
  );
  return data;
}

export type SendPlatformLicenseKeyBody = {
  parentCompanyId: string;
  audience?: "poc" | "all";
};

export type SendPlatformLicenseKeyResult = {
  parentCompanyId: string;
  resellerId: string;
  licenseKey: string;
  audience: "poc" | "all";
  attempted: number;
  sent: number;
};

export async function sendPlatformLicenseKey(
  body: SendPlatformLicenseKeyBody,
): Promise<{ success: boolean; data: SendPlatformLicenseKeyResult }> {
  const { data } = await apiClient.post<{ success: boolean; data: SendPlatformLicenseKeyResult }>(
    "/platform/license-keys/send",
    body,
  );
  return data;
}
