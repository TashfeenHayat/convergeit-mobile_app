import { apiClient } from "../http/axios-instance";

export type DistributionSetupListItem = {
  id: string;
  websiteId: string;
  clientOf: string;
  resellerId: string | null;
  parentCompany: string;
  parentCompanyId: string | null;
  childCompany: string;
  childCompanyId: string | null;
  website: string;
  disMethod: string;
  department: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export type DistributionRecipientInput = {
  role: "TO" | "CC" | "BCC";
  email: string;
  sortOrder?: number;
};

export type DistributionDepartmentInput = {
  name: string;
  sortOrder?: number;
  recipients: DistributionRecipientInput[];
};

export type DistributionSetupDetail = {
  id: string;
  websiteId: string;
  method: string;
  subject: string | null;
  emailConfigurationId: string | null;
  isActive: boolean;
  clientOf: string;
  resellerId: string;
  parentCompany: string;
  parentCompanyId: string;
  childCompany: string;
  childCompanyId: string;
  website: string;
  departments: {
    id: string;
    name: string;
    sortOrder: number;
    recipients: { id: string; role: string; email: string; sortOrder: number }[];
  }[];
};

export type UpsertDistributionSetupBody = {
  websiteId: string;
  method?: string;
  subject?: string;
  emailConfigurationId?: string;
  isActive?: boolean;
  departments?: DistributionDepartmentInput[];
};

export type SendDistributionTestEmailBody = {
  websiteId: string;
  subject: string;
  departmentName: string;
  emailConfigurationId?: string;
  formValues?: Record<string, string>;
};

export type SendDistributionTestEmailResult = {
  sent: boolean;
  recipientCount: number;
  sendId: string;
  to: string[];
  cc: string[];
  bcc: string[];
};

export type DistributionSetupListResponse = {
  items: DistributionSetupListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ListDistributionSetupsParams = {
  page?: number;
  limit?: number;
  search?: string;
  resellerId?: string;
  parentCompanyId?: string;
  childCompanyId?: string;
  websiteId?: string;
  /** true = published/active only; false = draft only */
  isActive?: boolean;
};

export type DistributionAssignedWebsiteIdsResponse = {
  websiteIds: string[];
};

function unwrap<T>(data: unknown): T {
  const envelope = data as { success?: boolean; data?: T };
  if (envelope?.data !== undefined) return envelope.data as T;
  return data as T;
}

export async function listDistributionSetups(
  params: ListDistributionSetupsParams,
): Promise<DistributionSetupListResponse> {
  const { data } = await apiClient.get("/distribution-setups", { params });
  return unwrap<DistributionSetupListResponse>(data);
}

export async function getDistributionAssignedWebsiteIds(): Promise<DistributionAssignedWebsiteIdsResponse> {
  const { data } = await apiClient.get("/distribution-setups/assigned-website-ids");
  return unwrap<DistributionAssignedWebsiteIdsResponse>(data);
}

export async function getDistributionSetup(id: string): Promise<DistributionSetupDetail> {
  const { data } = await apiClient.get(`/distribution-setups/${encodeURIComponent(id)}`);
  return unwrap<DistributionSetupDetail>(data);
}

export async function createDistributionSetup(
  body: UpsertDistributionSetupBody,
): Promise<DistributionSetupDetail> {
  const { data } = await apiClient.post("/distribution-setups", body);
  return unwrap<DistributionSetupDetail>(data);
}

export async function updateDistributionSetup(
  id: string,
  body: UpsertDistributionSetupBody,
): Promise<DistributionSetupDetail> {
  const { data } = await apiClient.put(`/distribution-setups/${encodeURIComponent(id)}`, body);
  return unwrap<DistributionSetupDetail>(data);
}

export async function deleteDistributionSetup(id: string): Promise<{ deleted: boolean; id: string }> {
  const { data } = await apiClient.delete(`/distribution-setups/${encodeURIComponent(id)}`);
  return unwrap<{ deleted: boolean; id: string }>(data);
}

export async function sendDistributionTestEmail(
  body: SendDistributionTestEmailBody,
): Promise<SendDistributionTestEmailResult> {
  const { data } = await apiClient.post("/distribution-setups/test-email", body);
  return unwrap<SendDistributionTestEmailResult>(data);
}
