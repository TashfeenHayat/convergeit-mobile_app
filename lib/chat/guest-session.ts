import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { ChatGuestLinkPermissions } from "@/services/chat/guest.types";

const STORAGE_KEY = "converge_chat_guest_session_v1";

export type StoredGuestSession = {
  accessToken: string;
  expiresAt: string;
  conversationId: string;
  websiteId: string;
  departmentId: string;
  departmentName?: string;
  websiteLabel?: string;
  permissions: ChatGuestLinkPermissions;
  urlStrictSingleOpen?: boolean;
  involvementUserId?: string | null;
};

function isExpired(iso: string): boolean {
  const t = Date.parse(iso);
  return Number.isNaN(t) || t <= Date.now();
}

/** In-memory cache so the hook's synchronous `loadGuestSession()` call works
 * like the web version's `localStorage` read; hydrated once at bootstrap. */
let cache: StoredGuestSession | null = null;
let hydrated = false;

async function readPersisted(): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(STORAGE_KEY);
}

async function writePersisted(value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.setItemAsync(STORAGE_KEY, value);
}

async function deletePersisted(): Promise<void> {
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}

/** Call once before reading the session (e.g. at the top of the guest screen). */
export async function hydrateGuestSession(): Promise<StoredGuestSession | null> {
  try {
    const raw = await readPersisted();
    if (!raw) {
      cache = null;
    } else {
      const parsed = JSON.parse(raw) as StoredGuestSession;
      cache =
        parsed?.accessToken && parsed.conversationId && !isExpired(parsed.expiresAt)
          ? parsed
          : null;
      if (!cache) await deletePersisted();
    }
  } catch {
    cache = null;
  }
  hydrated = true;
  return cache;
}

export function isGuestSessionHydrated(): boolean {
  return hydrated;
}

export function loadGuestSession(): StoredGuestSession | null {
  return cache;
}

export function saveGuestSession(session: StoredGuestSession): void {
  cache = session;
  void writePersisted(JSON.stringify(session));
}

export function clearGuestSession(): void {
  cache = null;
  void deletePersisted();
}

export function guestSessionFromExchange(
  data: import("@/services/chat/guest.types").GuestSessionExchangeResponse,
): StoredGuestSession {
  return {
    accessToken: data.accessToken,
    expiresAt: data.expiresAt,
    conversationId: data.conversationId,
    websiteId: data.websiteId,
    departmentId: data.departmentId,
    departmentName: data.departmentName,
    websiteLabel: data.websiteLabel,
    permissions: data.permissions,
    urlStrictSingleOpen: data.urlStrictSingleOpen,
    involvementUserId: data.involvementUserId ?? null,
  };
}
