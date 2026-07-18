import { apiClient } from "@/api";
import { unwrapChatHttpData } from "./http";

export type QaDirectoryDepartment = {
  id: string;
  label: string;
  departmentType: string;
};

export type QaDirectoryPool = {
  id: string;
  label: string;
  poolName: string;
  departmentId: string;
  departmentName: string;
  memberCount: number;
};

export type QaDirectoryUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  userType: string;
  excluded: boolean;
  excludeReason: string | null;
};

function extractItems<T>(payload: unknown, map: (raw: unknown) => T | null): T[] {
  const data = unwrapChatHttpData<unknown>(payload);
  const list = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)
      ? ((data as { items: unknown[] }).items ?? [])
      : [];
  return list.map(map).filter((x): x is T => x !== null);
}

export async function listQaDirectoryDepartments(params: {
  type: "Internal" | "External";
  resellerId?: string;
  parentCompanyId?: string;
}): Promise<QaDirectoryDepartment[]> {
  const { data } = await apiClient.get<unknown>("/chat/qa/directory/departments", {
    params: {
      type: params.type,
      resellerId: params.resellerId?.trim() || undefined,
      parentCompanyId: params.parentCompanyId?.trim() || undefined,
    },
  });
  return extractItems(data, (raw) => {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    const id = String(r.id ?? "").trim();
    if (!id) return null;
    return {
      id,
      label: String(r.label ?? r.name ?? id),
      departmentType: String(r.departmentType ?? params.type),
    };
  });
}

export async function listQaDirectoryPools(params: {
  resellerId?: string;
  parentCompanyId?: string;
}): Promise<QaDirectoryPool[]> {
  const { data } = await apiClient.get<unknown>("/chat/qa/directory/pools", {
    params: {
      resellerId: params.resellerId?.trim() || undefined,
      parentCompanyId: params.parentCompanyId?.trim() || undefined,
    },
  });
  return extractItems(data, (raw) => {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    const id = String(r.id ?? "").trim();
    if (!id) return null;
    return {
      id,
      label: String(r.label ?? r.name ?? id),
      poolName: String(r.poolName ?? r.name ?? ""),
      departmentId: String(r.departmentId ?? ""),
      departmentName: String(r.departmentName ?? ""),
      memberCount:
        typeof r.memberCount === "number" && Number.isFinite(r.memberCount)
          ? r.memberCount
          : 0,
    };
  });
}

export async function listQaDirectoryUsers(params: {
  userType: "Internal" | "External";
  departmentId?: string;
  poolId?: string;
  websiteId?: string;
  search?: string;
}): Promise<QaDirectoryUser[]> {
  const { data } = await apiClient.get<unknown>("/chat/qa/directory/users", {
    params: {
      all: true,
      userType: params.userType,
      departmentId: params.departmentId?.trim() || undefined,
      poolId: params.poolId?.trim() || undefined,
      websiteId: params.websiteId?.trim() || undefined,
      search: params.search?.trim() || undefined,
    },
  });
  return extractItems(data, (raw) => {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    const id = String(r.id ?? "").trim();
    if (!id) return null;
    return {
      id,
      email: String(r.email ?? ""),
      firstName: r.firstName != null ? String(r.firstName) : null,
      lastName: r.lastName != null ? String(r.lastName) : null,
      userType: String(r.userType ?? params.userType),
      excluded: Boolean(r.excluded),
      excludeReason: r.excludeReason != null ? String(r.excludeReason) : null,
    };
  });
}
