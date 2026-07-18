export const CRM_BASE_PATH = "/dashboard/crm-integration";

export const CRM_ROUTES = {
  home: CRM_BASE_PATH,
  configure: `${CRM_BASE_PATH}/configure`,
  crmSelection: `${CRM_BASE_PATH}/crm-selection`,
  connectionMethod: `${CRM_BASE_PATH}/connection-method`,
  connection: `${CRM_BASE_PATH}/connection`,
  fieldMapping: `${CRM_BASE_PATH}/field-mapping`,
} as const;

export const CRM_PLATFORM_CODES = [
  "hubspot",
  "salesforce",
  "zoho",
  "dynamics365",
  "gohighlevel",
] as const;
export type CrmPlatformCode = (typeof CRM_PLATFORM_CODES)[number];
