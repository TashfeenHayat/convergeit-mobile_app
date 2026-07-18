import { apiClient } from "../http/axios-instance";

export type IpBlockListItem = {
  id: string;
  websiteId: string;
  clientInfo: string;
  resellerId: string | null;
  parentCompany: string;
  parentCompanyId: string | null;
  childCompany: string;
  childCompanyId: string | null;
  website: string;
  ipAddress: string;
  status: string;
  reason: string | null;
  isActive: boolean;
  blockedDate: string;
  blockedBy: string;
  createdAt: string;
  updatedAt: string | null;
};

export type IpBlockListResponse = {
  items: IpBlockListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ListIpBlocksParams = {
  page?: number;
  limit?: number;
  search?: string;
  resellerId?: string;
  parentCompanyId?: string;
  childCompanyId?: string;
  websiteId?: string;
  status?: string;
  isActive?: boolean;
};

export type CreateIpBlocksBody = {
  websiteIds: string[];
  ipAddress: string;
  reason?: string;
  status?: string;
  isActive?: boolean;
};

export type UpdateIpBlockBody = {
  ipAddress?: string;
  reason?: string;
  status?: string;
  isActive?: boolean;
};

function unwrap<T>(data: unknown): T {
  const envelope = data as { success?: boolean; data?: T };
  if (envelope?.data !== undefined) return envelope.data as T;
  return data as T;
}

export async function listIpBlocks(
  params: ListIpBlocksParams,
): Promise<IpBlockListResponse> {
  const { data } = await apiClient.get("/ip-blocks", { params });
  return unwrap<IpBlockListResponse>(data);
}

export async function getIpBlock(id: string): Promise<IpBlockListItem> {
  const { data } = await apiClient.get(`/ip-blocks/${encodeURIComponent(id)}`);
  return unwrap<IpBlockListItem>(data);
}

export async function createIpBlocks(
  body: CreateIpBlocksBody,
): Promise<{ items: IpBlockListItem[]; count: number }> {
  const { data } = await apiClient.post("/ip-blocks", body);
  return unwrap<{ items: IpBlockListItem[]; count: number }>(data);
}

export async function updateIpBlock(
  id: string,
  body: UpdateIpBlockBody,
): Promise<IpBlockListItem> {
  const { data } = await apiClient.patch(
    `/ip-blocks/${encodeURIComponent(id)}`,
    body,
  );
  return unwrap<IpBlockListItem>(data);
}

export async function deleteIpBlock(
  id: string,
): Promise<{ deleted: boolean; id: string }> {
  const { data } = await apiClient.delete(`/ip-blocks/${encodeURIComponent(id)}`);
  return unwrap<{ deleted: boolean; id: string }>(data);
}
