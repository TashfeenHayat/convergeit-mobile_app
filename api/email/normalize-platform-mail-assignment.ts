import type {
  PlatformMailAssignment,
  PlatformMailAssignmentListItem,
} from "../types/email.types";
import type { EmailProviderKind } from "../types/email.types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function readString(value: unknown): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  return s || undefined;
}

function readBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1) return true;
  return false;
}

function readTestStatus(value: unknown): "success" | "failed" | null {
  if (value === "success" || value === "failed") return value;
  return null;
}

function resolveProviderKind(provider: {
  providerType?: string;
  type?: string;
  code?: string;
}): EmailProviderKind | null {
  const t = (provider.providerType ?? provider.type)?.toLowerCase();
  if (t === "smtp" || t === "api") return t;
  const code = String(provider.code ?? "").toLowerCase();
  if (code === "smtp" || code.includes("smtp")) return "smtp";
  if (
    code.includes("api") ||
    code.includes("sendgrid") ||
    code.includes("mailgun") ||
    code.includes("microsoft")
  ) {
    return "api";
  }
  return null;
}

function readNestedProvider(raw: Record<string, unknown>) {
  const nested = asRecord(raw.emailProvider ?? raw.email_provider);
  const emailProviderId =
    readString(raw.emailProviderId ?? raw.email_provider_id) ?? readString(nested?.id) ?? null;
  const providerCode = readString(nested?.code ?? raw.providerCode ?? raw.provider_code) ?? null;
  const providerName =
    readString(nested?.name ?? nested?.label ?? raw.providerName ?? raw.provider_name) ?? null;
  const providerTypeRaw = nested?.providerType ?? nested?.type;
  const providerKind =
    typeof providerTypeRaw === "string"
      ? resolveProviderKind({ providerType: providerTypeRaw, code: providerCode ?? undefined })
      : providerCode
        ? resolveProviderKind({ code: providerCode })
        : null;

  return { emailProviderId, providerName, providerCode, providerKind };
}

/** Normalizes list items from GET `/email/platform-mail-assignments` (`data.items[]`). */
export function normalizePlatformMailAssignmentListItem(
  payload: unknown,
): PlatformMailAssignmentListItem | null {
  const raw = asRecord(payload);
  if (!raw) return null;

  const resellerId = readString(raw.resellerId ?? raw.reseller_id);
  if (!resellerId) return null;

  const provider = readNestedProvider(raw);
  const lastTestRaw = raw.lastTestStatus ?? raw.last_test_status;

  return {
    id: readString(raw.id) ?? resellerId,
    resellerId,
    resellerName: readString(raw.resellerName ?? raw.reseller_name ?? raw.name) ?? resellerId,
    fromEmail: readString(raw.fromEmail ?? raw.from_email) ?? null,
    fromName: readString(raw.fromName ?? raw.from_name) ?? null,
    isEnabled: readBool(raw.isEnabled ?? raw.is_enabled ?? raw.enabled),
    emailProviderId: provider.emailProviderId,
    providerName: provider.providerName,
    providerCode: provider.providerCode,
    providerKind: provider.providerKind,
    lastTestStatus: readTestStatus(lastTestRaw),
    lastTestedAt: readString(raw.lastTestedAt ?? raw.last_tested_at) ?? null,
    lastTestMessage:
      readString(raw.lastTestMessage ?? raw.last_test_message ?? raw.testMessage ?? raw.test_message) ??
      null,
    updatedAt: readString(raw.updatedAt ?? raw.updated_at) ?? null,
  };
}

/** Normalizes GET/PUT `/resellers/:id/platform-mail-assignment`. */
export function normalizePlatformMailAssignment(payload: unknown): PlatformMailAssignment {
  const raw = asRecord(payload);
  if (!raw) {
    return { isEnabled: false };
  }

  const provider = readNestedProvider(raw);

  return {
    resellerId: readString(raw.resellerId ?? raw.reseller_id),
    fromEmail: readString(raw.fromEmail ?? raw.from_email) ?? null,
    fromName: readString(raw.fromName ?? raw.from_name) ?? null,
    isEnabled: readBool(raw.isEnabled ?? raw.is_enabled ?? raw.enabled),
    updatedAt: readString(raw.updatedAt ?? raw.updated_at) ?? null,
    updatedBy: readString(raw.updatedBy ?? raw.updated_by) ?? null,
    emailProviderId: provider.emailProviderId,
    providerName: provider.providerName,
    providerCode: provider.providerCode,
    providerKind: provider.providerKind,
  };
}
