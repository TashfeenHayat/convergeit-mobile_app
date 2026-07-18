type Params = Record<string, unknown> | undefined;

export const hrmsShiftsKeys = {
  all: ["hrms", "shifts"] as const,
  list: (params?: Params) => [...hrmsShiftsKeys.all, "list", params] as const,
  detail: (id: string) => [...hrmsShiftsKeys.all, "detail", id] as const,
};
