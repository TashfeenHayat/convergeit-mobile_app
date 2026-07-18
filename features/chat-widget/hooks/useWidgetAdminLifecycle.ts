import { useCallback, useEffect, useState } from "react";
import type { JsonRecord } from "@/api/types/common.types";
import {
  getAdminWidget,
  publishWidget,
  unpublishWidget,
  widgetResponseData,
} from "@/api/widgets/widgets.api";
import {
  hasUnpublishedDraft,
  parseWidgetAdminMeta,
  widgetLifecycleStatusLabel,
  type WidgetAdminMeta,
} from "@/lib/chat-widget/widget-admin-meta";
import { extractApiErrorMessageForToast } from "@/lib/notify/extract-api-message";
import { publishAppToast } from "@/lib/notify";

export function useWidgetAdminLifecycle(widgetKey: string | undefined | null) {
  const key = widgetKey?.trim() ?? "";
  const [meta, setMeta] = useState<WidgetAdminMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!key) {
      setMeta(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminWidget(key);
      setMeta(parseWidgetAdminMeta(widgetResponseData<JsonRecord>(res)));
    } catch (e) {
      setMeta(null);
      setError(extractApiErrorMessageForToast(e) ?? "Failed to load widget status.");
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const publishLatest = useCallback(async () => {
    if (!key) return;
    setBusy(true);
    try {
      await publishWidget(key);
      publishAppToast({
        variant: "success",
        message: "Widget is live on customer sites.",
      });
      await refresh();
    } catch (e) {
      publishAppToast({
        variant: "error",
        message: extractApiErrorMessageForToast(e) ?? "Go live failed.",
      });
    } finally {
      setBusy(false);
    }
  }, [key, refresh]);

  const unpublishLatest = useCallback(async () => {
    if (!key) return;
    setBusy(true);
    try {
      await unpublishWidget(key);
      publishAppToast({
        variant: "success",
        message: "Widget taken offline. Real sites will not show it until you go live again.",
      });
      await refresh();
    } catch (e) {
      publishAppToast({
        variant: "error",
        message: extractApiErrorMessageForToast(e) ?? "Take offline failed.",
      });
    } finally {
      setBusy(false);
    }
  }, [key, refresh]);

  const isLive =
    meta?.deploy.state === "live" || meta?.deploy.state === "live_with_pending_draft";

  return {
    meta,
    loading,
    error,
    busy,
    refresh,
    publishLatest,
    unpublishLatest,
    isLive,
    statusLabel: meta ? widgetLifecycleStatusLabel(meta) : null,
    deployState: meta?.deploy.state ?? null,
    unpublishedDraft: meta ? hasUnpublishedDraft(meta) : false,
  };
}
