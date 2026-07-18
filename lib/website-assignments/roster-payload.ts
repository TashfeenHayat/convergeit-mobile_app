import { unwrapApiData } from "@/lib/utils/core";
import type {
  ServiceChannel,
  WebsiteAssignmentChannelRoster,
  WebsiteAssignmentDetail,
  WebsiteAssignmentSlotUser,
  WebsiteDepartmentRosterRow,
} from "@/api/types/website-assignments.types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function readSlotUser(raw: unknown): WebsiteAssignmentSlotUser | null {
  if (!isRecord(raw)) return null;
  const userId = String(raw.userId ?? raw.id ?? "").trim();
  if (!userId) return null;
  const name =
    String(raw.name ?? raw.displayName ?? raw.fullName ?? "").trim() || userId.slice(0, 8);
  const email = String(raw.email ?? "").trim();
  const userType = raw.userType != null ? String(raw.userType) : undefined;
  return { userId, name, email, userType };
}

function readTierUsers(raw: unknown): WebsiteAssignmentSlotUser[] {
  if (Array.isArray(raw)) {
    return raw
      .map(readSlotUser)
      .filter((u): u is WebsiteAssignmentSlotUser => u !== null);
  }
  const single = readSlotUser(raw);
  return single ? [single] : [];
}

function readChannelRoster(raw: unknown): WebsiteAssignmentChannelRoster {
  const rec = isRecord(raw) ? raw : {};
  return {
    primary: readTierUsers(rec.primary),
    secondary: readTierUsers(rec.secondary),
    backup: readTierUsers(rec.backup),
  };
}

function readDepartmentRosterRow(raw: unknown): WebsiteDepartmentRosterRow | null {
  if (!isRecord(raw)) return null;
  const departmentId = String(raw.departmentId ?? raw.id ?? "").trim();
  if (!departmentId) return null;
  const rosterRaw = isRecord(raw.roster) ? raw.roster : {};
  return {
    departmentId,
    departmentName: String(raw.departmentName ?? raw.name ?? departmentId).trim(),
    departmentType: String(raw.departmentType ?? raw.type ?? "").trim(),
    roster: {
      internal: readChannelRoster(rosterRaw.internal),
      external: readChannelRoster(rosterRaw.external),
    },
  };
}

export function parseWebsiteAssignmentDetail(payload: unknown): WebsiteAssignmentDetail | null {
  const data = unwrapApiData(payload);
  if (!isRecord(data)) return null;
  const websiteId = String(data.websiteId ?? data.id ?? "").trim();
  if (!websiteId) return null;

  const allowedRaw = data.allowedAssignmentChannels;
  const allowedAssignmentChannels: ServiceChannel[] = Array.isArray(allowedRaw)
    ? allowedRaw
        .map((c) => String(c).trim())
        .filter((c): c is ServiceChannel => c === "Internal" || c === "External")
    : [];

  const rosterRaw = data.departmentRoster;
  const departmentRoster = Array.isArray(rosterRaw)
    ? rosterRaw
        .map(readDepartmentRosterRow)
        .filter((r): r is WebsiteDepartmentRosterRow => r !== null)
    : [];

  const op = String(data.operatingChannels ?? "internal_only").trim() as WebsiteAssignmentDetail["operatingChannels"];

  return {
    websiteId,
    url: String(data.url ?? data.websiteUrl ?? "").trim(),
    name: String(data.name ?? data.websiteName ?? "").trim(),
    operatingChannels:
      op === "external_only" || op === "both" ? op : "internal_only",
    allowedAssignmentChannels,
    serviceSchedulingConfigured: Boolean(data.serviceSchedulingConfigured),
    isFullyAssigned: Boolean(data.isFullyAssigned),
    expectedRosterSlots:
      typeof data.expectedRosterSlots === "number" ? data.expectedRosterSlots : undefined,
    filledSlots: typeof data.filledSlots === "number" ? data.filledSlots : undefined,
    departmentRoster,
    assignments: Array.isArray(data.assignments) ? data.assignments : undefined,
    parentCompanyId: String(data.parentCompanyId ?? "").trim() || undefined,
    parentCompanyName: String(data.parentCompanyName ?? "").trim() || undefined,
    childCompanyId: String(data.childCompanyId ?? "").trim() || undefined,
    childCompanyName: String(data.childCompanyName ?? "").trim() || undefined,
    resellerId: String(data.resellerId ?? "").trim() || undefined,
    resellerName: String(data.resellerName ?? "").trim() || undefined,
  };
}
