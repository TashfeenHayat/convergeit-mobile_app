export const socialMediaKeys = {
  all: ["social-media"] as const,
  list: (params: Record<string, unknown>) =>
    [...socialMediaKeys.all, "list", params] as const,
};
