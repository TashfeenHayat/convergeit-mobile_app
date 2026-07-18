import type { LauncherIconPresetId } from "@/lib/chat-widget/launcher-icon-presets";
import {
  findLauncherIconPreset,
  LAUNCHER_ICON_PRESETS,
} from "@/lib/chat-widget/launcher-icon-presets";

export { LAUNCHER_ICON_PRESETS };
export type { LauncherIconPresetId } from "@/lib/chat-widget/launcher-icon-presets";

export function LauncherPresetIcon({
  presetId,
  color,
  fontSizePx,
}: {
  presetId: LauncherIconPresetId;
  color: string;
  fontSizePx: number;
}) {
  if (!presetId) return null;
  const entry = findLauncherIconPreset(presetId);
  if (!entry) return null;
  const IconComponent = entry.Icon;
  return <IconComponent color={color} size={fontSizePx} aria-hidden />;
}
