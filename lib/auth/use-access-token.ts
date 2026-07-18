import { useCallback, useEffect, useState } from 'react';
import { getAccessToken } from '@/api';
import { subscribeAccessTokenChanged } from './access-token-events';

/**
 * Reactive access token for client components. Token writes do not trigger
 * re-renders unless listeners run (see `notifyAccessTokenChanged`).
 */
export function useAccessToken(): string | null {
  const read = useCallback(() => getAccessToken()?.trim() || null, []);
  const [token, setToken] = useState<string | null>(() => read());

  useEffect(() => {
    const sync = () => setToken(read());
    sync();
    return subscribeAccessTokenChanged(sync);
  }, [read]);

  return token;
}
