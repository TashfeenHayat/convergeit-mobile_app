type Params = Record<string, unknown> | undefined;

export const hrmsLeaveApplicationsKeys = {
  all: ["hrms", "leave-applications"] as const,
  me: (params?: Params) => [...hrmsLeaveApplicationsKeys.all, "me", params] as const,
  quotaSummary: (params?: Params) =>
    [...hrmsLeaveApplicationsKeys.all, "quota-summary", params] as const,
  pendingPoolQueue: (params?: Params) =>
    [...hrmsLeaveApplicationsKeys.all, "pending", "pool-queue", params] as const,
  pendingDepartmentQueue: (params?: Params) =>
    [
      ...hrmsLeaveApplicationsKeys.all,
      "pending",
      "department-queue",
      params,
    ] as const,
  pendingTenantQueue: (params?: Params) =>
    [...hrmsLeaveApplicationsKeys.all, "pending", "tenant-queue", params] as const,
  detail: (id: string) =>
    [...hrmsLeaveApplicationsKeys.all, "detail", id] as const,
};
