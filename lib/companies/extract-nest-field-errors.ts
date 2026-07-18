import { isAxiosError } from "axios";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatFieldMessage(value: unknown): string | null {
  if (typeof value === "string") {
    const t = value.trim();
    return t.length > 0 ? t : null;
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((x) => (typeof x === "string" ? x.trim() : String(x)))
      .filter((s) => s.length > 0);
    return parts.length > 0 ? parts.join(" ") : null;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    const nested = o.message ?? o.msg ?? o.error;
    if (typeof nested === "string" && nested.trim()) return nested.trim();
  }
  return null;
}

function mergeFieldBlock(target: Record<string, string>, block: unknown) {
  if (!isRecord(block)) return;
  for (const [key, raw] of Object.entries(block)) {
    const msg = formatFieldMessage(raw);
    if (msg) target[key] = msg;
  }
}

/** Nest often returns `details.fields` as `[{ field, message, constraint? }]`. */
function mergeFieldsArray(target: Record<string, string>, fields: unknown) {
  if (!Array.isArray(fields)) return;
  for (const item of fields) {
    if (!isRecord(item)) continue;
    const path = typeof item.field === "string" ? item.field.trim() : "";
    const msg = formatFieldMessage(item.message ?? item.msg ?? item.error);
    if (path && msg) target[path] = msg;
  }
}

/** Duplicate keys so UI can match `form.*` and `children[0]` variants. */
function expandFieldErrorAliases(map: Record<string, string>): Record<string, string> {
  const next: Record<string, string> = { ...map };
  for (const [k, v] of Object.entries(map)) {
    if (!v?.trim()) continue;
    if (k.startsWith("form.")) {
      next[k.slice(5)] = v;
    }
    const noBracket = k.replace(/\[(\d+)\]/g, ".$1");
    if (noBracket !== k) {
      next[noBracket] = v;
    }
  }
  return next;
}

function mergeAllKnownDetailsBlocks(out: Record<string, string>, data: Record<string, unknown>) {

  const details = isRecord(data.details) ? data.details : null;
  if (details) {
    mergeFieldBlock(out, details.fieldErrors);
    if (Array.isArray(details.fields)) {
      mergeFieldsArray(out, details.fields);
    } else {
      mergeFieldBlock(out, details.fields);
    }
  }

  /** Common envelope: `{ success: false, error: { message, details: { fields: [...] } } }` */
  const errPayload = isRecord(data.error) ? data.error : null;
  if (errPayload) {
    mergeFieldBlock(out, errPayload.fieldErrors);
    const errDetails = isRecord(errPayload.details) ? errPayload.details : null;
    if (errDetails) {
      mergeFieldBlock(out, errDetails.fieldErrors);
      if (Array.isArray(errDetails.fields)) {
        mergeFieldsArray(out, errDetails.fields);
      } else {
        mergeFieldBlock(out, errDetails.fields);
      }
    }
  }

  const inner = isRecord(data.data) ? data.data : null;
  if (inner) {
    const innerDetails = isRecord(inner.details) ? inner.details : null;
    if (innerDetails) {
      mergeFieldBlock(out, innerDetails.fieldErrors);
      if (Array.isArray(innerDetails.fields)) {
        mergeFieldsArray(out, innerDetails.fields);
      } else {
        mergeFieldBlock(out, innerDetails.fields);
      }
    }
    const innerErr = isRecord(inner.error) ? inner.error : null;
    if (innerErr) {
      mergeFieldBlock(out, innerErr.fieldErrors);
      const innerErrDet = isRecord(innerErr.details) ? innerErr.details : null;
      if (innerErrDet) {
        mergeFieldBlock(out, innerErrDet.fieldErrors);
        if (Array.isArray(innerErrDet.fields)) {
          mergeFieldsArray(out, innerErrDet.fields);
        } else {
          mergeFieldBlock(out, innerErrDet.fields);
        }
      }
    }
  }

  mergeFieldBlock(out, data.fieldErrors);
}

/**
 * Reads Nest-style validation maps from API 4xx bodies:
 * `details.fieldErrors`, `details.fields`, `error.details.fields`, plus top-level `fieldErrors`.
 */
export function extractNestFieldErrors(error: unknown): Record<string, string> {
  const out: Record<string, string> = {};

  let data: Record<string, unknown> | null = null;
  if (isAxiosError(error)) {
    const d = error.response?.data;
    data = isRecord(d) ? d : null;
  } else if (error && typeof error === "object" && "response" in error) {
    const d = (error as { response?: { data?: unknown } }).response?.data;
    data = isRecord(d) ? d : null;
  }

  if (!data) return out;

  mergeAllKnownDetailsBlocks(out, data);
  return expandFieldErrorAliases(out);
}
