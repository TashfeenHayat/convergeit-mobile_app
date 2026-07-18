import { useQuery } from "@tanstack/react-query";
import { listDepartments } from "@/api/hrms/departments.api";
import type { DepartmentCatalogOption } from "@/features/chat-settings/utils/catalog";
import { parseDepartmentCatalog } from "@/features/chat-settings/utils/catalog";

const LIST_ALL = { all: true as const };

export type ChannelDepartmentsParams = {
  channel: "Internal" | "External";
  parentCompanyId?: string;
  resellerId?: string;
  /** Platform admin must pick reseller before loading departments. */
  requireResellerId?: boolean;
};

export function useChannelDepartmentsQuery(
  params: ChannelDepartmentsParams,
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
      "channel-departments",
      channel,
      parentCompanyId,
      resellerId,
    ] as const,
    queryFn: async (): Promise<DepartmentCatalogOption[]> => {
      const raw = await listDepartments({
        type: channel,
        ...(isExternal && parentCompanyId ? { parentCompanyId } : {}),
        ...(resellerId ? { resellerId } : {}),
        ...LIST_ALL,
      });
      return parseDepartmentCatalog(raw).map((d) => ({
        ...d,
        departmentType: channel,
      }));
    },
    enabled: enabled && scopeReady,
    staleTime: 60_000,
  });
}
