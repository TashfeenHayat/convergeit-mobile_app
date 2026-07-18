import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignDepartmentHead, listDepartmentHeads, listDepartmentHeadsAttendance, removeDepartmentHead } from "@/api/hrms";
import type { JsonRecord } from "@/api/types/common.types";
import { hrmsDepartmentHeadsKeys } from "./keys";

export type HrmsDepartmentHeadsListParams = {
  departmentId?: string;
  resellerId?: string;
  parentCompanyId?: string;
  type?: "Internal" | "External";
  search?: string;
  page?: number;
  limit?: number;
  all?: boolean;
};

export type HrmsDepartmentHeadsAttendanceParams = {
  departmentId?: string;
  poolId?: string;
  date?: string;
  search?: string;
  page?: number;
  limit?: number;
  all?: boolean;
};

export function useDepartmentHeadsListQuery(
  params: HrmsDepartmentHeadsListParams | undefined,
  options?: { enabled?: boolean; scope?: string },
) {
  const enabled = options?.enabled ?? true;
  const scope = options?.scope ?? "default";
  const req = params as unknown as JsonRecord | undefined;
  return useQuery({
    queryKey: [...hrmsDepartmentHeadsKeys.list(req), scope] as const,
    queryFn: () => listDepartmentHeads(req),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useDepartmentHeadsAttendanceQuery(
  params: HrmsDepartmentHeadsAttendanceParams | undefined,
  options?: { enabled?: boolean; scope?: string },
) {
  const enabled = options?.enabled ?? true;
  const scope = options?.scope ?? "default";
  const req = params as unknown as JsonRecord | undefined;
  return useQuery({
    queryKey: [...hrmsDepartmentHeadsKeys.attendance(req), scope] as const,
    queryFn: () => listDepartmentHeadsAttendance(req),
    enabled: enabled && params != null,
    placeholderData: keepPreviousData,
  });
}

export function useAssignDepartmentHeadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: JsonRecord) => assignDepartmentHead(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: hrmsDepartmentHeadsKeys.all });
    },
  });
}

export function useRemoveDepartmentHeadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeDepartmentHead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: hrmsDepartmentHeadsKeys.all });
    },
  });
}

