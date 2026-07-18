export type AppToastVariant = "success" | "error";

export type AppToastPayload = {
  variant: AppToastVariant;
  message: string;
};

type Subscriber = (payload: AppToastPayload) => void;

let subscriber: Subscriber | null = null;
const pending: AppToastPayload[] = [];

function flushQueue(next: Subscriber) {
  while (pending.length > 0) {
    const item = pending.shift();
    if (item) next(item);
  }
}

/**
 * Imperative toast entry (e.g. client-side validation). Prefer backend-driven
 * messages via React Query global handlers when possible.
 */
export function publishAppToast(payload: AppToastPayload): void {
  const trimmed = payload.message.trim();
  if (!trimmed) return;
  const normalized: AppToastPayload = { ...payload, message: trimmed };
  if (subscriber) {
    subscriber(normalized);
  } else {
    pending.push(normalized);
  }
}

export function subscribeAppToasts(cb: Subscriber): () => void {
  subscriber = cb;
  flushQueue(cb);
  return () => {
    subscriber = null;
  };
}
