import { unwrapApiData } from "@/lib/utils/core";

export interface CatalogOption {
  id: string;
  label: string;
}

export interface DepartmentCatalogOption extends CatalogOption {
  departmentType: "Internal" | "External";
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function pickArray(payload: unknown): Record<string, unknown>[] {
  const data = unwrapApiData(payload);
  if (Array.isArray(data)) return data.filter(isRecord);
  if (!isRecord(data)) return [];
  for (const key of ["items", "data", "rows", "results", "departments", "pools"]) {
    const arr = data[key];
    if (Array.isArray(arr)) return arr.filter(isRecord);
  }
  return [];
}

function readDepartmentType(row: Record<string, unknown>): "Internal" | "External" {
  const raw = String(row.type ?? row.departmentType ?? "Internal").trim().toLowerCase();
  return raw === "external" ? "External" : "Internal";
}

export function parseDepartmentCatalog(payload: unknown): DepartmentCatalogOption[] {
  return pickArray(payload)
    .map((row) => {
      const id = String(row.id ?? "").trim();
      const name = String(row.name ?? row.departmentName ?? "").trim();
      if (!id) return null;
      return {
        id,
        label: name || id,
        departmentType: readDepartmentType(row),
      };
    })
    .filter((x): x is DepartmentCatalogOption => Boolean(x));
}

export function parseDepartmentOptions(payload: unknown): CatalogOption[] {
  return parseDepartmentCatalog(payload);
}

export interface PoolCatalogOption extends CatalogOption {
  departmentId: string | null;
}

export function parsePoolOptions(payload: unknown): PoolCatalogOption[] {
  return pickArray(payload)
    .map((row) => {
      const id = String(row.id ?? "").trim();
      const name = String(row.name ?? row.poolName ?? "").trim();
      const departmentId = String(row.departmentId ?? row.department_id ?? "").trim() || null;
      if (!id) return null;
      return { id, label: name || id, departmentId };
    })
    .filter((x): x is PoolCatalogOption => Boolean(x));
}
