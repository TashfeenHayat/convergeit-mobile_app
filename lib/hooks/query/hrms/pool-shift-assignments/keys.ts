type Params = Record<string, unknown> | undefined;

export const hrmsPoolShiftAssignmentsKeys = {
  all: ["hrms", "pool-shift-assignments"] as const,
  list: (params?: Params) =>
    [...hrmsPoolShiftAssignmentsKeys.all, "list", params] as const,
};
