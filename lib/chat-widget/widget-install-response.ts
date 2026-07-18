import { widgetResponseData } from "@/api/widgets/widgets.api";
import type { JsonRecord } from "@/api/types/common.types";

export function unwrapWidgetInstallEnvelope(payload: unknown): JsonRecord {
  return widgetResponseData<JsonRecord>(payload);
}

/** Resolve widget key from install / publish / patch responses. */
export function pickInstallWidgetKeys(inner: JsonRecord): {
  widgetKey: string;
} {
  let widgetKey = String(inner.widgetKey ?? inner.widget_key ?? "");

  const nested = inner.data;
  if (typeof nested === "object" && nested !== null && !widgetKey) {
    const n = nested as JsonRecord;
    widgetKey = String(n.widgetKey ?? n.widget_key ?? "");
  }

  return { widgetKey };
}

export function pickRequiresPublishBeforeEmbed(inner: JsonRecord): boolean {
  const v =
    inner.requiresPublishBeforeEmbed ?? inner.requires_publish_before_embed;
  return v === true;
}

/** Draft-only PATCH/install responses sometimes return `{ status: "draft" }`. */
export function pickWidgetRemoteStatus(inner: JsonRecord): string | null {
  const s = inner.status ?? inner.widgetStatus;
  return typeof s === "string" && s.trim() ? s.trim() : null;
}

export function readEmbedSnippetMarkup(payload: unknown): string | null {
  const d = widgetResponseData<JsonRecord>(payload);
  if (typeof d.htmlSnippet === "string") return d.htmlSnippet;
  if (typeof d.snippet === "string") return d.snippet;
  if (typeof d.html === "string") return d.html;
  return null;
}

/** Next.js embed host from `GET .../embed-snippet` (must not be the Nest API). */
export function pickEmbedAppOrigin(payload: unknown): string {
  const inner = widgetResponseData<JsonRecord>(payload);
  const v = inner.embedAppOrigin ?? inner.embed_app_origin;
  return typeof v === "string" && v.trim() ? v.trim().replace(/\/+$/, "") : "";
}

/** JWT TTL hint from `GET .../embed-snippet` (e.g. `30m`). */
export function pickEmbedSessionExpiresIn(payload: unknown): string {
  const inner = widgetResponseData<JsonRecord>(payload);
  const v =
    inner.sessionExpiresIn ??
    inner.session_expires_in ??
    inner.expiresIn ??
    inner.expires_in;
  return typeof v === "string" && v.trim() ? v.trim() : "";
}
