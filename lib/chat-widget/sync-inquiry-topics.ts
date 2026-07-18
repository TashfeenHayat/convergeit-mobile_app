import { saveVisitorTopics } from "@/services/chat/service-scheduling.api";
import {
  validateVisitorTopicsForSave,
  widgetInquiryToTopicInput,
} from "@/lib/chat-widget/visitor-topics.mapper";
import type { WidgetInquiryOption } from "@/lib/chat-widget/widget-inquiry.types";
import type { WidgetDraft } from "@/lib/chat-widget/widgetDraft";
import { patchRemoteWidgetConfiguration } from "@/lib/chat-widget/widget-remote-sync";

export type PersistVisitorTopicsResult =
  | { ok: true }
  | { ok: false; error: string };

/** `website_visitor_topics` — routing source of truth when rows are complete. */
export async function persistVisitorTopicsIfValid(
  websiteId: string | undefined,
  rows: WidgetInquiryOption[],
): Promise<PersistVisitorTopicsResult> {
  const wid = websiteId?.trim();
  if (!wid) {
    return { ok: false, error: "Select a website before saving inquiry topics." };
  }
  if (rows.length === 0) {
    return { ok: false, error: "Add at least one inquiry topic before saving." };
  }
  const err = validateVisitorTopicsForSave(rows);
  if (err) return { ok: false, error: err };
  await saveVisitorTopics(wid, { topics: rows.map(widgetInquiryToTopicInput) });
  return { ok: true };
}

/** PATCH `config.behavior.inquiryOptions` on the widget draft (embed JSON). */
export async function syncInquiryToWidgetJson(params: {
  widgetKey: string;
  draft: WidgetDraft;
  publishNow?: boolean;
}): Promise<void> {
  await patchRemoteWidgetConfiguration({
    widgetKey: params.widgetKey,
    widgetKind: "chat",
    draft: params.draft,
    publishNow: params.publishNow ?? false,
    chatWizardPatchScope: "inquiry_only",
  });
}
