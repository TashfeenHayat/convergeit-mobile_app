type Params = Record<string, unknown> | undefined;

export const platformKeys = {
  all: ["platform"] as const,
  /** Prefix for all license-key list queries (any params / scope). */
  licenseKeysRoot: () => [...platformKeys.all, "license-keys"] as const,
  licenseKeys: (params?: Params) =>
    [...platformKeys.licenseKeysRoot(), params] as const,
};
