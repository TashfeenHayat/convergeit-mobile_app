import { isRecord } from "@/lib/utils";
import type { JsonRecord } from "@/api/types/common.types";
import { widgetResponseData } from "@/api/widgets/widgets.api";
import { mapAdminWidgetResponseToWidgetDraft } from "./admin-widget-to-draft";
import { mergeWidgetConfigForEdit } from "./merge-widget-config-for-edit";
import type { WidgetDraft } from "./widgetDraft";

function pickRecord(...items: unknown[]): JsonRecord | null {
  for (const item of items) {
    if (isRecord(item)) return item;
  }
  return null;
}

/**
 * Maps `GET /widgets/:widgetKey/snapshot` into wizard `WidgetDraft` fields.
 * Uses current draft config; overlays published only for missing keys.
 */
export function mapWidgetSnapshotToWidgetDraft(
  snapshotPayload: unknown,
  widgetKey: string,
): Partial<WidgetDraft> {
  const snapshot = widgetResponseData<JsonRecord>(snapshotPayload as never);
  if (!isRecord(snapshot)) {
    return { remoteWidgetKey: widgetKey, widgetId: widgetKey };
  }

  const draftBlock = pickRecord(snapshot.draft);
  const publishedBlock = pickRecord(snapshot.published);
  const draftConfig = pickRecord(draftBlock?.config, snapshot.configSnapshot);
  const publishedConfig = pickRecord(publishedBlock?.config);
  const draftOverlay = pickRecord(draftBlock?.config, snapshot.draftConfig);
  const mergedConfig = mergeWidgetConfigForEdit(
    draftConfig ?? draftOverlay ?? {},
    publishedConfig,
  );

  const syntheticAdminShape: JsonRecord = {
    widgetKey: snapshot.widgetKey ?? widgetKey,
    websiteId: snapshot.websiteId ?? snapshot.website_id,
    widgetType: snapshot.widgetType ?? snapshot.widget_type,
    chatMode: mergedConfig.chatMode ?? mergedConfig.chat_mode ?? mergedConfig.mode,
    aiType:
      mergedConfig.aiType ??
      mergedConfig.ai_type ??
      snapshot.aiType ??
      snapshot.ai_type,
    allowedDomains: (() => {
      for (const raw of [
        snapshot.allowedDomains,
        snapshot.allowed_domains,
        mergedConfig.allowedDomains,
        mergedConfig.allowed_domains,
      ]) {
        if (!Array.isArray(raw)) continue;
        const list = raw
          .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
          .map((s) => s.trim());
        if (list.length) return list;
      }
      return undefined;
    })(),
    embedAllowAnyOrigin: snapshot.embedAllowAnyOrigin ?? snapshot.embed_allow_any_origin,
    config: mergedConfig,
  };

  return mapAdminWidgetResponseToWidgetDraft(syntheticAdminShape, widgetKey);
}
