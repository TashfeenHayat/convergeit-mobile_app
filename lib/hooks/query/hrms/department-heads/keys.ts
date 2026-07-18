type Params = Record<string, unknown> | undefined;

export const hrmsDepartmentHeadsKeys = {
  all: ["hrms", "department-heads"] as const,
  list: (params?: Params) => [...hrmsDepartmentHeadsKeys.all, "list", params] as const,
  attendance: (params?: Params) => [...hrmsDepartmentHeadsKeys.all, "attendance", params] as const,
};
