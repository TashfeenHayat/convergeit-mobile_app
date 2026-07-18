import type { CrmPlatformField } from "@/api/crm/crm-integration.api";

function normalizeFieldToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const OUR_FIELD_ALIASES: Record<string, string[]> = {
  name: ["firstname", "first name", "first_name", "fullname", "contact name"],
  email: ["email", "emailaddress", "email address", "emailaddress1"],
  phone: ["phone", "mobile", "phonenumber", "phone number", "telephone1"],
  company: ["company", "companyname", "company name", "organization", "companyname"],
  transcript: ["description", "notes", "message", "comments", "chat transcript"],
  department: [
    "lastname",
    "last name",
    "last_name",
    "department",
    "leadsource",
    "lead source",
    "subject",
    "title",
    "caseorigincode",
  ],
  website: ["website", "url", "web site", "websiteurl"],
};

export function autoMatchDiscoveredCrmField(
  ourFieldKey: string,
  ourLabel: string,
  discoveredFields: CrmPlatformField[],
): string {
  if (!discoveredFields.length) return "";

  const keys = new Set(discoveredFields.map((f) => f.fieldKey));
  const byNorm = new Map(
    discoveredFields.map((f) => [normalizeFieldToken(f.fieldKey), f.fieldKey]),
  );
  const labelByNorm = new Map(
    discoveredFields.map((f) => [normalizeFieldToken(f.label), f.fieldKey]),
  );

  const candidates = [ourLabel, ourFieldKey, ...(OUR_FIELD_ALIASES[ourFieldKey] ?? [])];

  for (const candidate of candidates) {
    const norm = normalizeFieldToken(candidate);
    const fromKey = byNorm.get(norm);
    if (fromKey && keys.has(fromKey)) return fromKey;
    const fromLabel = labelByNorm.get(norm);
    if (fromLabel && keys.has(fromLabel)) return fromLabel;
  }

  return "";
}
