import { Platform } from 'react-native';

/**
 * RN-safe web storage access.
 * On native, `window` often exists but `localStorage`/`sessionStorage` do not —
 * never use bare storage after only a `typeof window` check.
 */
function webStorage(kind: 'local' | 'session'): Storage | null {
  if (Platform.OS !== 'web') return null;
  try {
    const store = kind === 'local' ? globalThis.localStorage : globalThis.sessionStorage;
    if (!store || typeof store.getItem !== 'function') return null;
    return store;
  } catch {
    return null;
  }
}

export function safeLocalGet(key: string): string | null {
  return webStorage('local')?.getItem(key) ?? null;
}

export function safeLocalSet(key: string, value: string): void {
  webStorage('local')?.setItem(key, value);
}

export function safeLocalRemove(key: string): void {
  webStorage('local')?.removeItem(key);
}

export function safeSessionGet(key: string): string | null {
  return webStorage('session')?.getItem(key) ?? null;
}

export function safeSessionSet(key: string, value: string): void {
  webStorage('session')?.setItem(key, value);
}

export function safeSessionRemove(key: string): void {
  webStorage('session')?.removeItem(key);
}

export function isWebPlatform(): boolean {
  return Platform.OS === 'web';
}
