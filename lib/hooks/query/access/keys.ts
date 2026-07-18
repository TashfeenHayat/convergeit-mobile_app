type Params = Record<string, unknown> | undefined;

export const accessKeys = {
  all: ["access"] as const,
  meEffectivePermissions: () =>
    [...accessKeys.all, "me", "effective-permissions"] as const,
  permissionsCatalog: (params?: Params) =>
    [...accessKeys.all, "permissions", "catalog", params] as const,
  permissionApplicability: (permissionName: string) =>
    [...accessKeys.all, "permissions", permissionName, "applicability"] as const,
};
