import type { JsonRecord } from "@/api/types/common.types";
import {
  mapAdminWidgetToTableRow,
  parseWidgetListData,
} from "@/lib/chat-widget/admin-widget-list-mapper";
import type { ChatSettingsWebsiteOption } from "../types";

export function mapWidgetItemToSettingsWebsite(item: JsonRecord): ChatSettingsWebsiteOption | null {
  const row = mapAdminWidgetToTableRow(item);
  const websiteId = row.websiteId.trim();
  if (!websiteId) return null;

  const website = item.website as JsonRecord | undefined;
  const parent = item.parentCompany as JsonRecord | undefined;
  const child = item.childCompany as JsonRecord | undefined;

  return {
    websiteId,
    widgetKey: row.widgetKey,
    name: row.websiteLabel,
    url: String(website?.url ?? item.websiteUrl ?? item.websiteHostname ?? ""),
    parentCompanyId: String(
      item.parentCompanyId ?? parent?.id ?? website?.parentCompanyId ?? "",
    ),
    childCompanyId: String(item.childCompanyId ?? child?.id ?? website?.childCompanyId ?? ""),
    parentCompanyName: row.parentCompany,
    childCompanyName: row.childCompany,
    resellerName: row.resellerName,
  };
}

export function parseWidgetsListEnvelope(data: unknown): ChatSettingsWebsiteOption[] {
  const { items } = parseWidgetListData(data);
  const out: ChatSettingsWebsiteOption[] = [];
  for (const item of items) {
    const mapped = mapWidgetItemToSettingsWebsite(item);
    if (mapped) out.push(mapped);
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
