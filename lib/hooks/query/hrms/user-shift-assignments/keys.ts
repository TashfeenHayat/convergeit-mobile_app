type Params = Record<string, unknown> | undefined;

export const hrmsUserShiftAssignmentsKeys = {
  all: ["hrms", "user-shift-assignments"] as const,
  list: (params?: Params) =>
    [...hrmsUserShiftAssignmentsKeys.all, "list", params] as const,
};
