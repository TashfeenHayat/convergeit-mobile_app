import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listAdminWidgets, widgetResponseData } from "@/api/widgets/widgets.api";
import { mapAdminWidgetToTableRow, parseWidgetListData } from "@/lib/chat-widget/admin-widget-list-mapper";
import { emptyChatScopeFilters, type ChatScopeFilterState } from "../types";

/**
 * Mobile-simplified scope filters — the web version drills reseller → parent
 * company → child company → website via platform-admin org-tree APIs that
 * are not wired into the mobile app yet. On mobile we scope chat by website
 * only (sourced from `GET /widgets`, already used by chat-settings), which
 * covers the agent/supervisor workflows this app targets. Reseller/company
 * fields are kept in the returned shape for prop compatibility with shared
 * scope-filter panels, but stay empty/disabled.
 */
export type UseChatScopeFiltersOptions = {
  apiEnabled?: boolean;
};

export function useChatScopeFilters(
  initial?: Partial<ChatScopeFilterState>,
  options?: UseChatScopeFiltersOptions,
) {
  const scopeApiEnabled = options?.apiEnabled ?? true;

  const [filters, setFilters] = useState<ChatScopeFilterState>(() => ({
    ...emptyChatScopeFilters(),
    ...initial,
  }));

  const websitesQuery = useQuery({
    queryKey: ["chat-scope-filters-websites"] as const,
    queryFn: async () => {
      const envelope = await listAdminWidgets({ all: true, widgetType: "CHAT" });
      const { items } = parseWidgetListData(widgetResponseData(envelope));
      return items.map(mapAdminWidgetToTableRow);
    },
    enabled: scopeApiEnabled,
    staleTime: 60_000,
  });

  const websiteOptions = useMemo(() => {
    const rows = websitesQuery.data ?? [];
    return [
      { value: "", label: "All websites" },
      ...rows
        .filter((w) => w.websiteId)
        .map((w) => ({ value: w.websiteId, label: w.websiteLabel || w.websiteId })),
    ];
  }, [websitesQuery.data]);

  const websiteIdsInScope = useMemo(() => {
    if (filters.websiteId.trim()) return new Set([filters.websiteId.trim()]);
    return null;
  }, [filters.websiteId]);

  const resetFilters = () => setFilters(emptyChatScopeFilters());

  const patchFilters = (patch: Partial<ChatScopeFilterState>) => {
    setFilters((p) => ({ ...p, ...patch }));
  };

  return {
    filters,
    setFilters,
    patchFilters,
    resetFilters,
    scopeApiEnabled,
    canFilterByResellerId: false,
    resellerOptions: [{ value: "", label: "All resellers" }],
    parentCompanyOptions: [{ value: "", label: "All parent companies" }],
    childCompanyOptions: [{ value: "", label: "All child companies" }],
    websiteOptions,
    websiteIdsInScope,
    companiesTreeLoading: false,
    websitesLoading: websitesQuery.isLoading,
  };
}
