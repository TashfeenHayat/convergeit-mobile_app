type Params = Record<string, unknown> | undefined;

export const hrmsPoolsKeys = {
  all: ["hrms", "pools"] as const,
  list: (params?: Params) => [...hrmsPoolsKeys.all, "list", params] as const,
  detail: (id: string) => [...hrmsPoolsKeys.all, "detail", id] as const,
};
