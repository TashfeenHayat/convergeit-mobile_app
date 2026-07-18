export const crmIntegrationKeys = {
  all: ["crm-integration"] as const,
  platforms: () => [...crmIntegrationKeys.all, "platforms"] as const,
  list: (params: Record<string, unknown>) =>
    [...crmIntegrationKeys.all, "list", params] as const,
  detail: (id: string) => [...crmIntegrationKeys.all, "detail", id] as const,
  lookup: (companyId: string, platformCode: string) =>
    [...crmIntegrationKeys.all, "lookup", companyId, platformCode] as const,
  discoverFields: (id: string) =>
    [...crmIntegrationKeys.all, "discover-fields", id] as const,
};
