import { isAxiosError } from "axios";

/**
 * RN note: web's `readVisitorTextSelection` (highlight-to-capture) relies on
 * `window.getSelection()` / `HTMLElement` and has no native equivalent — text
 * selection capture on mobile is handled via long-press menus in
 * `VisitorProfileCaptureMenu` instead. Only the pure error-classification
 * helpers are ported here.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readMessageFromPayload(payload: Record<string, unknown>): string | null {
  const keys = ["message", "msg", "reason", "detail", "description"] as const;
  for (const key of keys) {
    const val = payload[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  const err = payload.error;
  if (isRecord(err)) {
    for (const key of keys) {
      const val = err[key];
      if (typeof val === "string" && val.trim()) return val.trim();
    }
  }
  return null;
}

export function formatVisitorProfileErrorMessage(raw: string): string {
  const t = raw.replace(/^form:\s*/i, "").trim();
  if (!t) return "Could not update visitor profile.";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Agent-facing error copy for profile capture (socket ack or REST). */
export function readVisitorProfileErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data;
    if (typeof data === "string" && data.trim()) {
      return formatVisitorProfileErrorMessage(data);
    }
    if (isRecord(data)) {
      const msg = readMessageFromPayload(data);
      if (msg) return formatVisitorProfileErrorMessage(msg);
    }
  }

  if (err instanceof Error && err.message.trim()) {
    return formatVisitorProfileErrorMessage(err.message);
  }

  if (isRecord(err)) {
    const msg = readMessageFromPayload(err);
    if (msg) return formatVisitorProfileErrorMessage(msg);
    for (const key of ["data", "error"] as const) {
      const nested = err[key];
      if (!isRecord(nested)) continue;
      const nestedMsg = readMessageFromPayload(nested);
      if (nestedMsg) return formatVisitorProfileErrorMessage(nestedMsg);
    }
  }

  return "Could not update visitor profile.";
}

export function isVisitorProfileBusinessError(err: unknown): boolean {
  if (!isRecord(err)) {
    if (err instanceof Error) {
      const m = err.message.toLowerCase();
      return (
        m.includes("invalid") ||
        m.includes("already set") ||
        m.includes("not permitted") ||
        m.includes("forbidden") ||
        m.includes("cannot be empty")
      );
    }
    return false;
  }
  const code =
    typeof err.code === "string"
      ? err.code
      : isRecord(err.data) && typeof err.data.code === "string"
        ? err.data.code
        : isRecord(err.error) && typeof err.error.code === "string"
          ? err.error.code
          : "";
  if (code === "VALIDATION_ERROR" || code === "VISITOR_FIELD_ALREADY_SET" || code === "FORBIDDEN" || code === "BAD_REQUEST") {
    return true;
  }
  const msg = readVisitorProfileErrorMessage(err).toLowerCase();
  return (
    msg.includes("invalid") ||
    msg.includes("already set") ||
    msg.includes("not permitted") ||
    msg.includes("forbidden") ||
    msg.includes("cannot be empty")
  );
}

export function isSocketTransportError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const m = err.message.toLowerCase();
  return m.includes("timeout") || m.includes("not connected") || m.includes("socket") || m.includes("network");
}

export type VisitorProfileCaptureAnchor = {
  messageId?: string;
  selectedText: string;
};
