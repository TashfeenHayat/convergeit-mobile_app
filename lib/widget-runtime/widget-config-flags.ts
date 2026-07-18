/** Shared boolean/string helpers for published widget config records. */

export function runtimeBoolFlag(v: unknown, defaultOn = false): boolean {
  if (v === undefined || v === null) return defaultOn;
  if (v === false || v === "false" || v === 0) return false;
  if (v === true || v === "true" || v === 1) return true;
  return defaultOn;
}

/** First defined boolean wins; otherwise `defaultOn`. */
export function runtimeBoolFirst(defaultOn: boolean, ...candidates: unknown[]): boolean {
  for (const v of candidates) {
    if (v === undefined || v === null) continue;
    if (v === false || v === "false" || v === 0) return false;
    if (v === true || v === "true" || v === 1) return true;
  }
  return defaultOn;
}

export function runtimeNumFlag(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number.parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export function isPrechatFormEnabled(cfg: Record<string, unknown>): boolean {
  const form = cfg.form;
  if (form !== null && typeof form === "object" && !Array.isArray(form)) {
    const f = form as Record<string, unknown>;
    if ("enabled" in f) return runtimeBoolFlag(f.enabled, true);
    if ("formEnabled" in f) return runtimeBoolFlag(f.formEnabled, true);
  }
  if ("formEnabled" in cfg) return runtimeBoolFlag(cfg.formEnabled, true);
  return true;
}
