import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getClientPermissions, putClientPermissions } from "@/api/companies/client-permissions.api";
import { isRecord, unwrapApiData } from "@/lib/utils/core";

export const clientPermissionsKeys = {
  all: ["companies", "client-permissions"] as const,
  parent: (parentCompanyId: string) =>
    [...clientPermissionsKeys.all, parentCompanyId] as const,
};

function extractPermissionNames(payload: unknown): string[] {
  const data = unwrapApiData(payload);
  const rec = isRecord(data) ? data : isRecord(payload) ? (payload as Record<string, unknown>) : null;
  if (!rec) return [];
  const raw =
    rec.permissionNames ?? rec.permissions ?? rec.names ?? rec.items;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((s) => s.trim());
}

export function useClientPermissionsQuery(
  parentCompanyId: string,
  options?: { enabled?: boolean },
) {
  const id = parentCompanyId.trim();
  return useQuery({
    queryKey: clientPermissionsKeys.parent(id),
    queryFn: () => getClientPermissions(id),
    enabled: (options?.enabled ?? true) && id.length > 0,
    select: extractPermissionNames,
  });
}

export function useReplaceClientPermissionsMutation(parentCompanyId: string) {
  const qc = useQueryClient();
  const id = parentCompanyId.trim();
  return useMutation({
    mutationFn: (permissionNames: string[]) =>
      putClientPermissions(id, { permissionNames }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: clientPermissionsKeys.parent(id) });
    },
  });
}
