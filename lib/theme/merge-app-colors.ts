import { defaultAppColors } from "@/theme/theme";

type AppColors = typeof defaultAppColors;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Deep-merge preset patches into a clone of default app colors. */
export function mergeAppColors(base: AppColors, patch: Record<string, unknown>): AppColors {
  const out = structuredClone(base) as AppColors;

  function merge(target: Record<string, unknown>, source: Record<string, unknown>) {
    for (const key of Object.keys(source)) {
      const sv = source[key];
      const tv = target[key];
      if (isPlainObject(sv) && isPlainObject(tv)) {
        merge(tv, sv);
      } else if (sv !== undefined) {
        target[key] = sv;
      }
    }
  }

  merge(out as unknown as Record<string, unknown>, patch);
  return out;
}
