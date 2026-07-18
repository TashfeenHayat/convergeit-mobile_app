import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRole, getRole, getRolePermissions, listRoles, replaceRolePermissions, softDeleteRole, updateRole } from "@/api/roles";
import type { JsonRecord } from "@/api/types/common.types";
import { rolesKeys } from "./keys";

export function useRolesListQuery(params?: JsonRecord, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: rolesKeys.list(params),
    queryFn: () => listRoles(params),
    enabled: options?.enabled ?? true,
  });
}

export function useCreateRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: JsonRecord) => createRole(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  });
}

export function useUpdateRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body: JsonRecord }) => updateRole(vars.id, vars.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  });
}

export function useSoftDeleteRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => softDeleteRole(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  });
}

export function useRoleQuery(
  roleId: string | undefined,
  options?: { enabled?: boolean; scope?: string; skipGlobalToast?: boolean },
) {
  const trimmed = roleId?.trim() ?? "";
  const scope = options?.scope ?? "default";
  return useQuery({
    queryKey: [...rolesKeys.detail(trimmed), scope] as const,
    queryFn: () => getRole(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
    meta: options?.skipGlobalToast ? { skipGlobalToast: true } : undefined,
  });
}

export function useRolePermissionsQuery(
  roleId: string | undefined,
  options?: { enabled?: boolean; scope?: string; skipGlobalToast?: boolean },
) {
  const trimmed = roleId?.trim() ?? "";
  const scope = options?.scope ?? "default";
  return useQuery({
    queryKey: [...rolesKeys.permissions(trimmed), scope] as const,
    queryFn: () => getRolePermissions(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
    meta: options?.skipGlobalToast ? { skipGlobalToast: true } : undefined,
  });
}

export function useReplaceRolePermissionsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body: JsonRecord }) => replaceRolePermissions(vars.id, vars.body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: rolesKeys.permissions(vars.id) });
      void queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  });
}
