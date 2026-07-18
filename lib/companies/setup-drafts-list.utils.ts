import { pickItemsArray } from "@/lib/companies/scope-tree-options";

export type CompanySetupDraftListItem = {
  id: string;
  label: string;
  stepLabel: string;
  status: string;
  updatedAt: string;
  expiresAt: string;
  childCount: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function parseCompanySetupDraftsList(data: unknown): CompanySetupDraftListItem[] {
  const root = asRecord(data);
  const envelope = root && "data" in root ? asRecord(root.data) ?? root : root;
  const items = pickItemsArray(envelope ?? data);
  return items
    .map((row) => {
      const r = asRecord(row);
      if (!r) return null;
      const id = String(r.id ?? "").trim();
      if (!id) return null;
      return {
        id,
        label: String(r.label ?? "Company setup").trim() || "Company setup",
        stepLabel: String(r.stepLabel ?? r.step ?? "Draft").trim() || "Draft",
        status: String(r.status ?? "draft").trim(),
        updatedAt: String(r.updatedAt ?? ""),
        expiresAt: String(r.expiresAt ?? ""),
        childCount: Number(r.childCount ?? 0) || 0,
      };
    })
    .filter((row): row is CompanySetupDraftListItem => row !== null);
}

export function formatSetupDraftWhen(iso: string): string {
  const trimmed = iso.trim();
  if (!trimmed) return "—";
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
