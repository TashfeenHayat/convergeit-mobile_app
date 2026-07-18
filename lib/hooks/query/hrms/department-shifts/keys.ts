type Params = Record<string, unknown> | undefined;

export const hrmsDepartmentShiftsKeys = {
  all: ["hrms", "department-shifts"] as const,
  list: (params?: Params) =>
    [...hrmsDepartmentShiftsKeys.all, "list", params] as const,
};
