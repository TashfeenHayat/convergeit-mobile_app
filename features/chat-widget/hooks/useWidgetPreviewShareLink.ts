import { useCallback, useEffect, useState } from "react";
import {
  getWidgetPreviewShareLink,
  type WidgetPreviewShareLink,
} from "@/api/widgets/widgets.api";
import { buildWidgetPublicTestPageUrl } from "@/lib/chat-widget/widget-sandbox-url";
import { resolveWidgetEmbedAppOrigin } from "@/lib/chat-widget/widget-embed-api-origin";

export function useWidgetPreviewShareLink(widgetKey: string) {
  const key = widgetKey.trim();
  const [data, setData] = useState<WidgetPreviewShareLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!key.startsWith("wgt_")) return null;
    setLoading(true);
    setError(null);
    try {
      const link = await getWidgetPreviewShareLink(key);
      setData(link);
      return link;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not load test link";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    void load();
  }, [load]);

  const publicTestUrl =
    data?.publicTestUrl?.trim() ||
    (data?.previewShareToken
      ? buildWidgetPublicTestPageUrl({
          widgetKey: key,
          previewShareToken: data.previewShareToken,
          appOrigin: resolveWidgetEmbedAppOrigin({
            browserOrigin:
              typeof window !== "undefined" ? window.location.origin : undefined,
          }),
        })
      : "");

  return {
    data,
    loading,
    error,
    publicTestUrl,
    previewShareToken: data?.previewShareToken ?? "",
    refresh: load,
  };
}
