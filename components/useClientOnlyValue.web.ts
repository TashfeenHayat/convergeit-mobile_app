import { useSyncExternalStore } from 'react';

// Avoid hydration mismatch: server snapshot vs client snapshot.
export function useClientOnlyValue<S, C>(server: S, client: C): S | C {
  return useSyncExternalStore<S | C>(
    () => () => {},
    () => client,
    () => server
  );
}
