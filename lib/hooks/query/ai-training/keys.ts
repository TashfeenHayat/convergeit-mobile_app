export const aiTrainingKeys = {
  all: ["ai-training"] as const,
  behavior: (websiteId: string) =>
    [...aiTrainingKeys.all, "behavior", websiteId] as const,
  testContext: (websiteId: string) =>
    [...aiTrainingKeys.all, "test-context", websiteId] as const,
  automationFlow: (websiteId: string, variant: string) =>
    [...aiTrainingKeys.all, "automation-flow", websiteId, variant] as const,
  websiteSetup: (websiteId: string) =>
    [...aiTrainingKeys.all, "website-setup", websiteId] as const,
  copilotWebsites: (q: {
    resellerId?: string;
    parentCompanyId?: string;
    childCompanyId?: string;
    limit?: number;
    offset?: number;
  }) =>
    [
      ...aiTrainingKeys.all,
      "copilot-websites",
      q.resellerId ?? "",
      q.parentCompanyId ?? "",
      q.childCompanyId ?? "",
      q.limit ?? 200,
      q.offset ?? 0,
    ] as const,
  llmProfiles: () => [...aiTrainingKeys.all, "llm-profiles"] as const,
  platformLlmProviders: () =>
    [...aiTrainingKeys.all, "platform-llm-providers"] as const,
  platformAiOverview: () =>
    [...aiTrainingKeys.all, "platform-ai-overview"] as const,
};
