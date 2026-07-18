export const authKeys = {
  all: ['auth'] as const,
  health: () => [...authKeys.all, 'health'] as const,
  me: (permissionsBreakdown?: boolean) =>
    [...authKeys.all, 'me', { permissionsBreakdown: !!permissionsBreakdown }] as const,
};
