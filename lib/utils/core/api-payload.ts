import { isRecord, type UnknownRecord } from "./records";

/**
 * Many APIs return `{ data: ... }`. This unwraps one level when present.
 * Returns the original payload when it's already the data object.
 */
export function unwrapApiData(payload: unknown): unknown {
  const root = isRecord(payload) ? payload : null;
  if (root && "data" in root) return root["data"];
  return payload;
}

export function pickStr(obj: UnknownRecord | null, keys: string[]): string {
  if (!obj) return "";
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export function pickNum(obj: UnknownRecord | null, keys: string[]): number | null {
  if (!obj) return null;
  for (const k of keys) {
    const raw = obj[k];
    const n = typeof raw === "number" ? raw : Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function formatIsoDate(input: string): string {
  const s = input.trim();
  if (!s) return "—";
  return s.includes("T") ? s.slice(0, 10) : s;
}
