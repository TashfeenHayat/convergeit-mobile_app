export const chatSettingsKeys = {
  all: ["chat-settings"] as const,
  widgetsList: (q: {
    search?: string;
    resellerId?: string;
    parentCompanyId?: string;
    childCompanyId?: string;
  }) =>
    [
      ...chatSettingsKeys.all,
      "widgets",
      q.search ?? "",
      q.resellerId ?? "",
      q.parentCompanyId ?? "",
      q.childCompanyId ?? "",
    ] as const,
  website: (websiteId: string) => [...chatSettingsKeys.all, "website", websiteId] as const,
  departments: (parentCompanyId: string, resellerId?: string) =>
    [...chatSettingsKeys.all, "departments", parentCompanyId, resellerId ?? ""] as const,
  pools: (parentCompanyId: string) =>
    [...chatSettingsKeys.all, "pools", parentCompanyId] as const,
  qaRoster: (websiteId: string) =>
    [...chatSettingsKeys.all, "qa-roster", websiteId] as const,
  qaRosterExclusions: (websiteId: string) =>
    [...chatSettingsKeys.all, "qa-roster-exclusions", websiteId] as const,
  globalQaPolicy: (q: {
    resellerId?: string;
    parentCompanyId?: string;
    childCompanyId?: string;
  }) =>
    [
      ...chatSettingsKeys.all,
      "qa-policy",
      "global",
      q.resellerId ?? "",
      q.parentCompanyId ?? "",
      q.childCompanyId ?? "",
    ] as const,
  cannedList: (q: {
    resellerId?: string;
    parentCompanyId?: string;
    childCompanyId?: string;
    websiteId?: string;
  }) =>
    [
      ...chatSettingsKeys.all,
      "canned",
      "list",
      q.resellerId ?? "",
      q.parentCompanyId ?? "",
      q.childCompanyId ?? "",
      q.websiteId ?? "",
    ] as const,
  cannedWebsite: (websiteId: string) =>
    [...chatSettingsKeys.all, "canned", "website", websiteId] as const,
  closePolicyList: (q: {
    resellerId?: string;
    parentCompanyId?: string;
    childCompanyId?: string;
    websiteId?: string;
    search?: string;
  }) =>
    [
      ...chatSettingsKeys.all,
      "close-policy",
      "list",
      q.resellerId ?? "",
      q.parentCompanyId ?? "",
      q.childCompanyId ?? "",
      q.websiteId ?? "",
      q.search ?? "",
    ] as const,
};
