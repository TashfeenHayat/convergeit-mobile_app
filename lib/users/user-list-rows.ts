import { unwrapApiData } from "@/lib/utils/core";

export type UnknownRecord = Record<string, unknown>;

export type UserRow = {
  id: string;
  isPoc?: boolean;
  licenseKey?: string;
  user: string;
  email: string;
  type: "Internal" | "External";
  department: string;
  role: string;
  reseller: string;
  parentCompany: string;
  company: string;
  resellerId?: string;
  parentCompanyId?: string;
};

export function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

/** Pull an array out of common API envelope shapes, trying `candidates` keys at top level and under `data`. */
export function pickArray(payload: unknown, candidates: string[]): unknown[] {
  const root = asRecord(payload);
  if (!root) return [];
  for (const key of candidates) {
    const direct = root[key];
    if (Array.isArray(direct)) return direct;
  }
  const data = asRecord(root.data);
  if (!data) return [];
  for (const key of candidates) {
    const nested = data[key];
    if (Array.isArray(nested)) return nested;
  }
  return [];
}

/** Normalize GET /users row `userType` / `isInternal` (mixed casing from API). */
export function parseUserListType(row: UnknownRecord): "Internal" | "External" {
  if (typeof row.isInternal === "boolean") {
    return row.isInternal ? "Internal" : "External";
  }
  const nested = asRecord(row.user);
  if (nested && typeof nested.isInternal === "boolean") {
    return nested.isInternal ? "Internal" : "External";
  }
  const raw = row.userType ?? row.user_type ?? row.type;
  const normalized = String(raw ?? "").trim().toLowerCase();
  if (normalized === "internal") return "Internal";
  if (normalized === "external") return "External";
  return "External";
}

function toUserRow(value: unknown): UserRow | null {
  const row = asRecord(value);
  if (!row) return null;
  const firstName = String(row.firstName ?? "").trim();
  const middleName = String(row.middleName ?? "").trim();
  const lastName = String(row.lastName ?? "").trim();
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ").trim();

  const departmentObj = asRecord(row.department);
  const roleObj = asRecord(row.role);
  const designationObj = asRecord(row.designation);
  const resellerObj = asRecord(row.reseller);
  const parentCompanyObj = asRecord(row.parentCompany);
  const licenseObj = asRecord(row.license);

  const departmentName = String(
    row.departmentName ?? departmentObj?.name ?? designationObj?.departmentName ?? "—",
  ).trim();
  const roleName = String(row.roleName ?? roleObj?.name ?? designationObj?.name ?? "—").trim();
  const resellerName = String(row.companyName ?? resellerObj?.name ?? row.company ?? "-").trim();
  const parentCompanyName = String(parentCompanyObj?.name ?? row.parentCompanyName ?? "-").trim();
  const resellerId = String(row.resellerId ?? resellerObj?.id ?? "").trim();
  const parentCompanyId = String(row.parentCompanyId ?? parentCompanyObj?.id ?? "").trim();
  const id = String(row.id ?? row.userId ?? row.user_id ?? row._id ?? "").trim();
  const licenseKey = String(
    row.licenseKey ??
      row.tenantLicenseKey ??
      row.companyLicenseKey ??
      row.resellerLicenseKey ??
      licenseObj?.key ??
      row.license ??
      "",
  ).trim();

  return {
    id,
    isPoc: row.isPoc === true,
    licenseKey: licenseKey || undefined,
    user: fullName || String(row.name ?? row.fullName ?? row.email ?? "—"),
    email: String(row.email ?? "—"),
    type: parseUserListType(row),
    department: departmentName || "—",
    role: roleName || "—",
    reseller: resellerName || "-",
    parentCompany: parentCompanyName || "-",
    company: resellerName || parentCompanyName || "-",
    ...(resellerId ? { resellerId } : {}),
    ...(parentCompanyId ? { parentCompanyId } : {}),
  };
}

/** Normalize `GET /users` (and similar) list envelopes to flat rows. */
export function extractUsersRows(payload: unknown): UserRow[] {
  const layer = unwrapApiData(payload);
  if (Array.isArray(layer)) {
    return layer.map(toUserRow).filter((row): row is UserRow => row !== null);
  }
  const list = pickArray(layer, [
    "items",
    "rows",
    "results",
    "users",
    "records",
    "list",
    "members",
    "data",
  ]);
  return list.map(toUserRow).filter((row): row is UserRow => row !== null);
}
