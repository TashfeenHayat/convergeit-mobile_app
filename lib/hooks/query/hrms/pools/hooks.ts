import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPool, deletePool, listPools, updatePool } from "@/api/hrms";
import type { JsonRecord } from "@/api/types/common.types";
import { hrmsPoolsKeys } from "./keys";

export type HrmsPoolsListParams = {
  departmentId?: string;
  resellerId?: string;
  parentCompanyId?: string;
  departmentType?: "Internal" | "External";
  page?: number;
  limit?: number;
  all?: boolean;
  search?: string;
};

export function usePoolsListQuery(
  params: HrmsPoolsListParams | undefined,
  options?: { enabled?: boolean; scope?: string },
) {
  const scope = options?.scope ?? "default";
  const enabled = options?.enabled ?? true;
  const req = params as unknown as JsonRecord | undefined;
  return useQuery({
    queryKey: [...hrmsPoolsKeys.list(req), scope] as const,
    queryFn: () => listPools(req),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useCreatePoolMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: JsonRecord) => createPool(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: hrmsPoolsKeys.all });
    },
  });
}

export function useUpdatePoolMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body: JsonRecord }) => updatePool(vars.id, vars.body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: hrmsPoolsKeys.all });
    },
  });
}

export function useDeletePoolMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePool(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: hrmsPoolsKeys.all });
    },
  });
}

