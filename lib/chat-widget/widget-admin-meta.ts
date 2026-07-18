import { isRecord } from "@/lib/utils";

import type { JsonRecord } from "@/api/types/common.types";

export type WidgetDeployState =
  | "draft_only"
  | "live"
  | "live_with_pending_draft";

export type WidgetAdminMeta = {
  widgetKey: string;
  websiteId: string | null;
  widgetType: string | null;
  deploy: {
    state: WidgetDeployState;
    draftSavedAt: string | null;
    liveAt: string | null;
  };
  createdAt: string | null;
  updatedAt: string | null;
};

function parseDeployBlock(root: JsonRecord): WidgetAdminMeta["deploy"] {
  const deploy = isRecord(root.deploy) ? root.deploy : null;
  if (!deploy) {
    return {
      state: "draft_only",
      draftSavedAt: null,
      liveAt: null,
    };
  }

  const stateRaw = String(deploy.state ?? "").trim();
  const state: WidgetDeployState =
    stateRaw === "live" ||
    stateRaw === "live_with_pending_draft" ||
    stateRaw === "draft_only"
      ? stateRaw
      : "draft_only";

  return {
    state,
    draftSavedAt:
      typeof deploy.draftSavedAt === "string"
        ? deploy.draftSavedAt
        : typeof deploy.draft_saved_at === "string"
          ? deploy.draft_saved_at
          : null,
    liveAt:
      typeof deploy.liveAt === "string"
        ? deploy.liveAt
        : typeof deploy.live_at === "string"
          ? deploy.live_at
          : null,
  };
}

export function parseWidgetAdminMeta(payload: unknown): WidgetAdminMeta | null {
  const root = isRecord(payload) ? payload : null;
  if (!root) return null;
  const widgetKey = String(root.widgetKey ?? root.widget_key ?? "").trim();
  if (!widgetKey) return null;

  return {
    widgetKey,
    websiteId:
      typeof root.websiteId === "string"
        ? root.websiteId
        : typeof root.website_id === "string"
          ? root.website_id
          : null,
    widgetType:
      typeof root.widgetType === "string"
        ? root.widgetType
        : typeof root.widget_type === "string"
          ? root.widget_type
          : null,
    deploy: parseDeployBlock(root),
    createdAt:
      typeof root.createdAt === "string"
        ? root.createdAt
        : typeof root.created_at === "string"
          ? root.created_at
          : null,
    updatedAt:
      typeof root.updatedAt === "string"
        ? root.updatedAt
        : typeof root.updated_at === "string"
          ? root.updated_at
          : null,
  };
}

export function widgetSimpleStatusLabel(meta: WidgetAdminMeta): string {
  switch (meta.deploy.state) {
    case "live":
      return "Live on customer sites";
    case "live_with_pending_draft":
      return "Live — newer draft saved (go live to update embed)";
    case "draft_only":
    default:
      return "Offline — use test link; go live when ready";
  }
}

/** @deprecated Use widgetSimpleStatusLabel */
export function widgetLifecycleStatusLabel(meta: WidgetAdminMeta): string {
  return widgetSimpleStatusLabel(meta);
}

export function hasUnpublishedDraft(meta: WidgetAdminMeta): boolean {
  return (
    meta.deploy.state === "live_with_pending_draft" ||
    meta.deploy.state === "draft_only"
  );
}
