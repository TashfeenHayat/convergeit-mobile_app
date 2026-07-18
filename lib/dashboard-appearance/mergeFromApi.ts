import { defaultDashboardAppearance } from "./defaults";
import type { DashboardAppearance } from "./types";
import { parseStoredDashboardAppearance } from "./persist";

export function mergeDashboardAppearanceFromApi(
  partial: Partial<DashboardAppearance> | null | undefined
): DashboardAppearance {
  if (!partial || typeof partial !== "object") return defaultDashboardAppearance;
  try {
    return parseStoredDashboardAppearance(
      JSON.stringify({ ...defaultDashboardAppearance, ...partial })
    );
  } catch {
    return defaultDashboardAppearance;
  }
}
