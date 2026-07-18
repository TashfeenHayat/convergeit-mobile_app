type Listener = () => void;

const listeners = new Set<Listener>();

export const ACCESS_TOKEN_CHANGED_EVENT = 'converge:access-token-changed';

/**
 * Notify subscribers that the access token changed.
 * Uses an in-memory pub/sub — React Native has no reliable `window` EventTarget.
 */
export function notifyAccessTokenChanged(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Keep other listeners running if one throws.
    }
  });
}

export function subscribeAccessTokenChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
