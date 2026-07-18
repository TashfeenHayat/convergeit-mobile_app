import {
  asRecord,
  extractUsersRows,
  parseUserListType,
  pickArray,
} from "@/lib/users/user-list-rows";
import { unwrapApiData } from "@/lib/utils/core";

export type ChatRosterUserOption = {
  id: string;
  label: string;
  email: string;
};

function rawUserRows(payload: unknown): Record<string, unknown>[] {
  const layer = unwrapApiData(payload);
  if (Array.isArray(layer)) {
    return layer.map(asRecord).filter((r): r is Record<string, unknown> => r !== null);
  }
  const fromLayer = pickArray(layer, ["items", "rows", "results", "users", "records", "list", "members"]);
  if (fromLayer.length > 0) {
    return fromLayer.map(asRecord).filter((r): r is Record<string, unknown> => r !== null);
  }
  const fromRoot = pickArray(payload, ["items", "rows", "results", "users"]);
  return fromRoot.map(asRecord).filter((r): r is Record<string, unknown> => r !== null);
}

function departmentIdFromRaw(raw: Record<string, unknown>): string {
  return String(raw.departmentId ?? raw.department_id ?? asRecord(raw.department)?.id ?? "").trim();
}

function parentCompanyIdFromRaw(raw: Record<string, unknown>): string {
  return String(
    raw.parentCompanyId ?? raw.parent_company_id ?? asRecord(raw.parentCompany)?.id ?? raw.companyId ?? "",
  ).trim();
}

export function extractUserRows(payload: unknown): Record<string, unknown>[] {
  return rawUserRows(payload);
}

export function buildChatRosterUserOptions(
  payload: unknown,
  filters?: {
    parentCompanyId?: string;
    userType?: "Internal" | "External";
    departmentId?: string;
    /** When true, skip client department/parent filters (API already scoped). */
    trustApiScope?: boolean;
  },
): ChatRosterUserOption[] {
  const rawRows = rawUserRows(payload);
  const fromRaw =
    rawRows.length > 0
      ? rawRows
          .map((raw) => {
            const id = String(raw.id ?? raw.userId ?? "").trim();
            if (!id) return null;
            const type = parseUserListType(raw);
            if (filters?.userType === "Internal" && type !== "Internal") return null;
            if (filters?.userType === "External" && type !== "External") return null;

            if (!filters?.trustApiScope) {
              const pc = parentCompanyIdFromRaw(raw);
              if (filters?.parentCompanyId && pc && pc !== filters.parentCompanyId) {
                return null;
              }
              const deptId = departmentIdFromRaw(raw);
              if (filters?.departmentId && deptId && deptId !== filters.departmentId) {
                return null;
              }
            }

            const name =
              [raw.firstName, raw.lastName].filter(Boolean).join(" ").trim() ||
              String(raw.displayName ?? raw.name ?? "").trim() ||
              "User";
            const email = String(raw.email ?? "").trim();
            const dept = String(raw.departmentName ?? asRecord(raw.department)?.name ?? "").trim();
            const pool = String(raw.poolName ?? asRecord(raw.pool)?.name ?? "").trim();
            const parts = [name];
            if (email) parts.push(email);
            if (dept) parts.push(dept);
            if (pool) parts.push(`Pool: ${pool}`);
            return { id, label: parts.join(" · "), email };
          })
          .filter((u): u is ChatRosterUserOption => u !== null)
      : [];

  if (fromRaw.length > 0) {
    return fromRaw.sort((a, b) => a.label.localeCompare(b.label));
  }

  return extractUsersRows(payload)
    .map((row) => {
      if (filters?.userType === "Internal" && row.type !== "Internal") return null;
      if (filters?.userType === "External" && row.type !== "External") return null;
      if (
        !filters?.trustApiScope &&
        filters?.parentCompanyId &&
        row.parentCompanyId &&
        row.parentCompanyId !== filters.parentCompanyId
      ) {
        return null;
      }
      const parts = [row.user];
      if (row.email && row.email !== "—") parts.push(row.email);
      if (row.department && row.department !== "—") parts.push(row.department);
      return { id: row.id, label: parts.join(" · "), email: row.email };
    })
    .filter((u): u is ChatRosterUserOption => u !== null)
    .sort((a, b) => a.label.localeCompare(b.label));
}
