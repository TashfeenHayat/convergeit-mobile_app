import type { WidgetInstallationAssetUrls } from "./build-widget-install-body";
import type { WidgetDraft } from "./widgetDraft";

function isHttpUrl(value: string | undefined): value is string {
  const v = value?.trim();
  return Boolean(v && (v.startsWith("http://") || v.startsWith("https://")));
}

/** True when the draft should persist a custom uploaded/URL FAB icon (not a preset). */
export function draftUsesCustomLauncherIcon(
  draft: Pick<WidgetDraft, "iconDataUrl" | "launcherIconPreset">,
  assetUrls?: Pick<WidgetInstallationAssetUrls, "buttonIconPublicUrl">,
): boolean {
  if (assetUrls?.buttonIconPublicUrl?.trim()) return true;
  const icon = draft.iconDataUrl?.trim() ?? "";
  if (!icon) return false;
  if (icon.startsWith("data:")) return true;
  // Stale published URL must not override an explicit preset selection.
  if (draft.launcherIconPreset?.trim()) return false;
  return isHttpUrl(icon);
}

/**
 * Hydrate `iconDataUrl` from API — ignore stale http icon when a preset is active.
 */
export function resolveLauncherIconDataUrlForDraft(input: {
  buttonIconUrl?: string;
  launcherIconPreset?: string;
}): string {
  const url = input.buttonIconUrl?.trim() ?? "";
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  if (input.launcherIconPreset?.trim()) return "";
  return url;
}
