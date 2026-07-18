type Params = Record<string, unknown> | undefined;

export const hrmsDepartmentsKeys = {
  all: ["hrms", "departments"] as const,
  list: (params?: Params) => [...hrmsDepartmentsKeys.all, "list", params] as const,
  detail: (id: string) => [...hrmsDepartmentsKeys.all, "detail", id] as const,
};
