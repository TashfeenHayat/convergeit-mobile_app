import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDepartment,
  getDepartment,
  listDepartments,
  softDeleteDepartment,
  updateDepartment,
} from "@/api/hrms";
import type { JsonRecord } from "@/api/types/common.types";
import { hrmsDepartmentsKeys } from "./keys";

export function useDepartmentsListQuery(
  params?: JsonRecord,
  options?: { enabled?: boolean; /** Extra cache segment (not sent to API). */ scope?: string },
) {
  const scope = options?.scope ?? "default";
  return useQuery({
    queryKey: [...hrmsDepartmentsKeys.list(params), scope] as const,
    queryFn: () => listDepartments(params),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

export function useDepartmentQuery(
  id: string | undefined,
  options?: { enabled?: boolean; scope?: string; /** Avoid duplicate toast when errors are shown inline (e.g. modal). */ skipGlobalToast?: boolean },
) {
  const trimmed = id?.trim() ?? "";
  const scope = options?.scope ?? "default";
  return useQuery({
    queryKey: [...hrmsDepartmentsKeys.detail(trimmed), scope] as const,
    queryFn: () => getDepartment(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
    meta: options?.skipGlobalToast ? { skipGlobalToast: true } : undefined,
  });
}

export function useCreateDepartmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: JsonRecord) => createDepartment(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hrmsDepartmentsKeys.all });
    },
  });
}

export function useUpdateDepartmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body: JsonRecord }) => updateDepartment(vars.id, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hrmsDepartmentsKeys.all });
    },
  });
}

export function useSoftDeleteDepartmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => softDeleteDepartment(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hrmsDepartmentsKeys.all });
    },
  });
}
