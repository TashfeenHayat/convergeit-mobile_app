let retryHandler: (() => Promise<void>) | null = null;

export function registerSessionHydrationRetry(handler: (() => Promise<void>) | null): void {
  retryHandler = handler;
}

export async function retrySessionHydration(): Promise<void> {
  await retryHandler?.();
}
