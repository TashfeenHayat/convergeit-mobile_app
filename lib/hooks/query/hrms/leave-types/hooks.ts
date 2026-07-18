import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLeaveType, deleteLeaveType, listLeaveTypes, listLeaveTypesForApply, updateLeaveType } from "@/api/hrms";
import type { JsonRecord } from "@/api/types/common.types";
import { hrmsLeaveTypesKeys } from "./keys";

export type HrmsLeaveTypesListParams = {
  page?: number;
  limit?: number;
  all?: boolean;
  search?: string;
};

export function useLeaveTypesListQuery(params: HrmsLeaveTypesListParams | undefined, options?: { enabled?: boolean; scope?: string }) {
  const scope = options?.scope ?? "default";
  const enabled = options?.enabled ?? true;
  const req = params as unknown as JsonRecord | undefined;
  return useQuery({
    queryKey: [...hrmsLeaveTypesKeys.list(req), scope] as const,
    queryFn: () => listLeaveTypes(req),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useLeaveTypesForApplyQuery(params: HrmsLeaveTypesListParams | undefined, options?: { enabled?: boolean; scope?: string }) {
  const scope = options?.scope ?? "default";
  const enabled = options?.enabled ?? true;
  const req = params as unknown as JsonRecord | undefined;
  return useQuery({
    queryKey: [...hrmsLeaveTypesKeys.forApply(req), scope] as const,
    queryFn: () => listLeaveTypesForApply(req),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useCreateLeaveTypeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: JsonRecord) => createLeaveType(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: hrmsLeaveTypesKeys.all });
    },
  });
}

export function useUpdateLeaveTypeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body: JsonRecord }) => updateLeaveType(vars.id, vars.body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: hrmsLeaveTypesKeys.all });
    },
  });
}

export function useDeleteLeaveTypeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLeaveType(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: hrmsLeaveTypesKeys.all });
    },
  });
}

