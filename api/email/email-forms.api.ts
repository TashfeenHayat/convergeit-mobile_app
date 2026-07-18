import { apiClient } from "../http/axios-instance";
import { unwrapApiData } from "./unwrap-api-data";

export type EmailFormListItem = {
  id: string;
  websiteId: string;
  companyId: string;
  formType: "standard" | "custom" | string;
  formName: string | null;
  fieldCount: number;
  resellerName: string;
  parentCompany: string;
  childCompany: string;
  website: string;
  updatedAt: string | null;
};

export type EmailFormFieldRow = {
  fieldKey: string;
  label: string;
  fieldType: string;
  sortOrder: number;
  isRequired: boolean;
  enabled: boolean;
};

export type EmailFormDetail = {
  id?: string;
  websiteId: string;
  formType: "standard" | "custom";
  formName: string | null;
  fields: EmailFormFieldRow[];
};

export async function listEmailForms(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ items: EmailFormListItem[]; total: number; totalPages: number }> {
  const { data } = await apiClient.get("/email-forms", { params });
  const payload = unwrapApiData<{
    items: EmailFormListItem[];
    total: number;
    totalPages: number;
  }>(data);
  return payload;
}

export async function getEmailFormForWebsite(websiteId: string): Promise<EmailFormDetail> {
  const { data } = await apiClient.get(
    `/email-forms/by-website/${encodeURIComponent(websiteId)}`,
  );
  return unwrapApiData<EmailFormDetail>(data);
}

export async function upsertEmailForm(body: {
  websiteId: string;
  formType: "standard" | "custom";
  formName?: string;
  fields: { fieldKey: string; label: string; fieldType?: string; sortOrder?: number }[];
}): Promise<EmailFormDetail> {
  const { data } = await apiClient.put("/email-forms", body);
  return unwrapApiData<EmailFormDetail>(data);
}

export async function deleteEmailForm(id: string): Promise<{ deleted: boolean }> {
  const { data } = await apiClient.delete(`/email-forms/${encodeURIComponent(id)}`);
  return unwrapApiData<{ deleted: boolean }>(data);
}

export async function getEmailFormCatalog(): Promise<{
  fields: { key: string; label: string; fieldType: string; isRequired: boolean; sortOrder: number }[];
  requiredKeys: string[];
}> {
  const { data } = await apiClient.get("/email-forms/catalog");
  return unwrapApiData(data);
}
