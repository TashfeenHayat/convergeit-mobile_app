import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InternalSupervisorListQuery } from "@/services/chat/internal-supervisors-list.types";
import {
  listInternalSupervisorsInScope,
  saveInternalSupervisorPoolsForUser,
  saveInternalSupervisorsForParentCompany,
} from "@/services/chat/internal-supervisors.api";

export const internalSupervisorListKeys = {
  all: ["internal-supervisor-list"] as const,
  scope: (q: InternalSupervisorListQuery) =>
    [...internalSupervisorListKeys.all, "scope", q] as const,
};

export function useInternalSupervisorListQuery(
  query: InternalSupervisorListQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: internalSupervisorListKeys.scope(query),
    queryFn: () => listInternalSupervisorsInScope({ ...query, all: true }),
    enabled,
    staleTime: 30_000,
  });
}

export function useSaveInternalSupervisorForUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, poolIds }: { userId: string; poolIds: string[] }) =>
      saveInternalSupervisorPoolsForUser(userId, poolIds),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: internalSupervisorListKeys.all });
    },
  });
}

export function useSaveInternalSupervisorMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      parentCompanyId,
      items,
    }: {
      parentCompanyId: string;
      items: Array<{ userId: string; poolId: string; sortOrder?: number }>;
    }) => saveInternalSupervisorsForParentCompany(parentCompanyId, { items }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: internalSupervisorListKeys.all });
    },
  });
}
