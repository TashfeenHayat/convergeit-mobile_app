import { apiClient } from "@/api";
import { unwrapChatHttpData } from "./http";
import type {
  InternalSupervisorListQuery,
  InternalSupervisorListRow,
} from "./internal-supervisors-list.types";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function extractItems(payload: unknown): unknown[] {
  const raw = unwrapChatHttpData<unknown>(payload);
  if (Array.isArray(raw)) return raw;
  const rec = asRecord(raw);
  if (rec && Array.isArray(rec.items)) return rec.items;
  return [];
}

function normalizeListRow(raw: unknown): InternalSupervisorListRow | null {
  const row = asRecord(raw);
  if (!row) return null;
  const parentCompanyId = String(row.parentCompanyId ?? "").trim();
  const poolId = String(row.poolId ?? "").trim();
  const userId = String(row.userId ?? "").trim();
  if (!parentCompanyId || !poolId || !userId) return null;
  const user = asRecord(row.user) ?? {};
  const parent = asRecord(row.parentCompany) ?? {};
  return {
    id: String(row.id ?? `${parentCompanyId}-${userId}-${poolId}`),
    parentCompanyId,
    userId,
    poolId,
    sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : 0,
    poolName: String(row.poolName ?? "").trim() || "Pool",
    departmentName: String(row.departmentName ?? "").trim() || "Department",
    user: {
      id: String(user.id ?? userId),
      email: String(user.email ?? "").trim(),
      name: String(user.name ?? "").trim(),
      userType: String(user.userType ?? "").trim(),
    },
    parentCompany: {
      parentCompanyId: String(parent.parentCompanyId ?? parentCompanyId),
      parentCompanyName: String(parent.parentCompanyName ?? "").trim(),
      resellerId: String(parent.resellerId ?? "").trim(),
      resellerName: String(parent.resellerName ?? "").trim(),
    },
  };
}

export async function listInternalSupervisorsInScope(
  query: InternalSupervisorListQuery = {},
): Promise<InternalSupervisorListRow[]> {
  const { data } = await apiClient.get<unknown>("/chat/internal-supervisors/users", {
    params: {
      all: query.all ?? true,
      resellerId: query.resellerId?.trim() || undefined,
      parentCompanyId: query.parentCompanyId?.trim() || undefined,
      search: query.search?.trim() || undefined,
    },
  });
  return extractItems(data)
    .map(normalizeListRow)
    .filter((row): row is InternalSupervisorListRow => row != null);
}

export async function fetchInternalSupervisorsForParentCompany(
  parentCompanyId: string,
): Promise<InternalSupervisorListRow[]> {
  const { data } = await apiClient.get<unknown>(
    `/chat/internal-supervisors/parent-companies/${encodeURIComponent(parentCompanyId)}/users`,
  );
  const raw = unwrapChatHttpData<unknown>(data);
  const rows = Array.isArray(raw) ? raw : [];
  return rows
    .map((row) => {
      const normalized = normalizeListRow({
        ...asRecord(row),
        parentCompanyId,
        parentCompany: { parentCompanyId },
      });
      return normalized;
    })
    .filter((row): row is InternalSupervisorListRow => row != null);
}

export async function saveInternalSupervisorPoolsForUser(
  userId: string,
  poolIds: string[],
): Promise<void> {
  await apiClient.put(
    `/chat/internal-supervisors/users/${encodeURIComponent(userId)}/pools`,
    {
      items: poolIds.map((poolId, index) => ({
        userId,
        poolId,
        sortOrder: index,
      })),
    },
  );
}

export async function saveInternalSupervisorsForParentCompany(
  parentCompanyId: string,
  body: { items: Array<{ userId: string; poolId: string; sortOrder?: number }> },
): Promise<InternalSupervisorListRow[]> {
  const { data } = await apiClient.put<unknown>(
    `/chat/internal-supervisors/parent-companies/${encodeURIComponent(parentCompanyId)}/users`,
    body,
  );
  const raw = unwrapChatHttpData<unknown>(data);
  const rows = Array.isArray(raw) ? raw : [];
  return rows
    .map((row) =>
      normalizeListRow({
        ...asRecord(row),
        parentCompanyId,
        parentCompany: { parentCompanyId },
      }),
    )
    .filter((row): row is InternalSupervisorListRow => row != null);
}
