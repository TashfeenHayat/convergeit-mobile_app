export const platformThemeKeys = {
  all: ["platform-theme"] as const,
  me: () => [...platformThemeKeys.all, "me"] as const,
};
