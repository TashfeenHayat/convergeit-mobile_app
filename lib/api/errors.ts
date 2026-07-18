import axios from 'axios';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatFieldMessage(value: unknown): string | null {
  if (typeof value === 'string') {
    const t = value.trim();
    return t.length > 0 ? t : null;
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((x) => (typeof x === 'string' ? x.trim() : String(x)))
      .filter((s) => s.length > 0);
    return parts.length > 0 ? parts.join(' ') : null;
  }
  if (isRecord(value)) {
    const nested = value.message ?? value.msg ?? value.error;
    if (typeof nested === 'string' && nested.trim()) return nested.trim();
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

function mergeFieldsArray(target: Record<string, string>, fields: unknown) {
  if (!Array.isArray(fields)) return;
  for (const item of fields) {
    if (!isRecord(item)) continue;
    const path = typeof item.field === 'string' ? item.field.trim() : '';
    const msg = formatFieldMessage(item.message ?? item.msg ?? item.error);
    if (path && msg) target[path] = msg;
  }
}

function expandFieldErrorAliases(map: Record<string, string>): Record<string, string> {
  const next: Record<string, string> = { ...map };
  for (const [k, v] of Object.entries(map)) {
    if (!v?.trim()) continue;
    if (k.startsWith('form.')) next[k.slice(5)] = v;
  }
  return next;
}

function mergeAllKnownDetailsBlocks(out: Record<string, string>, data: Record<string, unknown>) {
  const details = isRecord(data.details) ? data.details : null;
  if (details) {
    mergeFieldBlock(out, details.fieldErrors);
    if (Array.isArray(details.fields)) mergeFieldsArray(out, details.fields);
    else mergeFieldBlock(out, details.fields);
  }

  const errPayload = isRecord(data.error) ? data.error : null;
  if (errPayload) {
    mergeFieldBlock(out, errPayload.fieldErrors);
    const errDetails = isRecord(errPayload.details) ? errPayload.details : null;
    if (errDetails) {
      mergeFieldBlock(out, errDetails.fieldErrors);
      if (Array.isArray(errDetails.fields)) mergeFieldsArray(out, errDetails.fields);
      else mergeFieldBlock(out, errDetails.fields);
    }
  }

  mergeFieldBlock(out, data.fieldErrors);
  const nestedErrors = data.errors;
  if (isRecord(nestedErrors)) mergeFieldBlock(out, nestedErrors);
}

function readMessageLikeKeys(payload: Record<string, unknown>): string | null {
  const candidates = [
    payload.message,
    payload.msg,
    payload.reason,
    payload.errorMessage,
    payload.title,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
    if (Array.isArray(c) && typeof c[0] === 'string' && c[0].trim()) return c[0].trim();
  }
  return null;
}

function readFromErrorField(payload: Record<string, unknown>): string | null {
  const err = payload.error;
  if (typeof err === 'string' && err.trim()) return err.trim();
  if (isRecord(err)) return readMessageLikeKeys(err);
  return null;
}

/** Extract a user-facing message from Nest/axios Converge API envelopes. */
export function extractApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (typeof data === 'string' && data.trim()) return data.trim();
    if (isRecord(data)) {
      const fromError = readFromErrorField(data);
      if (fromError) return fromError;
      const top = readMessageLikeKeys(data);
      if (top) return top;
    }
    if (err.message && !/^Request failed with status code \d+$/i.test(err.message)) {
      return err.message;
    }
    if (err.code === 'ERR_NETWORK') {
      return 'Network error — check API URL and internet connection.';
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export type FieldErrors = Partial<Record<string, string>>;

/**
 * Reads Nest-style validation maps:
 * `error.details.fieldErrors`, `error.details.fields`, top-level `fieldErrors`.
 */
export function extractNestFieldErrors(err: unknown): FieldErrors {
  const out: Record<string, string> = {};
  if (!axios.isAxiosError(err)) return out;
  const data = err.response?.data;
  if (!isRecord(data)) return out;
  mergeAllKnownDetailsBlocks(out, data);
  return expandFieldErrorAliases(out);
}

/** Pretty Metro / terminal log for failed API calls. */
export function logApiError(context: string, err: unknown): void {
  const message = extractApiErrorMessage(err);
  const fields = extractNestFieldErrors(err);
  if (axios.isAxiosError(err)) {
    const method = (err.config?.method ?? 'GET').toUpperCase();
    const url = `${err.config?.baseURL ?? ''}${err.config?.url ?? ''}`;
    const status = err.response?.status;
    console.error(
      `[API ERROR] ${context}\n` +
        `  ${method} ${url}\n` +
        `  status: ${status ?? 'network'}\n` +
        `  message: ${message}` +
        (Object.keys(fields).length
          ? `\n  fields: ${JSON.stringify(fields)}`
          : '') +
        (err.response?.data
          ? `\n  body: ${JSON.stringify(err.response.data)}`
          : ''),
    );
    return;
  }
  console.error(`[API ERROR] ${context}:`, message, err);
}
