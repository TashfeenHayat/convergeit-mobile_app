import { apiClient } from "../http/axios-instance";

export type SocialMediaPlatformCode =
  | "facebook_messenger"
  | "instagram_dm"
  | "whatsapp";

export type SocialMediaConnectionItem = {
  id: string;
  websiteId: string;
  platform: SocialMediaPlatformCode;
  platformLabel: string;
  accountName: string | null;
  externalAccountId: string;
  pageId: string | null;
  instagramId: string | null;
  wabaId: string | null;
  status: string;
  webhookSubscribed: boolean;
  connectedDate: string;
  website: string;
  websiteName: string;
  clientOf: string;
  resellerId: string;
  childCompany: string;
  childCompanyId: string;
  parentCompany: string;
  parentCompanyId: string;
};

export type SocialMediaListParams = {
  page?: number;
  limit?: number;
  search?: string;
  resellerId?: string;
  websiteId?: string;
  childCompanyId?: string;
  parentCompanyId?: string;
  platform?: SocialMediaPlatformCode;
};

export type SocialMediaListResponse = {
  items: SocialMediaConnectionItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreateSocialMediaConnectionBody = {
  websiteId: string;
  platform: SocialMediaPlatformCode;
  externalAccountId: string;
  accountName?: string;
  pageId?: string;
  instagramId?: string;
  wabaId?: string;
  accessToken: string;
};

function unwrap<T>(data: unknown): T {
  const envelope = data as { success?: boolean; data?: T };
  if (envelope?.data !== undefined) return envelope.data as T;
  return data as T;
}

export async function listSocialMediaConnections(
  params?: SocialMediaListParams,
): Promise<SocialMediaListResponse> {
  const { data } = await apiClient.get("/social-media/connections", { params });
  const payload = unwrap<SocialMediaListResponse>(data);
  return {
    items: payload.items ?? [],
    pagination: payload.pagination ?? {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  };
}

export async function createSocialMediaConnection(
  body: CreateSocialMediaConnectionBody,
): Promise<SocialMediaConnectionItem> {
  const { data } = await apiClient.post("/social-media/connections", body);
  return unwrap<SocialMediaConnectionItem>(data);
}

export async function deleteSocialMediaConnection(
  id: string,
): Promise<{ id: string; disconnected: boolean }> {
  const { data } = await apiClient.delete(
    `/social-media/connections/${encodeURIComponent(id)}`,
  );
  return unwrap<{ id: string; disconnected: boolean }>(data);
}

export async function startMetaOAuth(params: {
  websiteId: string;
  platform: SocialMediaPlatformCode;
}): Promise<{ websiteId: string; authorizeUrl: string }> {
  const { data } = await apiClient.get("/social-media/oauth/start", {
    params,
  });
  return unwrap<{ websiteId: string; authorizeUrl: string }>(data);
}

export function uiPlatformToApi(
  platform: "facebook" | "instagram",
): SocialMediaPlatformCode {
  if (platform === "instagram") return "instagram_dm";
  return "facebook_messenger";
}

export function formatConnectedDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}
