import { isRecord } from "@/lib/utils";
import type { JsonRecord } from "@/api/types/common.types";

const NESTED_SECTION_KEYS = ["ui", "behavior", "session", "form", "response"] as const;

function isNonEmptyRecord(v: unknown): v is JsonRecord {
  return isRecord(v) && Object.keys(v).length > 0;
}

function mergeRecords(
  base: JsonRecord | null | undefined,
  patch: JsonRecord | null | undefined,
): JsonRecord {
  if (!isNonEmptyRecord(patch)) return isRecord(base) ? { ...base } : {};
  if (!isNonEmptyRecord(base)) return { ...patch };
  return { ...base, ...patch };
}

function mergeChatDesign(base: JsonRecord, patch: JsonRecord): JsonRecord {
  const out = { ...base };
  for (const sub of ["launcher", "chatBox", "colors"] as const) {
    const p = patch[sub];
    if (!isNonEmptyRecord(p)) continue;
    const b = isRecord(out[sub]) ? (out[sub] as JsonRecord) : {};
    out[sub] = mergeRecords(b, p);
  }
  for (const [k, v] of Object.entries(patch)) {
    if (k === "launcher" || k === "chatBox" || k === "colors") continue;
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function mergeDesignJson(base: JsonRecord, patch: JsonRecord): JsonRecord {
  const out = { ...base };
  for (const [k, p] of Object.entries(patch)) {
    if (!isNonEmptyRecord(p)) continue;
    if (k === "chat") {
      const b = isRecord(out.chat) ? (out.chat as JsonRecord) : {};
      out.chat = mergeChatDesign(b, p);
      continue;
    }
    const b = isRecord(out[k]) ? (out[k] as JsonRecord) : {};
    out[k] = mergeRecords(b, p);
  }
  return out;
}

function mergeSettingsJson(base: JsonRecord, patch: JsonRecord): JsonRecord {
  const out = { ...base };
  for (const key of NESTED_SECTION_KEYS) {
    const p = patch[key];
    if (!isNonEmptyRecord(p)) continue;
    const b = isRecord(out[key]) ? (out[key] as JsonRecord) : {};
    out[key] = mergeRecords(b, p);
  }
  for (const [k, v] of Object.entries(patch)) {
    if ((NESTED_SECTION_KEYS as readonly string[]).includes(k)) continue;
    if (v !== undefined && v !== null) out[k] = v;
  }
  return out;
}

const CONFIG_OBJECT_KEYS = new Set<string>(["theme", "settingsJson", ...NESTED_SECTION_KEYS]);

/**
 * Edit hydration: draft `config` is authoritative; published `config` only fills missing keys
 * non-empty sections so empty `form: {}` / `behavior: {}` patches do not wipe saved values.
 */
export function mergeWidgetConfigForEdit(
  latestConfig: JsonRecord | null | undefined,
  draftOverlay: JsonRecord | null | undefined,
): JsonRecord {
  const base = isRecord(latestConfig) ? { ...latestConfig } : {};
  const overlay = isRecord(draftOverlay) ? draftOverlay : null;
  if (!overlay) return base;

  for (const [k, v] of Object.entries(overlay)) {
    if (CONFIG_OBJECT_KEYS.has(k)) continue;
    if (v !== undefined && v !== null) base[k] = v;
  }

  for (const key of NESTED_SECTION_KEYS) {
    const merged = mergeRecords(
      isRecord(base[key]) ? (base[key] as JsonRecord) : null,
      isRecord(overlay[key]) ? (overlay[key] as JsonRecord) : null,
    );
    if (isRecord(base[key]) || isRecord(overlay[key])) {
      base[key] = merged;
    }
  }

  if (isRecord(base.settingsJson) || isRecord(overlay.settingsJson)) {
    base.settingsJson = mergeSettingsJson(
      isRecord(base.settingsJson) ? (base.settingsJson as JsonRecord) : {},
      isRecord(overlay.settingsJson) ? (overlay.settingsJson as JsonRecord) : {},
    );
  }

  if (isRecord(base.theme) || isRecord(overlay.theme)) {
    const tBase = isRecord(base.theme) ? { ...(base.theme as JsonRecord) } : {};
    const tOver = isRecord(overlay.theme) ? overlay.theme : null;
    if (isRecord(tOver)) {
      for (const [k, v] of Object.entries(tOver)) {
        if (k === "designJson") continue;
        if (v !== undefined && v !== null) tBase[k] = v;
      }
      if (isRecord(tOver.designJson)) {
        const djBase = isRecord(tBase.designJson) ? (tBase.designJson as JsonRecord) : {};
        tBase.designJson = mergeDesignJson(djBase, tOver.designJson as JsonRecord);
      }
    }
    base.theme = tBase;
  }

  return base;
}
