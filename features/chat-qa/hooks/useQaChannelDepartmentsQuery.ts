import { useQuery } from "@tanstack/react-query";
import { listQaDirectoryDepartments } from "@/services/chat/qa-directory.api";
import type { DepartmentCatalogOption } from "@/features/chat-settings/utils/catalog";

export type QaChannelDepartmentsParams = {
  channel: "Internal" | "External";
  parentCompanyId?: string;
  resellerId?: string;
  requireResellerId?: boolean;
};

export function useQaChannelDepartmentsQuery(
  params: QaChannelDepartmentsParams,
  enabled = true,
) {
  const channel = params.channel;
  const parentCompanyId = params.parentCompanyId?.trim() ?? "";
  const resellerId = params.resellerId?.trim() || undefined;
  const isExternal = channel === "External";

  const scopeReady = isExternal
    ? Boolean(parentCompanyId) && (!params.requireResellerId || Boolean(resellerId))
    : !params.requireResellerId || Boolean(resellerId);

  return useQuery({
    queryKey: [
      "qa-directory-departments",
      channel,
      parentCompanyId,
      resellerId,
    ] as const,
    queryFn: async (): Promise<DepartmentCatalogOption[]> => {
      const rows = await listQaDirectoryDepartments({
        type: channel,
        ...(isExternal && parentCompanyId ? { parentCompanyId } : {}),
        ...(resellerId ? { resellerId } : {}),
      });
      return rows.map((d) => ({
        id: d.id,
        label: d.label,
        departmentType: channel,
      }));
    },
    enabled: enabled && scopeReady,
    staleTime: 60_000,
  });
}
