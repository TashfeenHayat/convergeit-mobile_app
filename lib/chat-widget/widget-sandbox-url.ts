import { resolveWidgetEmbedAppOrigin } from "@/lib/chat-widget/widget-embed-api-origin";
import type { EmbedHostSurface } from "@/lib/widget-runtime/embed-host-messaging";

export type WidgetSandboxUrlMode = "draft" | "published";

export function buildWidgetEmbedIframeUrl(input: {
  widgetKey: string;
  mode?: WidgetSandboxUrlMode;
  previewShareToken?: string;
  parentPage?: string;
  appOrigin?: string;
  surface?: EmbedHostSurface;
}): string {
  const key = input.widgetKey.trim();
  if (!key) return "";

  const origin =
    input.appOrigin?.trim() ||
    resolveWidgetEmbedAppOrigin({
      browserOrigin:
        typeof window !== "undefined" ? window.location.origin : undefined,
    });
  if (!origin) return "";

  const params = new URLSearchParams({ widgetKey: key });
  const parent = input.parentPage?.trim() || origin;
  params.set("parentPage", parent);

  if (input.mode === "draft" || input.previewShareToken?.trim()) {
    params.set("env", "preview");
    const token = input.previewShareToken?.trim();
    if (token) params.set("token", token);
  }

  if (input.surface === "chat" || input.surface === "textUs") {
    params.set("surface", input.surface);
  }

  return `${origin.replace(/\/+$/, "")}/embed/widget?${params.toString()}`;
}

/** Public landing page — share with anyone (draft needs `token` from dashboard). */
export function buildWidgetPublicTestPageUrl(input: {
  widgetKey: string;
  previewShareToken?: string;
  appOrigin?: string;
}): string {
  const key = input.widgetKey.trim();
  if (!key) return "";

  const origin =
    input.appOrigin?.trim() ||
    resolveWidgetEmbedAppOrigin({
      browserOrigin:
        typeof window !== "undefined" ? window.location.origin : undefined,
    });
  if (!origin) return "";

  const params = new URLSearchParams({ widgetKey: key });
  const token = input.previewShareToken?.trim();
  if (token) params.set("token", token);

  return `${origin.replace(/\/+$/, "")}/test/widget?${params.toString()}`;
}
