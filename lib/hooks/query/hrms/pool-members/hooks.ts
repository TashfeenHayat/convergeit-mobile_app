import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addPoolMember,
  addPoolMembersBulk,
  listPoolMembers,
  movePoolMember,
  removePoolMember,
} from "@/api/hrms";
import type { JsonRecord } from "@/api/types/common.types";
import { usersKeys } from "../../users";
import { hrmsPoolMembersKeys } from "./keys";

export type HrmsPoolMembersListParams = {
  all?: boolean;
  search?: string;
  page?: number;
  limit?: number;
};

function invalidatePoolMembers(qc: ReturnType<typeof useQueryClient>, poolId: string) {
  void qc.invalidateQueries({
    queryKey: [...hrmsPoolMembersKeys.all, poolId],
  });
}

export function usePoolMembersListQuery(
  poolId: string | undefined,
  params: HrmsPoolMembersListParams | undefined,
  options?: { enabled?: boolean; scope?: string },
) {
  const scope = options?.scope ?? "default";
  const enabled = (options?.enabled ?? true) && Boolean(poolId?.trim());
  const pid = poolId?.trim() ?? "";
  const req = params as unknown as JsonRecord | undefined;
  return useQuery({
    queryKey: [...hrmsPoolMembersKeys.list(pid, req), scope] as const,
    queryFn: () => listPoolMembers(pid, req),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useAddPoolMemberMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { poolId: string; userId: string }) =>
      addPoolMember(vars.poolId, vars.userId),
    onSuccess: (_data, vars) => {
      invalidatePoolMembers(qc, vars.poolId);
      void qc.invalidateQueries({ queryKey: hrmsPoolMembersKeys.all });
      void qc.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}

export function useAddPoolMembersBulkMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { poolId: string; userIds: string[] }) =>
      addPoolMembersBulk(vars.poolId, vars.userIds),
    onSuccess: (_data, vars) => {
      invalidatePoolMembers(qc, vars.poolId);
      void qc.invalidateQueries({ queryKey: hrmsPoolMembersKeys.all });
      void qc.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}

export function useMovePoolMemberMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { poolId: string; userId: string; targetPoolId: string }) =>
      movePoolMember(vars.poolId, vars.userId, { targetPoolId: vars.targetPoolId }),
    onSuccess: (_data, vars) => {
      invalidatePoolMembers(qc, vars.poolId);
      invalidatePoolMembers(qc, vars.targetPoolId);
      void qc.invalidateQueries({ queryKey: hrmsPoolMembersKeys.all });
      void qc.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}

export function useRemovePoolMemberMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { poolId: string; userId: string }) => removePoolMember(vars.poolId, vars.userId),
    onSuccess: (_data, vars) => {
      invalidatePoolMembers(qc, vars.poolId);
      void qc.invalidateQueries({ queryKey: hrmsPoolMembersKeys.all });
      void qc.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}
