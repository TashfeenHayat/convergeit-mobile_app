type Params = Record<string, unknown> | undefined;

export const hrmsDesignationsKeys = {
  all: ["hrms", "designations"] as const,
  list: (params?: Params) => [...hrmsDesignationsKeys.all, "list", params] as const,
  detail: (id: string) => [...hrmsDesignationsKeys.all, "detail", id] as const,
};
