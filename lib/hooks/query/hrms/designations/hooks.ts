import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDesignation,
  getDesignation,
  listDesignations,
  softDeleteDesignation,
  updateDesignation,
} from "@/api/hrms";
import type { JsonRecord } from "@/api/types/common.types";
import { isSelectableDepartmentId } from "@/lib/hrms/department-ids";
import { hrmsDesignationsKeys } from "./keys";

function hasValidDesignationDepartmentFilter(params?: JsonRecord): boolean {
  if (!params) return true;
  const departmentId = params.departmentId;
  if (departmentId == null || String(departmentId).trim().length === 0) return true;
  return isSelectableDepartmentId(String(departmentId));
}

export function useDesignationsListQuery(
  params?: JsonRecord,
  options?: { enabled?: boolean; scope?: string },
) {
  const scope = options?.scope ?? "default";
  const departmentFilterOk = hasValidDesignationDepartmentFilter(params);
  return useQuery({
    queryKey: [...hrmsDesignationsKeys.list(params), scope] as const,
    queryFn: () => listDesignations(params),
    enabled: (options?.enabled ?? true) && departmentFilterOk,
    placeholderData: keepPreviousData,
  });
}

export function useDesignationQuery(
  id: string | undefined,
  options?: {
    enabled?: boolean;
    scope?: string;
    /** Avoid duplicate toast when errors are shown inline (e.g. modal). */
    skipGlobalToast?: boolean;
  },
) {
  const trimmed = id?.trim() ?? "";
  const scope = options?.scope ?? "default";
  return useQuery({
    queryKey: [...hrmsDesignationsKeys.detail(trimmed), scope] as const,
    queryFn: () => getDesignation(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
    meta: options?.skipGlobalToast ? { skipGlobalToast: true } : undefined,
  });
}

export function useCreateDesignationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: JsonRecord) => createDesignation(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hrmsDesignationsKeys.all });
    },
  });
}

export function useUpdateDesignationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body: JsonRecord }) => updateDesignation(vars.id, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hrmsDesignationsKeys.all });
    },
  });
}

export function useSoftDeleteDesignationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => softDeleteDesignation(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hrmsDesignationsKeys.all });
    },
  });
}
