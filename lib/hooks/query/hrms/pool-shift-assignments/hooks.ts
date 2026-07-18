import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignPoolShift, listPoolShiftAssignments, removePoolShiftAssignment } from "@/api/hrms";
import type { JsonRecord } from "@/api/types/common.types";
import { hrmsPoolShiftAssignmentsKeys } from "./keys";

export type HrmsPoolShiftAssignmentsListParams = {
  /** When set, list assignments for that pool only. */
  poolId?: string;
  page?: number;
  limit?: number;
  /** When true (and no `poolId`), list assignments across pools (server-supported). */
  all?: boolean;
};

export function usePoolShiftAssignmentsListQuery(
  params: HrmsPoolShiftAssignmentsListParams | undefined,
  options?: { enabled?: boolean; scope?: string },
) {
  const scope = options?.scope ?? "default";
  const hasPool = Boolean(params?.poolId?.trim());
  const listAll = params?.all === true;
  const enabled = (options?.enabled ?? true) && Boolean(params) && (hasPool || listAll);
  const req = params as unknown as JsonRecord | undefined;
  return useQuery({
    queryKey: [...hrmsPoolShiftAssignmentsKeys.list(req), scope] as const,
    queryFn: () => listPoolShiftAssignments(req),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useAssignPoolShiftMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: JsonRecord) => assignPoolShift(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: hrmsPoolShiftAssignmentsKeys.all });
    },
  });
}

export function useRemovePoolShiftAssignmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removePoolShiftAssignment(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: hrmsPoolShiftAssignmentsKeys.all });
    },
  });
}

