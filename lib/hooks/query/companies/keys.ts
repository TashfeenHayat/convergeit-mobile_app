type Params = Record<string, unknown> | undefined;

export const companiesKeys = {
  all: ["companies"] as const,
  list: (params?: Params) => [...companiesKeys.all, "list", params] as const,
  byReseller: (resellerId: string, params?: Params) =>
    [...companiesKeys.all, "by-reseller", resellerId, params] as const,
  setupResellers: () => [...companiesKeys.all, "setup", "resellers"] as const,
  setupDraftLatest: () => [...companiesKeys.all, "setup", "draft", "latest"] as const,
  setupDrafts: () => [...companiesKeys.all, "setup", "drafts"] as const,
  setupDraft: (draftId: string) =>
    [...companiesKeys.all, "setup", "draft", draftId] as const,
  parent: (id: string) => [...companiesKeys.all, "parent", id] as const,
  detail: (id: string) => [...companiesKeys.all, "detail", id] as const,
  pocDirectory: (params?: Params) =>
    [...companiesKeys.all, "poc-directory", params] as const,
  websiteDirectory: (params?: Params) =>
    [...companiesKeys.all, "website-directory", params] as const,
};
