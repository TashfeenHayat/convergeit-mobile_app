import {
  deriveNavAccentsFromBackground,
  isDarkAppearanceBackground,
} from "@/lib/theme/backgroundTextContrast";
import type { DashboardAppearance } from "./types";

/**
 * Shell rendering: navigation colours stay readable on every canvas.
 * Light / bright backgrounds always use derived nav colours; dark + Custom text keeps manual accents.
 */
export function resolveDashboardAppearance(appearance: DashboardAppearance): DashboardAppearance {
  const acc = deriveNavAccentsFromBackground(appearance.backgroundCss);
  const lightCanvas = !isDarkAppearanceBackground(appearance.backgroundCss);
  if (lightCanvas || appearance.textMode === "auto") {
    return {
      ...appearance,
      accents: {
        ...appearance.accents,
        navLabelHex: acc.navLabelHex,
        navItemHex: acc.navItemHex,
        navActiveIconHex: acc.navActiveIconHex,
      },
    };
  }
  return appearance;
}
