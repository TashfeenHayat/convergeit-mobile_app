import type { AdminWidgetTableRow } from "@/api/types/widgets.types";
import type { JsonRecord } from "@/api/types/common.types";

export function parseWidgetListData(data: unknown): {
  items: JsonRecord[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
} {
  const d =
    typeof data === "object" && data !== null && !Array.isArray(data)
      ? (data as JsonRecord)
      : {};

  let items: unknown[] = [];
  if (Array.isArray(data)) items = data;
  else if (Array.isArray(d.items)) items = d.items;
  else if (Array.isArray(d.records)) items = d.records;

  const total =
    typeof d.total === "number" ? d.total : Array.isArray(items) ? items.length : 0;
  const page = typeof d.page === "number" && d.page >= 1 ? d.page : 1;
  const limit =
    typeof d.limit === "number" && d.limit > 0 ? d.limit : Math.max(items.length, 1);
  const totalPages =
    typeof d.totalPages === "number"
      ? Math.max(1, d.totalPages)
      : Math.max(1, Math.ceil(total / limit));

  return {
    items: items as JsonRecord[],
    page,
    limit,
    total,
    totalPages,
  };
}

export function mapAdminWidgetToTableRow(item: JsonRecord): AdminWidgetTableRow {
  const widgetKey = String(item.widgetKey ?? item.widget_key ?? "");
  const id = widgetKey || String(item.id ?? "");

  const websiteId = String(item.websiteId ?? "");
  const websiteObj = item.website as JsonRecord | undefined;
  const childCompanyObj = websiteObj?.childCompany as JsonRecord | undefined;
  const parentCompanyObj =
    (item.parentCompany as JsonRecord | undefined) ??
    (childCompanyObj?.parentCompany as JsonRecord | undefined);
  const resellerObj =
    (item.reseller as JsonRecord | undefined) ??
    (parentCompanyObj?.reseller as JsonRecord | undefined);

  const websiteLabel =
    typeof websiteObj?.hostname === "string"
      ? websiteObj.hostname
      : typeof websiteObj?.url === "string"
        ? websiteObj.url
        : typeof item.websiteUrl === "string"
          ? item.websiteUrl
          : typeof item.websiteName === "string"
            ? item.websiteName
            : websiteId || "—";

  const wt = String(item.widgetType ?? "CHAT").toUpperCase();
  let widgetTypeLabel = "Chat";
  if (wt === "TEXT_US") widgetTypeLabel = "Text Us";
  else if (wt === "BOTH") widgetTypeLabel = "Chat + Text";

  const surfaces = item.surfaces as JsonRecord | undefined;
  const chatEnabled = surfaces?.chatEnabled !== false;
  const textUsEnabled = surfaces?.textUsEnabled !== false;

  const isPublished =
    item.isPublished === true ||
    item.publishedAt != null ||
    item.published_at != null;
  const hasUnpublishedDraft =
    item.hasPendingDraft === true || item.hasUnpublishedDraft === true;

  let statusLabel = "Offline";
  if (isPublished && hasUnpublishedDraft) {
    statusLabel = "Live · pending publish";
  } else if (isPublished) {
    statusLabel = "Live";
  }

  return {
    id,
    widgetKey: widgetKey || id,
    websiteId,
    websiteLabel,
    parentCompany: String(
      item.parentCompanyName ??
        parentCompanyObj?.name ??
        item.parentCompany ??
        item.parentCompanyTitle ??
        "—",
    ),
    childCompany: String(
      item.childCompanyName ??
        childCompanyObj?.name ??
        item.childCompany ??
        item.childCompanyTitle ??
        "—",
    ),
    resellerName: String(
      item.resellerName ??
        resellerObj?.name ??
        item.clientName ??
        item.resellerTitle ??
        "—",
    ),
    widgetTypeLabel,
    publishedLabel: isPublished ? "Yes" : "—",
    draftPendingLabel: hasUnpublishedDraft ? "Pending" : "—",
    hasUnpublishedDraft,
    chatEnabled,
    textUsEnabled,
    statusLabel,
    raw: item,
  };
}
