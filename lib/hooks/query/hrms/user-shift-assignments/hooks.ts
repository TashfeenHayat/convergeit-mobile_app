import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createUserShiftAssignment, listUserShiftAssignments, removeUserShiftAssignment } from "@/api/hrms";
import type { JsonRecord } from "@/api/types/common.types";
import { hrmsUserShiftAssignmentsKeys } from "./keys";

export type HrmsUserShiftAssignmentsListParams = {
  userId: string;
  page?: number;
  limit?: number;
  all?: boolean;
};

export function useUserShiftAssignmentsListQuery(
  params: HrmsUserShiftAssignmentsListParams | undefined,
  options?: { enabled?: boolean; scope?: string },
) {
  const scope = options?.scope ?? "default";
  const enabled = (options?.enabled ?? true) && Boolean(params?.userId?.trim());
  const req = params as unknown as JsonRecord | undefined;
  return useQuery({
    queryKey: [...hrmsUserShiftAssignmentsKeys.list(req), scope] as const,
    queryFn: () => listUserShiftAssignments(req),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useCreateUserShiftAssignmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: JsonRecord) => createUserShiftAssignment(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: hrmsUserShiftAssignmentsKeys.all });
    },
  });
}

export function useRemoveUserShiftAssignmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeUserShiftAssignment(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: hrmsUserShiftAssignmentsKeys.all });
    },
  });
}

