export function agentDistributionFieldMultiline(fieldType: string, fieldKey: string): boolean {
  const t = fieldType.toLowerCase();
  return t === "textarea" || t === "multiline" || fieldKey === "transcript" || fieldKey === "journey" || fieldKey === "notes";
}

export function agentDistributionMultilineRows(fieldKey: string): number {
  if (fieldKey === "transcript") return 4;
  if (fieldKey === "journey") return 3;
  return 3;
}

export type AgentDistributionFormFieldLike = {
  fieldKey: string;
  label: string;
  fieldType: string;
  enabled?: boolean;
  isRequired?: boolean;
  readOnly?: boolean;
};
