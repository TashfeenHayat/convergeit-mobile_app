function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export type CompanySetupSubmitResult = {
  resellerId: string;
  parentCompanyId: string;
  parentCompanyName: string;
  websites: { id: string; url: string; name: string | null }[];
};

/** Parse `POST /companies/setup/submit/:id` response for contract wizard handoff. */
export function parseCompanySetupSubmitResult(data: unknown): CompanySetupSubmitResult | null {
  const root = asRecord(data);
  const inner = root && "data" in root ? asRecord(root.data) : root;
  if (!inner) return null;

  const parent = asRecord(inner.parent);
  if (!parent) return null;

  const resellerId = String(parent.resellerId ?? "").trim();
  const parentCompanyId = String(parent.id ?? parent.parentCompanyId ?? "").trim();
  const parentCompanyName = String(parent.name ?? "").trim();
  if (!resellerId || !parentCompanyId) return null;

  const websites: CompanySetupSubmitResult["websites"] = [];
  const created = inner.created;
  if (Array.isArray(created)) {
    for (const item of created) {
      const row = asRecord(item);
      const website = asRecord(row?.website);
      if (!website) continue;
      const websiteId = String(website.id ?? "").trim();
      if (!websiteId) continue;
      websites.push({
        id: websiteId,
        url: String(website.url ?? ""),
        name: website.name != null ? String(website.name) : null,
      });
    }
  }

  return { resellerId, parentCompanyId, parentCompanyName, websites };
}
