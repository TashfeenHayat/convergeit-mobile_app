import type { EmailProviderKind, MailProviderSettings } from "../types/email.types";

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

function readFields(value: unknown): Record<string, string> {
  const raw = asRecord(value);
  if (!raw) return {};
  const out: Record<string, string> = {};
  for (const [key, v] of Object.entries(raw)) {
    if (v == null) continue;
    out[key] = String(v);
  }
  return out;
}

function readTestStatus(value: unknown): "success" | "failed" | null {
  if (value === "success" || value === "failed") return value;
  return null;
}

/** API may return a user object on `updatedBy` / `lastTestedBy`. */
export function readEmailActorLabel(value: unknown): string | null {
  if (typeof value === "string") {
    const s = value.trim();
    return s || null;
  }
  const actor = asRecord(value);
  if (!actor) return null;
  const name = [actor.firstName, actor.lastName]
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter(Boolean)
    .join(" ")
    .trim();
  if (name) return name;
  return readString(actor.email ?? actor.displayName) ?? null;
}

/**
 * Normalizes GET `/platform/email-settings` and `/resellers/:id/email-settings`.
 * Supports nested `emailProvider` and object `updatedBy`.
 */
export function normalizeMailProviderSettings(payload: unknown): MailProviderSettings {
  const raw = asRecord(payload);
  if (!raw) {
    return {
      emailProviderId: null,
      fromEmail: null,
      fromName: null,
      isEnabled: false,
      fields: {},
    };
  }

  const nestedProvider = asRecord(raw.emailProvider ?? raw.email_provider);
  const emailProviderId =
    readString(raw.emailProviderId ?? raw.email_provider_id) ??
    readString(nestedProvider?.id) ??
    null;

  const providerTypeRaw = nestedProvider?.providerType ?? nestedProvider?.type;
  const providerCode = readString(nestedProvider?.code);
  const kind =
    typeof providerTypeRaw === "string"
      ? resolveProviderKind({ providerType: providerTypeRaw, code: providerCode })
      : null;

  return {
    emailProviderId,
    fromEmail: readString(raw.fromEmail ?? raw.from_email) ?? null,
    fromName: readString(raw.fromName ?? raw.from_name) ?? null,
    isEnabled: readBool(raw.isEnabled ?? raw.is_enabled ?? raw.enabled),
    fields: readFields(raw.fields),
    lastTestedAt: readString(raw.lastTestedAt ?? raw.last_tested_at) ?? null,
    lastTestStatus: readTestStatus(raw.lastTestStatus ?? raw.last_test_status),
    lastTestMessage:
      readString(raw.lastTestMessage ?? raw.last_test_message ?? raw.testMessage ?? raw.test_message) ??
      null,
    updatedAt: readString(raw.updatedAt ?? raw.updated_at) ?? null,
    updatedBy: readEmailActorLabel(raw.updatedBy ?? raw.updated_by),
    lastTestedBy: readEmailActorLabel(raw.lastTestedBy ?? raw.last_tested_by),
    providerName: readString(nestedProvider?.name ?? nestedProvider?.label) ?? null,
    providerCode: providerCode ?? null,
    providerKind: kind,
  };
}
