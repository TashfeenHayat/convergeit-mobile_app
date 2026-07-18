type Params = Record<string, unknown> | undefined;

export const hrmsDepartmentShiftAssignmentsKeys = {
  all: ["hrms", "department-shift-assignments"] as const,
  list: (params?: Params) =>
    [...hrmsDepartmentShiftAssignmentsKeys.all, "list", params] as const,
};
