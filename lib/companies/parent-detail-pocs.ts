import type {
  CompanyContactPoc,
  CompanyPocInviteSummary,
} from "@/api/types/companies.types";

export type NormalizedPocDisplayRow = {
  key: string;
  name: string;
  email: string;
  phone?: string;
  companyContactId?: string;
  userId?: string;
  roleId?: string;
  departmentName?: string;
  departmentDetails?: string;
  designationTitle?: string;
  designationDetails?: string;
};

function isCompanyContactPoc(p: unknown): p is CompanyContactPoc {
  if (typeof p !== "object" || p === null) return false;
  const o = p as Record<string, unknown>;
  return typeof o.user === "object" && o.user !== null && "companyContactId" in o;
}

function formatNameParts(first?: string | null, middle?: string | null, last?: string | null): string {
  const parts = [first, middle, last].map((x) => String(x ?? "").trim()).filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "";
}

function legacyEmail(p: CompanyPocInviteSummary): string {
  const a = String(p.pocEmail ?? "").trim();
  const b = String(p.email ?? "").trim();
  return a || b;
}

function legacyRow(key: string, p: CompanyPocInviteSummary): NormalizedPocDisplayRow {
  const name = formatNameParts(p.firstName, p.middleName, p.lastName);
  return {
    key,
    name: name || "—",
    email: legacyEmail(p) || "—",
    roleId: String(p.roleId ?? "").trim() || undefined,
    departmentName: String(p.departmentName ?? "").trim() || undefined,
    departmentDetails: String(p.departmentDetails ?? "").trim() || undefined,
    designationTitle: String(p.designationTitle ?? "").trim() || undefined,
    designationDetails: String(p.designationDetails ?? "").trim() || undefined,
  };
}

export function normalizePocsFromCarrier(carrier: {
  pocInvite?: CompanyPocInviteSummary | null;
  pocs?: CompanyContactPoc[] | CompanyPocInviteSummary[] | null;
}): NormalizedPocDisplayRow[] {
  const rows: NormalizedPocDisplayRow[] = [];
  const raw = carrier.pocs;

  if (Array.isArray(raw) && raw.length > 0) {
    raw.forEach((p, idx) => {
      if (isCompanyContactPoc(p)) {
        const u = p.user;
        const name = formatNameParts(u.firstName, u.middleName, u.lastName);
        const email = String(u.email ?? "").trim();
        const phone = String(u.phoneNo ?? "").trim();
        rows.push({
          key: p.companyContactId || `contact-${idx}`,
          name: name || "—",
          email: email || "—",
          phone: phone || undefined,
          companyContactId: p.companyContactId,
          userId: u.id,
        });
        return;
      }
      if (p != null && typeof p === "object") {
        rows.push(legacyRow(`legacy-${idx}`, p as CompanyPocInviteSummary));
      }
    });
    return rows;
  }

  if (carrier.pocInvite != null && typeof carrier.pocInvite === "object") {
    rows.push(legacyRow("pocInvite", carrier.pocInvite));
  }

  return rows;
}
