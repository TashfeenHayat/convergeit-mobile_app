import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignDepartmentShift, listDepartmentShiftAssignments, removeDepartmentShiftAssignment } from "@/api/hrms";
import type { JsonRecord } from "@/api/types/common.types";
import { hrmsDepartmentShiftAssignmentsKeys } from "./keys";

export type HrmsDepartmentShiftAssignmentsListParams = {
  departmentId: string;
  page?: number;
  limit?: number;
  all?: boolean;
};

export function useDepartmentShiftAssignmentsListQuery(
  params: HrmsDepartmentShiftAssignmentsListParams | undefined,
  options?: { enabled?: boolean; scope?: string },
) {
  const scope = options?.scope ?? "default";
  const enabled = (options?.enabled ?? true) && Boolean(params?.departmentId?.trim());
  const req = params as unknown as JsonRecord | undefined;
  return useQuery({
    queryKey: [...hrmsDepartmentShiftAssignmentsKeys.list(req), scope] as const,
    queryFn: () => listDepartmentShiftAssignments(req),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useAssignDepartmentShiftMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: JsonRecord) => assignDepartmentShift(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: hrmsDepartmentShiftAssignmentsKeys.all });
    },
  });
}

export function useRemoveDepartmentShiftAssignmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeDepartmentShiftAssignment(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: hrmsDepartmentShiftAssignmentsKeys.all });
    },
  });
}

