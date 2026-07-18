import type { ApiEnvelope } from "./auth.types";

/** Matches GET/PATCH `/platform-theme/me` inner `data.theme`. */
export interface PlatformThemeView {
  /** Preset accent hex, or custom gradient `#start+#end`. */
  backgroundColor: string | null;
}

export interface PlatformThemeMeData {
  theme: PlatformThemeView;
}

export type PlatformThemeMeEnvelope = ApiEnvelope<PlatformThemeMeData>;

export function readPlatformThemeBackgroundColor(
  envelope: PlatformThemeMeEnvelope | undefined,
): string | null | undefined {
  if (!envelope?.success) return undefined;
  return envelope.data.theme?.backgroundColor ?? null;
}

/** PATCH body: omit `backgroundColor` to leave unchanged; `null` or `""` clears (per API). */
export interface PlatformThemePatchBody {
  backgroundColor?: string | null;
}
