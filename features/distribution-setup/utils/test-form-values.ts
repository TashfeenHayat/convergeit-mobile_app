import type { EmailFormFieldRow } from "@/api/email/email-forms.api";
import { isConfigurableEmailFormFieldKey } from "@/features/email/constants/agent-distribution-form-fields";
import { EMAIL_FORM_TEST_SAMPLE } from "@/features/email/constants/email-form-test-sample";

export function buildDistributionTestFormValues(
  fields: EmailFormFieldRow[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of fields) {
    if (!field.enabled || !isConfigurableEmailFormFieldKey(field.fieldKey)) continue;
    out[field.fieldKey] = EMAIL_FORM_TEST_SAMPLE[field.fieldKey] ?? "";
  }
  return out;
}
