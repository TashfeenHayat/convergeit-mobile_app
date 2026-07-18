import type { ManagerOptions, SocketOptions } from "socket.io-client";

export type StableSocketOptions = Partial<ManagerOptions & SocketOptions>;

export interface SocketEndpoint {
  baseUrl: string;
  namespace: string;
}

export function normalizeSocketNamespace(namespace: string): string {
  if (!namespace) return "/";
  return namespace.startsWith("/") ? namespace : `/${namespace}`;
}

export function resolveSocketEndpoint(params: {
  envBaseUrl?: string;
  envFallbackBaseUrl?: string;
  envNamespace?: string;
  defaultNamespace: string;
}): SocketEndpoint {
  let rawBase = params.envBaseUrl || params.envFallbackBaseUrl || "";

  // Local dev: REST and Socket.IO must share the same API host or room events never arrive.
  if (
    process.env.NODE_ENV === "development" &&
    params.envBaseUrl?.trim() &&
    params.envFallbackBaseUrl?.trim()
  ) {
    try {
      const socketHost = new URL(params.envBaseUrl.trim()).hostname;
      const apiHost = new URL(params.envFallbackBaseUrl.trim()).hostname;
      if (socketHost !== apiHost) {
        rawBase = params.envFallbackBaseUrl;
        if (typeof console !== "undefined") {
          console.warn(
            `[socket] Ignoring EXPO_PUBLIC_*_SOCKET_BASE_URL (${params.envBaseUrl.trim()}) ` +
              `because it does not match EXPO_PUBLIC_API_BASE_URL (${params.envFallbackBaseUrl.trim()}). ` +
              "Using the API origin for Socket.IO so chat realtime matches REST.",
          );
        }
      }
    } catch {
      /* keep configured socket base */
    }
  }

  const baseUrl = rawBase.replace(/\/+$/, "");
  const namespace = normalizeSocketNamespace(
    params.envNamespace || params.defaultNamespace,
  );

  if (!baseUrl) {
    throw new Error(
      "Socket base URL is missing. Set EXPO_PUBLIC_CHAT_SOCKET_BASE_URL (or EXPO_PUBLIC_API_BASE_URL).",
    );
  }

  return { baseUrl, namespace };
}

export function buildSocketUrl(endpoint: SocketEndpoint): string {
  return `${endpoint.baseUrl}${endpoint.namespace}`;
}

export function getStableSocketDefaults(): StableSocketOptions {
  return {
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
    timeout: 20000,
  };
}
