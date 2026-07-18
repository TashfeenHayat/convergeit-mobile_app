export const distributionSetupKeys = {
  all: ["distribution-setups"] as const,
  list: (params: Record<string, unknown>) =>
    [...distributionSetupKeys.all, "list", params] as const,
  assignedWebsiteIds: () =>
    [...distributionSetupKeys.all, "assigned-website-ids"] as const,
  detail: (id: string) => [...distributionSetupKeys.all, "detail", id] as const,
};
