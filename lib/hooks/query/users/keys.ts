type Filters = Record<string, unknown> | undefined;

export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (filters?: Filters) => [...usersKeys.lists(), filters] as const,
  filterSuggestions: (params?: Filters) =>
    [...usersKeys.all, "filter-suggestions", params] as const,
  detail: (id: string) => [...usersKeys.all, "detail", id] as const,
  permissions: (id: string) => [...usersKeys.all, "permissions", id] as const,
};
