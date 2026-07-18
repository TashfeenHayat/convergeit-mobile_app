import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { AuthTokenPair } from '@/api/types/auth.types';

/** Same logical keys as web cookie names — SecureStore on native, memory fallback on web. */
export const AUTH_STORAGE_ACCESS = 'converge_access_token';
export const AUTH_STORAGE_REFRESH = 'converge_refresh_token';

const memory = new Map<string, string>();

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    memory.set(key, value);
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(key) ?? memory.get(key) ?? null;
    } catch {
      return memory.get(key) ?? null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    memory.delete(key);
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

/** In-memory cache so axios interceptors stay sync-friendly after hydrate. */
let accessCache: string | null = null;
let refreshCache: string | null = null;

export function getAccessToken(): string | null {
  return accessCache;
}

export function getRefreshToken(): string | null {
  return refreshCache;
}

export function getTokenPair(): AuthTokenPair | null {
  if (!accessCache || !refreshCache) return null;
  return { accessToken: accessCache, refreshToken: refreshCache };
}

export async function hydrateTokenCache(): Promise<AuthTokenPair | null> {
  const [access, refresh] = await Promise.all([
    getItem(AUTH_STORAGE_ACCESS),
    getItem(AUTH_STORAGE_REFRESH),
  ]);
  accessCache = access?.trim() || null;
  refreshCache = refresh?.trim() || null;
  if (!accessCache || !refreshCache) return null;
  return { accessToken: accessCache, refreshToken: refreshCache };
}

export async function setTokenPair(pair: AuthTokenPair): Promise<void> {
  accessCache = pair.accessToken.trim();
  refreshCache = pair.refreshToken.trim();
  await Promise.all([
    setItem(AUTH_STORAGE_ACCESS, accessCache),
    setItem(AUTH_STORAGE_REFRESH, refreshCache),
  ]);
}

export async function clearTokens(): Promise<void> {
  accessCache = null;
  refreshCache = null;
  await Promise.all([
    deleteItem(AUTH_STORAGE_ACCESS),
    deleteItem(AUTH_STORAGE_REFRESH),
  ]);
}
