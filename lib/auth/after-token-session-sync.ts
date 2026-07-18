/**
 * Lets non-React code (e.g. React Query mutations) ask AuthProvider to pull
 * `/auth/me` + permissions after tokens change, without a full page reload.
 */
let syncHandler: (() => Promise<void>) | null = null;

export function registerAfterTokenSessionSync(handler: (() => Promise<void>) | null): void {
  syncHandler = handler;
}

export function requestAfterTokenSessionSync(): Promise<void> {
  return syncHandler?.() ?? Promise.resolve();
}
