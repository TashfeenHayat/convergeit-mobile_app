/**
 * Lets non-React code (auth, mutations) clear the app QueryClient without importing the provider.
 */
let clearHandler: (() => void) | null = null;

export function registerAppQueryCacheClear(handler: (() => void) | null): void {
  clearHandler = handler;
}

export function clearAppQueryCache(): void {
  clearHandler?.();
}
