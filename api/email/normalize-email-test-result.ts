import type { EmailTestResult } from "../types/email.types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

/** Maps legacy `{ sent, to }` and new `{ success, message, testedAt }` test responses. */
export function normalizeEmailTestResult(payload: unknown): EmailTestResult {
  const raw = asRecord(payload);
  if (!raw) {
    return { success: false, message: "Test failed." };
  }

  if (typeof raw.success === "boolean") {
    return {
      success: raw.success,
      message: typeof raw.message === "string" ? raw.message : undefined,
      testedAt: typeof raw.testedAt === "string" ? raw.testedAt : undefined,
    };
  }

  if (raw.sent === true) {
    const to = typeof raw.to === "string" ? raw.to : "";
    return {
      success: true,
      message: to ? `Test email sent to ${to}.` : "Test email sent.",
      testedAt: new Date().toISOString(),
    };
  }

  return { success: false, message: "Test failed." };
}
