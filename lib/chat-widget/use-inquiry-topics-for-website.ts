import { useMemo } from "react";
import { useVisitorTopicsQuery } from "@/features/chat-settings/hooks/useServiceScheduling";
import { widgetInquiryFromSchedulingBundle } from "@/lib/chat-widget/visitor-topics.mapper";
import type { WidgetInquiryOption } from "@/lib/chat-widget/widget-inquiry.types";

/** Visitor inquire topics from GET visitor-topics (not service-scheduling). */
export function useInquiryTopicsForWebsite(
  websiteId: string | undefined,
  enabled: boolean,
) {
  const wid = websiteId?.trim() ?? "";
  const topicsQuery = useVisitorTopicsQuery(wid, enabled && wid.length > 0);

  const topicsFromScheduling = useMemo((): WidgetInquiryOption[] => {
    if (!topicsQuery.data) return [];
    return widgetInquiryFromSchedulingBundle(topicsQuery.data.topics);
  }, [topicsQuery.data]);

  return {
    topicsFromScheduling,
    topicsQuery,
    isLoading: wid.length > 0 && (topicsQuery.isLoading || topicsQuery.isFetching),
    loadedFromScheduling: topicsFromScheduling.length > 0,
  };
}
