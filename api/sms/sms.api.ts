import { apiClient } from "../http/axios-instance";
import { unwrapApiData } from "../email/unwrap-api-data";

export type TwilioPhoneNumberOption = {
  sid: string;
  phoneNumber: string;
  friendlyName: string | null;
};

export type WebsiteSmsConfigListItem = {
  id: string;
  websiteId: string;
  accountSid: string;
  hasAuthToken: boolean;
  fromNumber: string;
  notifyToNumber: string;
  label: string | null;
  isEnabled: boolean;
  resellerName: string;
  parentCompany: string;
  childCompany: string;
  website: string;
  updatedAt: string | null;
};

export type WebsiteSmsConfigDetail =
  | { websiteId: string; configured: false }
  | {
      configured: true;
      id: string;
      websiteId: string;
      accountSid: string;
      hasAuthToken: boolean;
      fromNumber: string;
      notifyToNumber: string;
      label: string | null;
      isEnabled: boolean;
      lastTestedAt: string | null;
      lastTestStatus: string | null;
    };

export type UpsertWebsiteSmsConfigBody = {
  websiteId: string;
  accountSid?: string;
  authToken?: string;
  fromNumber: string;
  notifyToNumber: string;
  label?: string;
  isEnabled?: boolean;
};

export type TextUsSubmissionListItem = {
  id: string;
  websiteId: string;
  website: string;
  visitorName: string | null;
  visitorContact: string | null;
  fieldValues: Record<string, unknown>;
  status: string;
  createdAt: string;
};

export async function getWebsiteSmsConfigByWebsite(
  websiteId: string,
): Promise<WebsiteSmsConfigDetail> {
  const { data } = await apiClient.get(
    `/website-sms-configs/by-website/${encodeURIComponent(websiteId)}`,
  );
  return unwrapApiData<WebsiteSmsConfigDetail>(data);
}

export async function fetchWebsiteTwilioNumbers(body: {
  websiteId?: string;
  accountSid?: string;
  authToken?: string;
}): Promise<TwilioPhoneNumberOption[]> {
  const { data } = await apiClient.post("/website-sms-configs/fetch-numbers", body);
  const peeled = unwrapApiData<{ numbers: TwilioPhoneNumberOption[] }>(data);
  return peeled.numbers ?? [];
}

export async function listWebsiteSmsConfigs(params?: {
  page?: number;
  limit?: number;
  search?: string;
  websiteId?: string;
  resellerId?: string;
  parentCompanyId?: string;
  childCompanyId?: string;
}): Promise<{
  items: WebsiteSmsConfigListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const { data } = await apiClient.get("/website-sms-configs", { params });
  return unwrapApiData(data);
}

export async function upsertWebsiteSmsConfig(
  body: UpsertWebsiteSmsConfigBody,
): Promise<{
  id: string;
  websiteId: string;
  accountSid: string;
  hasAuthToken: boolean;
  fromNumber: string;
  notifyToNumber: string;
  label: string | null;
  isEnabled: boolean;
}> {
  const { data } = await apiClient.put("/website-sms-configs", body);
  return unwrapApiData(data);
}

export async function deleteWebsiteSmsConfig(id: string): Promise<void> {
  await apiClient.delete(`/website-sms-configs/${encodeURIComponent(id)}`);
}

export async function listTextUsSubmissions(params?: {
  websiteId?: string;
  page?: number;
  limit?: number;
}): Promise<{
  items: TextUsSubmissionListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const { data } = await apiClient.get("/website-sms-configs/submissions/list", {
    params,
  });
  return unwrapApiData(data);
}
