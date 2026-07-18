import { apiClient } from "../http/axios-instance";

export type StartCrmOAuthParams = {
  companyId: string;
  platformCode: string;
  connectionMethod?: string;
  websiteId?: string;
  integrationId?: string;
};

function unwrap<T>(data: unknown): T {
  const envelope = data as { success?: boolean; data?: T };
  if (envelope?.data !== undefined) return envelope.data as T;
  return data as T;
}

export async function startCrmOAuth(
  platformCode: string,
  params: StartCrmOAuthParams,
): Promise<{ authorizeUrl: string; integrationId: string }> {
  const { data } = await apiClient.get(
    `/crm/oauth/${encodeURIComponent(platformCode)}/authorize`,
    {
      params: {
        companyId: params.companyId,
        connectionMethod: params.connectionMethod ?? "oauth",
        websiteId: params.websiteId,
        integrationId: params.integrationId,
      },
    },
  );
  return unwrap<{ authorizeUrl: string; integrationId: string }>(data);
}
