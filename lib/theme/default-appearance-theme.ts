import {
  APPEARANCE_PRESET_BY_ID,
  SYSTEM_DARK_PRESET_ID,
} from "@/lib/theme/appearance-presets";
import { mergeAppColors } from "@/lib/theme/merge-app-colors";
import { createAppTheme, defaultAppColors } from "@/theme/theme";

const preset = APPEARANCE_PRESET_BY_ID[SYSTEM_DARK_PRESET_ID];

/** Same theme as `ThemeRegistry` when preset is Discord dark (ignores saved appearance). */
export const defaultAppearanceMuiTheme = createAppTheme(
  mergeAppColors(defaultAppColors, preset.patch),
  preset.appBackground,
  preset.paletteMode
);
