import type { JsonRecord } from "@/api/types/common.types";
import { mapAdminWidgetResponseToWidgetDraft } from "./admin-widget-to-draft";
import { mergeWidgetConfigForEdit } from "./merge-widget-config-for-edit";
import { readWizardSaveTraceFromSession } from "./widget-wizard-save-trace";
import type { WidgetDraft } from "./widgetDraft";

const WIZARD_STEP_ORDER = ["button", "box", "notifications"] as const;

/** Merge PATCH `config` blobs from wizard save trace (steps 1→3), newest step wins per section. */
export function accumulateWizardInstallConfigFromSaveTrace(): JsonRecord {
  const entries = readWizardSaveTraceFromSession();
  let acc: JsonRecord = {};

  for (const stepKey of WIZARD_STEP_ORDER) {
    const entry = entries.find((e) => e.stepKey === stepKey);
    const cfg = entry?.requestBody?.config;
    if (cfg && typeof cfg === "object" && !Array.isArray(cfg)) {
      acc = mergeWidgetConfigForEdit(acc, cfg as JsonRecord);
    }
  }

  return acc;
}

/**
 * Build the publish draft from local wizard state + saved step PATCH bodies.
 * Step 4 must match steps 1–3 Network tab JSON, not a stale partial localStorage draft.
 */
export function mergeWizardDraftForPublish(draft: WidgetDraft): WidgetDraft {
  const accumulated = accumulateWizardInstallConfigFromSaveTrace();
  const widgetKey =
    draft.remoteWidgetKey?.trim() || draft.widgetId?.trim() || "wizard-draft";

  const hasTrace = Object.keys(accumulated).length > 0;
  if (!hasTrace) return draft;

  const fromTrace = mapAdminWidgetResponseToWidgetDraft(
    {
      config: accumulated,
      websiteId: draft.websiteId,
      widgetKey,
    },
    widgetKey,
  );

  return {
    ...draft,
    ...fromTrace,
    type:
      draft.type === "both" || draft.type === "text"
        ? draft.type
        : (draft.type ?? fromTrace.type ?? "chat"),
    websiteId: draft.websiteId ?? fromTrace.websiteId,
    remoteWidgetKey: draft.remoteWidgetKey ?? fromTrace.remoteWidgetKey,
    widgetId: draft.widgetId ?? fromTrace.widgetId,
    completed: draft.completed,
  };
}
