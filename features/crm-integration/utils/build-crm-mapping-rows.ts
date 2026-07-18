import type { EmailFormFieldRow } from "@/api/email/email-forms.api";
import type { CrmFieldMapping, CrmPlatformField } from "@/api/crm/crm-integration.api";
import type { CrmFieldMappingRow } from "../components/CrmFieldMappingEditor";
import { isConfigurableEmailFormFieldKey } from "@/features/email/constants/agent-distribution-form-fields";
import {
  CRM_DEPARTMENT_FIELD_KEY,
  CRM_DEPARTMENT_FIELD_LABEL,
} from "../crm-field-map.constants";
import { autoMatchDiscoveredCrmField } from "./match-crm-field";

export function buildCrmMappingRowsFromEmailForm(params: {
  emailFormFields: EmailFormFieldRow[];
  savedMappings?: CrmFieldMapping[];
  discoveredCrmFields: CrmPlatformField[];
}): CrmFieldMappingRow[] {
  const { emailFormFields, savedMappings = [], discoveredCrmFields } = params;
  const savedMap = new Map(savedMappings.map((m) => [m.ourFieldKey, m.crmFieldKey]));

  const resolveCrmKey = (ourFieldKey: string, ourLabel: string): string => {
    const saved = savedMap.get(ourFieldKey)?.trim();
    if (saved) return saved;
    return autoMatchDiscoveredCrmField(ourFieldKey, ourLabel, discoveredCrmFields);
  };

  const rows: CrmFieldMappingRow[] = emailFormFields
    .filter((f) => f.enabled && isConfigurableEmailFormFieldKey(f.fieldKey))
    .map((field) => ({
      ourFieldKey: field.fieldKey,
      ourFieldLabel: field.label,
      crmFieldKey: resolveCrmKey(field.fieldKey, field.label),
    }));

  if (!rows.some((r) => r.ourFieldKey === CRM_DEPARTMENT_FIELD_KEY)) {
    rows.push({
      ourFieldKey: CRM_DEPARTMENT_FIELD_KEY,
      ourFieldLabel: CRM_DEPARTMENT_FIELD_LABEL,
      crmFieldKey: resolveCrmKey(CRM_DEPARTMENT_FIELD_KEY, CRM_DEPARTMENT_FIELD_LABEL),
    });
  }

  return rows;
}
