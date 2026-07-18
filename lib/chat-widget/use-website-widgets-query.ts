import { useQuery } from "@tanstack/react-query";
import { listAdminWidgets, widgetResponseData } from "@/api/widgets/widgets.api";
import {
  mapAdminWidgetToTableRow,
  parseWidgetListData,
} from "@/lib/chat-widget/admin-widget-list-mapper";
import type { WebsiteWidgetSummary } from "@/lib/chat-widget/widget-type-conflicts";

export function useWebsiteWidgetsQuery(websiteId: string | undefined, enabled = true) {
  const wid = websiteId?.trim() ?? "";
  return useQuery({
    queryKey: ["admin-widgets-by-website", wid],
    queryFn: async (): Promise<WebsiteWidgetSummary[]> => {
      const envelope = await listAdminWidgets({ websiteId: wid, all: true });
      const data = widgetResponseData(envelope);
      const parsed = parseWidgetListData(data);
      return parsed.items.map((item) => {
        const row = mapAdminWidgetToTableRow(item);
        return {
          widgetKey: row.widgetKey,
          widgetType: String(item.widgetType ?? item.widget_type ?? "CHAT"),
          widgetTypeLabel: row.widgetTypeLabel,
        };
      });
    },
    enabled: enabled && wid.length > 0,
    staleTime: 30_000,
  });
}
