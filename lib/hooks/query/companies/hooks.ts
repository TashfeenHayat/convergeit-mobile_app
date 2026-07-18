import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCompanySetupDraft,
  getCompaniesSetupResellers,
  getCompanySetupDraftById,
  getCompanySetupDraftLatest,
  abandonAllCompanySetupDrafts,
  listCompanySetupDrafts,
  listCompanyPocDirectory,
  listWebsiteDirectory,
  getParentCompany,
  listCompanies,
  submitCompanySetupDraft,
  updateCompany,
  updateCompanySetupDraft,
  updateParentCompany,
} from "@/api/companies";
import type { JsonRecord } from "@/api/types/common.types";
import { useAuth } from "@/lib/auth";
import {
  buildCompaniesTreeListParams,
  mayPassResellerIdListFilter,
} from "@/lib/companies/reseller-list-filter";
import { companiesKeys } from "./keys";

export type CompaniesListParams = {
  page?: number;
  limit?: number;
  /** When true, backend returns all rows (no pagination). */
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

export function useCompaniesListQuery(
  params?: CompaniesListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: companiesKeys.list(params),
    queryFn: () => listCompanies(params),
    enabled: options?.enabled ?? true,
  });
}

export function useCreateCompanySetupDraftMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: JsonRecord = {}) => createCompanySetupDraft(body),
    meta: { skipSuccessToast: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: companiesKeys.setupDraftLatest() });
      void queryClient.invalidateQueries({ queryKey: companiesKeys.setupDrafts() });
    },
  });
}

export function useUpdateCompanySetupDraftMutation(options?: { skipGlobalToast?: boolean }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body: JsonRecord }) =>
      updateCompanySetupDraft(vars.id, vars.body),
    meta: options?.skipGlobalToast
      ? { skipGlobalToast: true }
      : { skipSuccessToast: true },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: companiesKeys.setupDraft(vars.id),
      });
      void queryClient.invalidateQueries({ queryKey: companiesKeys.setupDraftLatest() });
      void queryClient.invalidateQueries({ queryKey: companiesKeys.setupDrafts() });
    },
  });
}

export function useSubmitCompanySetupDraftMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => submitCompanySetupDraft(id),
    meta: { skipSuccessToast: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: companiesKeys.all });
      void queryClient.invalidateQueries({ queryKey: companiesKeys.setupDraftLatest() });
      void queryClient.invalidateQueries({ queryKey: companiesKeys.setupDrafts() });
      void queryClient.invalidateQueries({ queryKey: companiesKeys.setupResellers() });
    },
  });
}

export function useCompanySetupDraftsListQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: companiesKeys.setupDrafts(),
    queryFn: () => listCompanySetupDrafts(),
    enabled: options?.enabled ?? true,
  });
}

export function useCompanyPocDirectoryQuery(
  params?: { page?: number; limit?: number; all?: boolean },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: companiesKeys.pocDirectory(params),
    queryFn: () => listCompanyPocDirectory(params),
    enabled: options?.enabled ?? true,
  });
}

export type WebsiteDirectoryParams = {
  page?: number;
  limit?: number;
  all?: boolean;
  search?: string;
  resellerId?: string;
  parentCompanyId?: string;
  childCompanyId?: string;
};

export function useWebsiteDirectoryQuery(
  params?: WebsiteDirectoryParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: companiesKeys.websiteDirectory(params),
    queryFn: () => listWebsiteDirectory(params),
    enabled: options?.enabled ?? true,
  });
}

export function useAbandonAllCompanySetupDraftsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => abandonAllCompanySetupDrafts(),
    meta: { skipSuccessToast: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: companiesKeys.setupDrafts() });
      void queryClient.invalidateQueries({ queryKey: companiesKeys.setupDraftLatest() });
    },
  });
}

export function useCompaniesByResellerQuery(
  resellerId: string,
  params?: CompaniesListParams,
  options?: { enabled?: boolean },
) {
  const { user } = useAuth();
  const rid = resellerId.trim();
  const mayPassResellerId = mayPassResellerIdListFilter(user);
  const listParams = buildCompaniesTreeListParams(resellerId, params, user);
  const queryKeyReseller = mayPassResellerId ? rid : "__session__";
  const enabledWhen = mayPassResellerId ? rid.length > 0 : (options?.enabled ?? true);
  return useQuery({
    queryKey: companiesKeys.byReseller(queryKeyReseller, listParams),
    queryFn: () => listCompanies(listParams),
    enabled: (options?.enabled ?? true) && enabledWhen,
  });
}

export function useCompaniesSetupResellersQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: companiesKeys.setupResellers(),
    queryFn: () => getCompaniesSetupResellers(),
    enabled: options?.enabled ?? true,
  });
}

export function useCompanySetupDraftLatestQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: companiesKeys.setupDraftLatest(),
    queryFn: () => getCompanySetupDraftLatest(),
    enabled: options?.enabled ?? true,
  });
}

export function useCompanySetupDraftByIdQuery(
  draftId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const id = draftId?.trim() ?? "";
  return useQuery({
    queryKey: companiesKeys.setupDraft(id),
    queryFn: () => getCompanySetupDraftById(id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}

export function useParentCompanyQuery(
  parentId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const id = parentId?.trim() ?? "";
  return useQuery({
    queryKey: companiesKeys.parent(id),
    queryFn: () => getParentCompany(id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}

export function useUpdateParentCompanyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { parentId: string; body: JsonRecord }) =>
      updateParentCompany(vars.parentId, vars.body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: companiesKeys.parent(vars.parentId) });
      void queryClient.invalidateQueries({ queryKey: companiesKeys.all });
    },
  });
}

export function useUpdateCompanyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { companyId: string; body: JsonRecord; parentIdForList?: string }) =>
      updateCompany(vars.companyId, vars.body),
    onSuccess: (_data, vars) => {
      if (vars.parentIdForList?.trim()) {
        void queryClient.invalidateQueries({
          queryKey: companiesKeys.parent(vars.parentIdForList.trim()),
        });
      }
      void queryClient.invalidateQueries({ queryKey: companiesKeys.all });
    },
  });
}
