import { apiClient } from "../http/axios-instance";
import type { JsonRecord } from "../types/common.types";
import type {
  CompaniesListResponseEnvelope,
  ParentCompanyDetailEnvelope,
  WebsiteDirectoryResponseEnvelope,
} from "../types/companies.types";

export async function listCompanies(
  params?: JsonRecord,
): Promise<CompaniesListResponseEnvelope> {
  const { data } = await apiClient.get<CompaniesListResponseEnvelope>(
    "/companies",
    { params },
  );
  return data;
}

/**
 * `GET /companies/by-reseller/{resellerId}` — platform/internal picker for one reseller tenant.
 * Query params match {@link listCompanies} (view, all, parentCompanyId, …) except `resellerId` (path only).
 */
export async function listCompaniesByReseller(
  resellerId: string,
  params?: JsonRecord,
): Promise<CompaniesListResponseEnvelope> {
  const rid = resellerId.trim();
  if (!rid) {
    return listCompanies(params);
  }
  const query = { ...(params ?? {}) } as JsonRecord & { resellerId?: string };
  delete query.resellerId;
  const { data } = await apiClient.get<CompaniesListResponseEnvelope>(
    `/companies/by-reseller/${encodeURIComponent(rid)}`,
    { params: query },
  );
  return data;
}

export async function getCompaniesSetupResellers(): Promise<unknown> {
  const { data } = await apiClient.get("/companies/setup/resellers");
  return data;
}

export async function createCompanySetupDraft(body: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.post("/companies/setup/draft", body);
  return data;
}

/** GET — latest in-progress draft for the current user (`data: null` if none). */
export async function getCompanySetupDraftLatest(): Promise<unknown> {
  const { data } = await apiClient.get("/companies/setup/draft/latest");
  return data;
}

export async function listCompanySetupDrafts(): Promise<unknown> {
  const { data } = await apiClient.get("/companies/setup/drafts");
  return data;
}

export async function listCompanyPocDirectory(query?: {
  page?: number;
  limit?: number;
  all?: boolean;
}): Promise<unknown> {
  const { data } = await apiClient.get("/companies/poc-directory", {
    params: query ?? {},
  });
  return data;
}

export async function listWebsiteDirectory(query?: {
  page?: number;
  limit?: number;
  all?: boolean;
  search?: string;
  resellerId?: string;
  parentCompanyId?: string;
  childCompanyId?: string;
}): Promise<WebsiteDirectoryResponseEnvelope> {
  const { data } = await apiClient.get<WebsiteDirectoryResponseEnvelope>(
    "/companies/website-directory",
    {
    params: query ?? {},
  });
  return data;
}

export async function abandonAllCompanySetupDrafts(): Promise<unknown> {
  const { data } = await apiClient.post("/companies/setup/drafts/abandon-all");
  return data;
}

/** GET — full run JSON for one draft id (owner only). */
export async function getCompanySetupDraftById(id: string): Promise<unknown> {
  const { data } = await apiClient.get(`/companies/setup/draft/${encodeURIComponent(id)}`);
  return data;
}

export async function updateCompanySetupDraft(
  id: string,
  body: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.patch(
    `/companies/setup/draft/${encodeURIComponent(id)}`,
    body,
  );
  return data;
}

export async function submitCompanySetupDraft(id: string): Promise<unknown> {
  const { data } = await apiClient.post(
    `/companies/setup/submit/${encodeURIComponent(id)}`,
  );
  return data;
}

export async function getParentCompany(id: string): Promise<ParentCompanyDetailEnvelope> {
  const { data } = await apiClient.get<ParentCompanyDetailEnvelope>(
    `/companies/parent/${encodeURIComponent(id)}`,
  );
  return data;
}

export async function updateParentCompany(
  id: string,
  body: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.patch(
    `/companies/parent/${encodeURIComponent(id)}`,
    body,
  );
  return data;
}

export async function updateCompany(id: string, body: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.patch(
    `/companies/${encodeURIComponent(id)}`,
    body,
  );
  return data;
}

export async function softDeleteCompany(id: string): Promise<unknown> {
  const { data } = await apiClient.delete(
    `/companies/${encodeURIComponent(id)}`,
  );
  return data;
}
