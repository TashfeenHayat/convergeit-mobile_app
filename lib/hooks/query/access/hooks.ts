import { useQuery } from "@tanstack/react-query";
import { listPermissionsCatalog } from "@/api/access";
import { accessKeys } from "./keys";

export function usePermissionsCatalogQuery(
  params?: { groupByType?: boolean } | undefined,
  options?: { enabled?: boolean; scope?: string },
) {
  const scope = options?.scope ?? "default";
  return useQuery({
    queryKey: [...accessKeys.permissionsCatalog(), params, scope] as const,
    queryFn: () =>
      listPermissionsCatalog(
        params
          ? {
              // Backend expects `groupByType=1` (not boolean) for grouped output.
              groupByType: params.groupByType ? "1" : undefined,
            }
          : undefined,
      ),
    enabled: options?.enabled ?? true,
  });
}

