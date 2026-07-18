type Params = Record<string, unknown> | undefined;

export const hrmsPoolHeadsKeys = {
  all: ["hrms", "pool-heads"] as const,
  list: (params?: Params) => [...hrmsPoolHeadsKeys.all, "list", params] as const,
  attendance: (params?: Params) => [...hrmsPoolHeadsKeys.all, "attendance", params] as const,
};
