import { extractUsersRows, parseUserListType } from "@/lib/users/user-list-rows";
import { unwrapApiData } from "@/lib/utils/core";

export type RosterUserOption = {
  id: string;
  label: string;
  name: string;
  email?: string;
  department?: string;
  pool?: string;
  userType: "Internal" | "External";
  disabled: boolean;
  disabledReason?: string;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function isDeptHeadOfDepartment(row: Record<string, unknown>, departmentId: string): boolean {
  const list = row.departmentHeadOf;
  if (!Array.isArray(list)) return Boolean(row.isDepartmentHead);
  return list.some((item) => {
    const r = asRecord(item);
    return r && String(r.departmentId ?? "") === departmentId;
  });
}

function isPoolHeadInDepartment(row: Record<string, unknown>, departmentId: string): boolean {
  if (!Boolean(row.isPoolHead)) return false;
  const userDept = String(
    row.departmentId ?? asRecord(row.department)?.id ?? "",
  ).trim();
  const poolDept = String(
    row.poolDepartmentId ?? asRecord(row.pool)?.departmentId ?? "",
  ).trim();
  if (userDept === departmentId || poolDept === departmentId) return true;
  const list = row.poolHeadOf;
  if (!Array.isArray(list) || list.length === 0) return false;
  return userDept === departmentId;
}

function rosterBlocked(
  row: Record<string, unknown>,
  departmentId: string,
): { blocked: boolean; reason?: string } {
  const deptHeadHere = isDeptHeadOfDepartment(row, departmentId);
  const poolHeadHere = isPoolHeadInDepartment(row, departmentId);
  if (deptHeadHere && !poolHeadHere) {
    return {
      blocked: true,
      reason: "Department heads cannot take website chat roster slots",
    };
  }
  return { blocked: false };
}

function buildOptionFromRow(
  raw: Record<string, unknown>,
  departmentId: string,
  fallbackUserType: "Internal" | "External",
): RosterUserOption | null {
  const id = String(raw.id ?? "").trim();
  if (!id) return null;
  const name =
    [raw.firstName, raw.lastName].filter(Boolean).join(" ").trim() ||
    String(raw.email ?? "User");
  const email = String(raw.email ?? "").trim() || undefined;
  const department =
    String(raw.departmentName ?? asRecord(raw.department)?.name ?? "").trim() || undefined;
  const pool =
    String(raw.poolName ?? asRecord(raw.pool)?.name ?? "").trim() || undefined;
  const userType = parseUserListType(raw as Parameters<typeof parseUserListType>[0]);
  const parts = [name];
  if (email) parts.push(email);
  if (department) parts.push(department);
  if (pool) parts.push(`Pool: ${pool}`);
  const { blocked, reason } = rosterBlocked(raw, departmentId);
  return {
    id,
    name,
    email,
    department,
    pool,
    userType: userType || fallbackUserType,
    label: parts.join(" · "),
    disabled: blocked,
    disabledReason: reason,
  };
}

export function buildRosterUserOptions(
  payload: unknown,
  departmentId: string,
  channel: "Internal" | "External" = "Internal",
): RosterUserOption[] {
  const layer = unwrapApiData(payload);
  const list = Array.isArray(layer)
    ? layer
    : Array.isArray(asRecord(layer)?.items)
      ? (asRecord(layer)!.items as unknown[])
      : [];

  const fromList = list
    .map((item) => {
      const raw = asRecord(item);
      if (!raw) return null;
      return buildOptionFromRow(raw, departmentId, channel);
    })
    .filter((o): o is RosterUserOption => o != null);

  if (fromList.length > 0) return fromList;

  return extractUsersRows(payload).map((row) => {
    const raw = row as Record<string, unknown>;
    const { blocked, reason } = rosterBlocked(raw, departmentId);
    const pool = String(raw.poolName ?? "").trim() || undefined;
    const name = row.user;
    const email = row.email && row.email !== "—" ? row.email : undefined;
    const department =
      row.department && row.department !== "—" ? row.department : undefined;
    const parts = [name];
    if (email) parts.push(email);
    if (department) parts.push(department);
    if (pool) parts.push(`Pool: ${pool}`);
    return {
      id: row.id,
      name,
      email,
      department,
      pool,
      userType: channel,
      label: parts.join(" · "),
      disabled: blocked,
      disabledReason: reason,
    };
  });
}

export function formatRosterSelectLabel(option: RosterUserOption): string {
  const typeTag = option.userType === "External" ? "External" : "Internal";
  return `[${typeTag}] ${option.label}`;
}
