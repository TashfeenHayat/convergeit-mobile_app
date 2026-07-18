import { isAxiosError } from "axios";
import { normalizeTestToEmail } from "@/api/email/build-email-test-body";
import type { EmailTestResult } from "@/api/types/email.types";
import { extractApiErrorMessageForToast } from "@/lib/notify";
import type { MailProviderSettings } from "../types";

export { normalizeTestToEmail } from "@/api/email/build-email-test-body";
export { buildEmailTestRequestBody } from "@/api/email/build-email-test-body";

/** Practical check before API (backend uses class-validator `isEmail`). */
const TEST_TO_EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/** Empty is allowed (backend uses login email). Non-empty must be valid. */
export function validateTestToEmail(value?: string | null): string | null {
  const email = normalizeTestToEmail(value);
  if (!email) return null;
  if (!TEST_TO_EMAIL_RE.test(email)) {
    return 'Enter a valid email address, for example name@company.com.';
  }
  return null;
}

function stripFormLevelPrefix(message: string): string {
  return message.replace(/^(form:\s*)+/gi, "").trim();
}

function parseEmbeddedJsonMessage(raw: string): string | null {
  const start = raw.indexOf("{");
  if (start === -1) return null;
  try {
    const parsed = JSON.parse(raw.slice(start)) as { message?: unknown };
    const msg = parsed.message;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
  } catch {
    return null;
  }
  return null;
}

function humanizeProviderMessage(detail: string): string {
  const lower = detail.toLowerCase();
  if (lower.includes("domain is not verified")) {
    return (
      "The From address domain is not verified with your mail provider. " +
      "Verify the domain in the provider dashboard (for example Resend → Domains), " +
      "or use a From email on a verified domain under Email → Platform mail."
    );
  }
  if (lower.includes("api key") && lower.includes("invalid")) {
    return "The mail API key was rejected. Update it under Email configuration and run the test again.";
  }
  return detail;
}

/** Clear, user-facing message for mail test / send failures. */
export function formatMailTestErrorMessage(raw: string): string {
  let msg = stripFormLevelPrefix(raw);

  const resendPrefix = /^Resend API error \(\d+\):\s*/i;
  if (resendPrefix.test(msg)) {
    msg = msg.replace(resendPrefix, "").trim();
  }

  const embedded = parseEmbeddedJsonMessage(msg);
  if (embedded) return humanizeProviderMessage(embedded);

  if (/invalid login|authentication failed|535|username and password/i.test(msg)) {
    return (
      "SMTP login failed. Check host, port, encryption, username, and password " +
      "(for Gmail use an App Password with smtp.gmail.com)."
    );
  }

  return humanizeProviderMessage(msg);
}

function readApiErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const root = data as Record<string, unknown>;
  const err = root.error;
  if (err && typeof err === "object" && !Array.isArray(err)) {
    const errObj = err as Record<string, unknown>;
    const msg = readTestMessage(errObj.message);
    if (msg) return msg;
    const details = errObj.details;
    if (details && typeof details === "object" && !Array.isArray(details)) {
      const fe = (details as Record<string, unknown>).fieldErrors;
      if (fe && typeof fe === "object" && !Array.isArray(fe)) {
        const formErr = (fe as Record<string, unknown>).form;
        if (Array.isArray(formErr) && formErr[0]) return String(formErr[0]);
        if (typeof formErr === "string" && formErr.trim()) return formErr.trim();
      }
      const fields = (details as Record<string, unknown>).fields;
      if (Array.isArray(fields)) {
        const first = fields[0] as { message?: unknown } | undefined;
        if (first?.message) return String(first.message);
      }
    }
  }
  return null;
}

export function extractEmailTestErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const fromApi = readApiErrorMessage(error.response?.data);
    if (fromApi) return formatMailTestErrorMessage(fromApi);
  }
  const fallback = extractApiErrorMessageForToast(error) ?? "Test email failed.";
  return formatMailTestErrorMessage(fallback);
}

export function readTestMessage(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}

export function mergeTestResultIntoSettings(
  settings: MailProviderSettings,
  result: EmailTestResult,
): MailProviderSettings {
  return {
    ...settings,
    lastTestStatus: result.success ? "success" : "failed",
    lastTestedAt: result.testedAt ?? new Date().toISOString(),
    lastTestMessage:
      readTestMessage(result.message) ??
      (result.success ? "Test email sent." : "Test failed."),
  };
}

export function pickStoredTestMessage(settings?: {
  lastTestMessage?: string | null;
  lastTestStatus?: "success" | "failed" | null;
}): string | null {
  if (!settings?.lastTestStatus) return null;
  const raw = readTestMessage(settings.lastTestMessage);
  if (!raw) return null;
  return formatMailTestErrorMessage(raw);
}
