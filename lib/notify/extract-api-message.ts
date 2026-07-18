import { isAxiosError } from "axios";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Strip Nest/BusinessError `form:` prefix from API copy shown in toasts. */
function stripFormLevelErrorPrefix(message: string): string {
  return message.replace(/^(form:\s*)+/gi, "").trim();
}

function normalizeToastErrorMessage(message: string): string {
  const stripped = stripFormLevelErrorPrefix(message);
  if (/could not fetch url|failed to fetch url/i.test(stripped)) {
    return "We could not reach this website. It may block bots or be temporarily offline.";
  }
  if (/no indexable|no readable content|could not index|could not extract text/i.test(stripped)) {
    return "We could not extract enough text from this page. Try reindexing or use the KB worker with Playwright.";
  }
  return stripped;
}

function stringifyMessageFragment(value: unknown): string | null {
  if (typeof value === "string") {
    const t = value.trim();
    return t.length > 0 ? t : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

/** Reads `message`-style keys from a plain object (not recursive). */
function readMessageLikeKeys(payload: Record<string, unknown>): string | null {
  const candidates = [
    payload.message,
    payload.msg,
    payload.reason,
    payload.errorMessage,
    payload.error_description,
    payload.title,
    payload.detail,
    payload.description,
  ];
  for (const c of candidates) {
    if (typeof c === "string") {
      const t = c.trim();
      if (t) return t;
    }
    if (Array.isArray(c)) {
      const parts = c
        .map((x) => stringifyMessageFragment(x))
        .filter((x): x is string => Boolean(x));
      if (parts.length) return parts.join(" ");
    }
  }
  return null;
}

/**
 * Many backends send `{ error: "Bad Request" }` (string) or
 * `{ error: { message: "…", code: "…" } }` (object) — handle both.
 */
function readFromErrorField(payload: Record<string, unknown>): string | null {
  const err = payload.error;
  if (typeof err === "string") {
    const t = err.trim();
    if (t) return t;
  }
  if (isRecord(err)) {
    const fromNested = readMessageLikeKeys(err);
    if (fromNested) return fromNested;
  }
  return null;
}

/** Picks common API envelope / problem-details style keys at one level. */
function readTopLevelMessage(payload: Record<string, unknown>): string | null {
  const direct = readMessageLikeKeys(payload);
  if (direct) return direct;
  return readFromErrorField(payload);
}

/** Nested `data` on error bodies (e.g. wrapped API errors). */
function readNestedDataErrorMessage(payload: Record<string, unknown>): string | null {
  const inner = payload.data;
  if (!isRecord(inner)) return null;
  const a = readTopLevelMessage(inner);
  if (a) return a;
  return readMessageLikeKeys(inner);
}

function hasOnlyFieldStyleErrors(payload: Record<string, unknown>): boolean {
  const fieldMaps = ["errors", "fieldErrors", "validationErrors"] as const;
  for (const key of fieldMaps) {
    const block = payload[key];
    if (!isRecord(block)) continue;
    if (Object.keys(block).length === 0) continue;
    return true;
  }
  return false;
}

/** Nest `details.fields` (array or map) / `fieldErrors` — show inline, not duplicate toast. */
function detailsBlockHasFieldErrors(details: Record<string, unknown>): boolean {
  const fe = details.fieldErrors;
  if (isRecord(fe) && Object.keys(fe).length > 0) return true;
  const f = details.fields;
  if (Array.isArray(f) && f.length > 0) return true;
  if (isRecord(f) && Object.keys(f).length > 0) return true;
  return false;
}

function hasNestInlineFieldPayload(payload: Record<string, unknown>): boolean {
  const top = isRecord(payload.details) ? payload.details : null;
  if (top && detailsBlockHasFieldErrors(top)) return true;

  const err = payload.error;
  if (isRecord(err)) {
    const ed = isRecord(err.details) ? err.details : null;
    if (ed && detailsBlockHasFieldErrors(ed)) return true;
  }

  const inner = payload.data;
  if (isRecord(inner)) {
    const id = isRecord(inner.details) ? inner.details : null;
    if (id && detailsBlockHasFieldErrors(id)) return true;
  }

  return false;
}

function isLikelyAuthTokenPayload(data: Record<string, unknown>): boolean {
  return (
    typeof data.accessToken === "string" &&
    data.accessToken.length > 16 &&
    typeof data.refreshToken === "string"
  );
}

/**
 * Success bodies often match `ApiEnvelope` (`success`, `data`, optional `message`).
 * Also reads `message` nested under `data` (common when mutation returns only `data.data`
 * from axios while the envelope carried the copy).
 */
export function extractApiSuccessMessageForToast(data: unknown): string | null {
  if (data == null) return null;
  if (!isRecord(data)) {
    return stringifyMessageFragment(data);
  }
  if ("success" in data && data.success === false) return null;

  const top = readTopLevelMessage(data);
  if (top) return top;

  const inner = data.data;
  if (isRecord(inner)) {
    const innerMsg = readTopLevelMessage(inner);
    if (innerMsg) return innerMsg;
    if (isLikelyAuthTokenPayload(inner)) {
      return "Signed in successfully";
    }
  }

  if (isLikelyAuthTokenPayload(data)) {
    return "Signed in successfully";
  }

  if (data.success === true) {
    return "Successful";
  }

  return null;
}

/**
 * Error toast copy from axios/fetch-style errors. Returns `null` when the
 * payload looks like **only** per-field validation errors (no top-level message),
 * so forms can keep showing those on inputs instead of duplicating in a toast.
 */
export function extractApiErrorMessageForToast(error: unknown, fallback: string): string;
export function extractApiErrorMessageForToast(error: unknown): string | null;
export function extractApiErrorMessageForToast(error: unknown, fallback?: string): string | null {
  if (isAxiosError(error)) {
    const data = error.response?.data;

    if (data == null || data === "") {
      const status = error.response?.status;
      const statusText = error.response?.statusText?.trim();
      if (statusText) return statusText;
      if (typeof status === "number") return `Request failed (${status})`;
      const fallback = stringifyMessageFragment(error.message);
      return fallback ?? "Request failed";
    }

    if (typeof data === "string") {
      const t = data.trim();
      return t.length > 0
        ? normalizeToastErrorMessage(t)
        : normalizeToastErrorMessage(stringifyMessageFragment(error.message) ?? "Request failed");
    }

    if (!isRecord(data)) {
      return stringifyMessageFragment(error.message) ?? "Request failed";
    }

    /** Per-field errors (e.g. `error.details.fieldErrors`) — forms show inline; skip global toast. */
    if (hasNestInlineFieldPayload(data)) {
      return null;
    }

    if (hasOnlyFieldStyleErrors(data)) {
      return null;
    }

    const top = readTopLevelMessage(data);
    if (top) return normalizeToastErrorMessage(top);

    const nestedData = readNestedDataErrorMessage(data);
    if (nestedData) return normalizeToastErrorMessage(nestedData);

    const status = error.response?.status;
    if (typeof status === "number") {
      return `Request failed (${status})`;
    }

    return stringifyMessageFragment(error.message) ?? "Request failed";
  }

  if (error instanceof Error && error.message.trim()) {
    return normalizeToastErrorMessage(error.message.trim());
  }

  return fallback ?? null;
}
