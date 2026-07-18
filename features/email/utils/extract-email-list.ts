import { normalizePlatformMailAssignmentListItem } from "@/api/email/normalize-platform-mail-assignment";
import type { PlatformMailAssignmentListItem, ResellerOwnMailListItem } from "../types";

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

function collectItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const root = asRecord(payload);
  if (!root) return [];
  const candidates = [
    root.rows,
    root.items,
    root.data,
    asRecord(root.data)?.rows,
    asRecord(root.data)?.items,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
}

export function extractResellerOwnMailList(payload: unknown): ResellerOwnMailListItem[] {
  const out: ResellerOwnMailListItem[] = [];
  for (const row of collectItems(payload)) {
    const raw = asRecord(row);
    if (!raw) continue;
    const resellerId = readString(raw.resellerId ?? raw.reseller_id);
    if (!resellerId) continue;
    const nestedProvider = asRecord(raw.emailProvider ?? raw.email_provider);
    const providerName =
      readString(nestedProvider?.name ?? raw.providerName ?? raw.provider_name ?? raw.provider) ??
      null;
    const providerCode =
      readString(nestedProvider?.code ?? raw.providerCode ?? raw.provider_code) ?? null;
    const lastTestRaw = raw.lastTestStatus ?? raw.last_test_status;
    out.push({
      resellerId,
      resellerName: readString(raw.resellerName ?? raw.reseller_name ?? raw.name) ?? resellerId,
      provider: providerName ?? undefined,
      providerName: providerName ?? undefined,
      providerCode,
      emailProviderId: readString(raw.emailProviderId ?? raw.email_provider_id) ?? null,
      fromEmail: readString(raw.fromEmail ?? raw.from_email) ?? null,
      isEnabled: readBool(raw.isEnabled ?? raw.is_enabled ?? raw.enabled),
      lastTestStatus:
        lastTestRaw === "success" || lastTestRaw === "failed" ? lastTestRaw : null,
      lastTestedAt: readString(raw.lastTestedAt ?? raw.last_tested_at) ?? null,
      lastTestMessage:
        readString(raw.lastTestMessage ?? raw.last_test_message ?? raw.testMessage) ?? null,
    });
  }
  return out;
}

export function extractPlatformAssignmentList(payload: unknown): PlatformMailAssignmentListItem[] {
  const out: PlatformMailAssignmentListItem[] = [];
  for (const row of collectItems(payload)) {
    const item = normalizePlatformMailAssignmentListItem(row);
    if (item) out.push(item);
  }
  return out;
}

export function formatLastTestLabel(
  status?: "success" | "failed" | null,
  testedAt?: string | null,
): string {
  if (!status) return "—";
  const at = testedAt ? new Date(testedAt).toLocaleString() : "";
  return at ? `${status} · ${at}` : status;
}
