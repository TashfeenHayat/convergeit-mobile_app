import type { AuthApiUser as User } from "@/api/types/auth.types";

export type CompaniesTreeListParams = {
  page?: number;
  limit?: number;
  all?: boolean;
  search?: string;
  view?: "tree" | "flat";
  companyId?: string;
  resellerId?: string;
  parentCompanyId?: string;
  rootOnly?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type WebsiteScopeListParams = {
  all?: boolean;
  page?: number;
  limit?: number;
  assigned?: boolean;
  resellerId?: string;
  parentCompanyId?: string;
  childCompanyId?: string;
  userId?: string;
  search?: string;
};

export function getSessionResellerId(user: User | null | undefined): string | undefined {
  const id = user?.resellerId?.trim();
  return id || undefined;
}

export function mayPassResellerIdListFilter(user: User | null | undefined): boolean {
  return !getSessionResellerId(user);
}

export function buildCompaniesTreeListParams(
  resellerId: string,
  params: CompaniesTreeListParams | undefined,
  user: User | null | undefined,
): CompaniesTreeListParams {
  const base: CompaniesTreeListParams = { ...params };
  if (!mayPassResellerIdListFilter(user)) return base;
  const rid = resellerId.trim();
  if (!rid) return base;
  return { ...base, resellerId: rid };
}

export function buildWebsiteAssignmentsScopeParams(
  params: WebsiteScopeListParams | undefined,
  user: User | null | undefined,
): WebsiteScopeListParams | undefined {
  if (!params) return params;
  if (mayPassResellerIdListFilter(user)) return params;
  const rest = { ...params };
  delete rest.resellerId;
  return rest;
}
