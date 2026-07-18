import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listAdminWidgets, widgetResponseData } from "@/api/widgets/widgets.api";
import { parseWidgetListData } from "@/lib/chat-widget/admin-widget-list-mapper";
import type { JsonRecord } from "@/api/types/common.types";

type ModalWebsiteRow = { websiteId: string; label: string; parentCompanyId: string };

function extractParentCompanyId(item: JsonRecord): string {
  const website = item.website as JsonRecord | undefined;
  const childCompany = website?.childCompany as JsonRecord | undefined;
  const parentCompanyObj =
    (item.parentCompany as JsonRecord | undefined) ?? (childCompany?.parentCompany as JsonRecord | undefined);
  return String(item.parentCompanyId ?? parentCompanyObj?.id ?? "").trim();
}

function websiteLabel(item: JsonRecord): string {
  const website = item.website as JsonRecord | undefined;
  const hostname = typeof website?.hostname === "string" ? website.hostname : null;
  const url = typeof website?.url === "string" ? website.url : null;
  return (
    hostname ||
    url ||
    (typeof item.websiteUrl === "string" ? item.websiteUrl : null) ||
    (typeof item.websiteName === "string" ? item.websiteName : null) ||
    String(item.websiteId ?? "Website")
  );
}

/**
 * Org + website picker for the Add modal only — independent from table filter
 * state. Sourced from `/widgets` (same as `chat-shared` scope filters); the
 * platform-admin website-assignments roster API used on web is not wired on
 * mobile, so the reseller → parent → child cascade collapses to a flat
 * website picker that still carries `parentCompanyId` for department scoping.
 */
export function useInvolvementModalScope(open: boolean) {
  const [websiteId, setWebsiteId] = useState("");

  const websitesQuery = useQuery({
    queryKey: ["involvement-modal-websites"] as const,
    queryFn: async (): Promise<ModalWebsiteRow[]> => {
      const envelope = await listAdminWidgets({ all: true, widgetType: "CHAT" });
      const { items } = parseWidgetListData(widgetResponseData(envelope));
      return items
        .map((item) => ({
          websiteId: String(item.websiteId ?? "").trim(),
          label: websiteLabel(item),
          parentCompanyId: extractParentCompanyId(item),
        }))
        .filter((w) => w.websiteId);
    },
    enabled: open,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!open) setWebsiteId("");
  }, [open]);

  const rows = websitesQuery.data ?? [];

  const websiteOptions = useMemo(
    () => [
      {
        value: "",
        label: websitesQuery.isLoading ? "Loading websites…" : rows.length ? "Select website…" : "No websites available",
      },
      ...rows.map((w) => ({ value: w.websiteId, label: w.label })),
    ],
    [rows, websitesQuery.isLoading],
  );

  const parentCompanyId = rows.find((w) => w.websiteId === websiteId)?.parentCompanyId ?? "";

  return {
    canFilterByResellerId: false,
    websiteId,
    setWebsiteId,
    websiteOptions,
    parentCompanyId,
    websitesLoading: websitesQuery.isLoading,
  };
}

export type InvolvementModalScope = ReturnType<typeof useInvolvementModalScope>;
