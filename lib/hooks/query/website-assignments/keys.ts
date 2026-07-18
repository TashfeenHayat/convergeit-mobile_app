type Params = Record<string, unknown> | undefined;

export const websiteAssignmentsKeys = {
  all: ["website-assignments"] as const,
  websites: (params?: Params) =>
    [...websiteAssignmentsKeys.all, "websites", params] as const,
  website: (websiteId: string) =>
    [...websiteAssignmentsKeys.all, "website", websiteId] as const,
  userWebsites: (userId: string, params?: Params) =>
    [...websiteAssignmentsKeys.all, "user-websites", userId, params] as const,
  rosterHrmsContext: (
    websiteId: string,
    departmentId: string,
    params: { channel: string; userIds?: string },
  ) =>
    [...websiteAssignmentsKeys.all, "roster-hrms", websiteId, departmentId, params] as const,
  rosterCoverage: (websiteId: string, departmentId: string, channel: string) =>
    [...websiteAssignmentsKeys.all, "roster-coverage", websiteId, departmentId, channel] as const,
};
