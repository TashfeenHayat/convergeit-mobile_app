import type { AppBoundaryKind, AppBoundaryPayload, AppBoundaryState } from "./types";

type Subscriber = (state: AppBoundaryState | null) => void;

let subscriber: Subscriber | null = null;
let current: AppBoundaryState | null = null;
let seq = 0;

function emit() {
  subscriber?.(current);
}

export function getAppBoundaryState(): AppBoundaryState | null {
  return current;
}

/**
 * Show a blocking SaaS-style boundary modal (session, network, permission, etc.).
 * Safe to call from axios interceptors and React Query global handlers.
 */
export function publishAppBoundary(payload: AppBoundaryPayload): void {
  const dedupe = payload.dedupeByKind !== false;
  if (dedupe && current?.kind === payload.kind) {
    current = {
      ...current,
      ...payload,
      requestId: current.requestId,
    };
    emit();
    return;
  }

  seq += 1;
  current = { ...payload, requestId: `boundary-${seq}` };
  emit();
}

export function dismissAppBoundary(kind?: AppBoundaryKind): void {
  if (kind && current?.kind !== kind) return;
  current = null;
  emit();
}

export function subscribeAppBoundary(cb: Subscriber): () => void {
  subscriber = cb;
  cb(current);
  return () => {
    subscriber = null;
  };
}
