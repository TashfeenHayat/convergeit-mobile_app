export const dashboardKeys = {
  root: ["dashboard"] as const,
  platformOverview: (query?: Record<string, unknown>) =>
    [...dashboardKeys.root, "platform-overview", query ?? {}] as const,
};
