type Params = Record<string, unknown> | undefined;

export const hrmsLeaveTypesKeys = {
  all: ["hrms", "leave-types"] as const,
  list: (params?: Params) => [...hrmsLeaveTypesKeys.all, "list", params] as const,
  forApply: (params?: Params) =>
    [...hrmsLeaveTypesKeys.all, "for-apply", params] as const,
  detail: (id: string) => [...hrmsLeaveTypesKeys.all, "detail", id] as const,
};
