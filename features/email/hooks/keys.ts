export const emailKeys = {
  all: ["email"] as const,
  providers: () => [...emailKeys.all, "providers"] as const,
  providerSchema: (providerId: string) => [...emailKeys.all, "provider-schema", providerId] as const,
  platformSettings: () => [...emailKeys.all, "platform-settings"] as const,
  resellerOwnMailList: () => [...emailKeys.all, "reseller-own-mail-list"] as const,
  resellerOwnMail: (resellerId: string) => [...emailKeys.all, "reseller-own-mail", resellerId] as const,
  platformAssignmentList: () => [...emailKeys.all, "platform-assignment-list"] as const,
  platformAssignment: (resellerId: string) =>
    [...emailKeys.all, "platform-assignment", resellerId] as const,
  templateDraft: (resellerId: string) => [...emailKeys.all, "template-draft", resellerId] as const,
  templateDraftPreview: (resellerId: string) =>
    [...emailKeys.all, "template-draft-preview", resellerId] as const,
  templatePublishedPreview: (resellerId: string) =>
    [...emailKeys.all, "template-published-preview", resellerId] as const,
  templatePublished: (resellerId: string) =>
    [...emailKeys.all, "template-published", resellerId] as const,
  templateAssignment: (resellerId: string) =>
    [...emailKeys.all, "template-assignment", resellerId] as const,
  templateById: (templateId: string) => [...emailKeys.all, "template-by-id", templateId] as const,
  templatePreviewById: (templateId: string) =>
    [...emailKeys.all, "template-preview-by-id", templateId] as const,
  platformTemplateDraft: () => [...emailKeys.all, "platform-template-draft"] as const,
  platformTemplatePublished: () => [...emailKeys.all, "platform-template-published"] as const,
  platformTemplateDraftPreview: () => [...emailKeys.all, "platform-template-draft-preview"] as const,
  platformTemplatePublishedPreview: () =>
    [...emailKeys.all, "platform-template-published-preview"] as const,
  platformTemplateAssignmentList: () =>
    [...emailKeys.all, "platform-template-assignment-list"] as const,
  platformTemplateVersions: () => [...emailKeys.all, "platform-template-versions"] as const,
  platformAgentFeedback: () => [...emailKeys.all, "platform-agent-feedback"] as const,
  distributionFeedbackSubmissions: (page: number, limit: number, websiteId?: string) =>
    [...emailKeys.all, "distribution-feedback-submissions", page, limit, websiteId ?? "all"] as const,
  resellerTemplateVersions: (resellerId: string) =>
    [...emailKeys.all, "reseller-template-versions", resellerId] as const,
};
