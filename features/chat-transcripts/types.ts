export type TranscriptSearchKind =
  | "reseller"
  | "parentCompany"
  | "childCompany"
  | "website"
  | "agent"
  | "conversationId";

export type TranscriptSearchSuggestion = {
  id: string;
  label: string;
  subtitle?: string;
};

export const TRANSCRIPT_SEARCH_KIND_OPTIONS: Array<{
  value: TranscriptSearchKind;
  label: string;
}> = [
  { value: "reseller", label: "Reseller" },
  { value: "parentCompany", label: "Parent" },
  { value: "childCompany", label: "Child" },
  { value: "website", label: "Website" },
  { value: "agent", label: "Agent" },
  { value: "conversationId", label: "Chat ID" },
];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}
