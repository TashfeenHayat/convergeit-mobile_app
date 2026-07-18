import { apiClient } from "../http/axios-instance";

export type CrmConnectionMethod = {
  id: string;
  label: string;
  description: string;
  recommended?: boolean;
  available: boolean;
  comingSoonLabel?: string;
};

export type CrmSetupGuideStep = {
  order: number;
  title: string;
  body: string;
};

export type CrmPlatformConfigStep = {
  fieldKey: string;
  label: string;
  fieldType: "text" | "password" | "url";
  isRequired?: boolean;
  sensitive?: boolean;
  helpText?: string;
  methods: string[];
};

export type CrmPlatformField = {
  fieldKey: string;
  label: string;
  dataType?: string | null;
  isRequired?: boolean;
};

export type CrmDiscoveredFieldsResponse = {
  fields: CrmPlatformField[];
  source: "live_form" | "hubspot_api" | "dynamics365_api" | "power_automate_schema" | "gohighlevel_api" | "gohighlevel_webhook_schema";
  message?: string;
};

export type CrmPlatformItem = {
  id: string;
  code: string;
  name: string;
  connectionMethods: CrmConnectionMethod[];
  oauthRedirectUri?: string;
  setupGuide: Record<string, CrmSetupGuideStep[]>;
  configSteps: CrmPlatformConfigStep[];
  fields: CrmPlatformField[];
  standardOurFields: { fieldKey: string; label: string }[];
};

export type CrmFieldMapping = {
  id?: string;
  ourFieldKey: string;
  crmFieldKey: string;
  label?: string | null;
};

export type CrmIntegrationDetail = {
  id: string;
  companyId: string;
  websiteId?: string | null;
  platformCode: string;
  platformName: string;
  connectionMethod: string;
  config: Record<string, string>;
  configMasked: Record<string, string>;
  fieldMappings: CrmFieldMapping[];
  company: {
    id: string;
    name: string;
    parentCompanyId: string;
    parentCompanyName: string;
    resellerId: string;
    resellerName: string;
  } | null;
  createdAt: string;
  updatedAt: string | null;
};

export type CrmIntegrationListItem = {
  id: string;
  companyId: string;
  websiteId: string | null;
  clientOf: string;
  resellerId: string;
  parentCompany: string;
  parentCompanyId: string;
  childCompany: string;
  childCompanyId: string;
  website: string;
  platformCode: string;
  platformName: string;
  connectionMethod: string;
  connectionMethodLabel: string;
  mappingCount: number;
  createdAt: string;
  updatedAt: string | null;
};

export type CrmIntegrationListParams = {
  page?: number;
  limit?: number;
  search?: string;
  resellerId?: string;
  parentCompanyId?: string;
  childCompanyId?: string;
  platformCode?: string;
};

export type CrmIntegrationListResponse = {
  items: CrmIntegrationListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type UpsertCrmIntegrationBody = {
  companyId: string;
  platformCode: string;
  connectionMethod: string;
  config: Record<string, string>;
  websiteId?: string;
};

export type UpsertCrmFieldMappingsBody = {
  mappings: { ourFieldKey: string; crmFieldKey: string; label?: string }[];
};

export type TestCrmConnectionBody = {
  integrationId?: string;
  companyId?: string;
  platformCode?: string;
  connectionMethod?: string;
  config?: Record<string, string>;
  mappings?: { ourFieldKey: string; crmFieldKey: string; label?: string }[];
  formValues?: Record<string, string>;
};

function unwrap<T>(data: unknown): T {
  const envelope = data as { success?: boolean; data?: T };
  if (envelope?.data !== undefined) return envelope.data as T;
  return data as T;
}

export async function listCrmPlatforms(): Promise<{ items: CrmPlatformItem[] }> {
  const { data } = await apiClient.get("/crm/platforms");
  return unwrap<{ items: CrmPlatformItem[] }>(data);
}

export async function listCrmIntegrations(
  params?: CrmIntegrationListParams & { companyId?: string },
): Promise<CrmIntegrationListResponse> {
  const { data } = await apiClient.get("/crm/integrations", { params });
  return unwrap<CrmIntegrationListResponse>(data);
}

export async function lookupCrmIntegration(
  companyId: string,
  platformCode: string,
): Promise<CrmIntegrationDetail | null> {
  const { data } = await apiClient.get("/crm/integrations/lookup", {
    params: { companyId, platformCode },
  });
  return unwrap<CrmIntegrationDetail | null>(data);
}

export async function getCrmIntegration(id: string): Promise<CrmIntegrationDetail> {
  const { data } = await apiClient.get(`/crm/integrations/${encodeURIComponent(id)}`);
  return unwrap<CrmIntegrationDetail>(data);
}

export async function upsertCrmIntegration(
  body: UpsertCrmIntegrationBody,
): Promise<CrmIntegrationDetail> {
  const { data } = await apiClient.post("/crm/integrations", body);
  return unwrap<CrmIntegrationDetail>(data);
}

export async function upsertCrmFieldMappings(
  id: string,
  body: UpsertCrmFieldMappingsBody,
): Promise<CrmIntegrationDetail> {
  const { data } = await apiClient.put(
    `/crm/integrations/${encodeURIComponent(id)}/field-mappings`,
    body,
  );
  return unwrap<CrmIntegrationDetail>(data);
}

export async function discoverCrmFormFields(id: string): Promise<CrmDiscoveredFieldsResponse> {
  const { data } = await apiClient.get(
    `/crm/integrations/${encodeURIComponent(id)}/discover-fields`,
  );
  return unwrap<CrmDiscoveredFieldsResponse>(data);
}

export async function testCrmConnection(
  body: TestCrmConnectionBody,
): Promise<{ ok: boolean; message: string; testEmail?: string }> {
  const { data } = await apiClient.post("/crm/integrations/test-connection", body);
  return unwrap<{ ok: boolean; message: string; testEmail?: string }>(data);
}

export async function deleteCrmIntegration(id: string): Promise<{ deleted: boolean; id: string }> {
  const { data } = await apiClient.delete(`/crm/integrations/${encodeURIComponent(id)}`);
  return unwrap<{ deleted: boolean; id: string }>(data);
}
