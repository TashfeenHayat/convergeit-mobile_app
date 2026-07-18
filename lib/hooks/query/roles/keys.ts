type Params = Record<string, unknown> | undefined;

export const rolesKeys = {
  all: ["roles"] as const,
  lists: () => [...rolesKeys.all, "list"] as const,
  list: (params?: Params) => [...rolesKeys.lists(), params] as const,
  detail: (id: string) => [...rolesKeys.all, "detail", id] as const,
  permissions: (id: string) => [...rolesKeys.all, "permissions", id] as const,
};
