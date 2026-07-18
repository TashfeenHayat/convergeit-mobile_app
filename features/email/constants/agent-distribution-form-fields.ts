/** Same keys hidden from email form builder (department, notes, rating). */

export const EMAIL_FORM_HIDDEN_UI_KEYS = new Set<string>([

  "department",

  "notes",

  "rating",

]);



export function isConfigurableEmailFormFieldKey(fieldKey: string): boolean {

  return !EMAIL_FORM_HIDDEN_UI_KEYS.has(fieldKey);

}



export function isAgentDistributionFormField(fieldKey: string): boolean {

  return isConfigurableEmailFormFieldKey(fieldKey);

}


