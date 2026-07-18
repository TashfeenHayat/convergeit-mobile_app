import { Manager, type Socket } from "socket.io-client";
import {
  getStableSocketDefaults,
  normalizeSocketNamespace,
  type StableSocketOptions,
} from "./socketCommon";

type HubKey = string;

interface SocketHub {
  manager: Manager;
  authToken: string;
  namespaceSockets: Map<string, Socket>;
}

const hubs = new Map<HubKey, SocketHub>();

function hubKey(baseUrl: string, authToken: string): HubKey {
  return `${baseUrl}::${authToken}`;
}

function closeManager(manager: Manager): void {
  manager.removeAllListeners();
  const runtimeManager = manager as unknown as {
    disconnect?: () => void;
    _close?: () => void;
  };
  if (typeof runtimeManager.disconnect === "function") {
    runtimeManager.disconnect();
    return;
  }
  if (typeof runtimeManager._close === "function") {
    runtimeManager._close.call(manager);
  }
}

function destroyHub(key: HubKey): void {
  const hub = hubs.get(key);
  if (!hub) return;
  try {
    for (const socket of hub.namespaceSockets.values()) {
      socket.removeAllListeners();
      socket.disconnect();
    }
    hub.namespaceSockets.clear();
    closeManager(hub.manager);
  } catch {
    /* best-effort teardown */
  }
  hubs.delete(key);
}

function destroyStaleHubsForBase(baseUrl: string, authToken: string): void {
  for (const key of [...hubs.keys()]) {
    if (!key.startsWith(`${baseUrl}::`)) continue;
    const hub = hubs.get(key);
    if (hub && hub.authToken !== authToken) {
      destroyHub(key);
    }
  }
}

export type AcquireNamespaceSocketParams = {
  baseUrl: string;
  namespace: string;
  authToken: string;
  forceNew?: boolean;
  options?: StableSocketOptions;
};

/**
 * One Engine.IO transport per (API origin, auth token); namespaces multiplex on it.
 * Agent dashboard: `/chat` + `/notifications` → single websocket to the API host.
 */
/** Returns an existing namespace socket without creating a new Manager. */
export function resolveNamespaceSocket(params: {
  baseUrl: string;
  namespace: string;
  authToken: string;
}): Socket | null {
  const baseUrl = params.baseUrl.replace(/\/+$/, "");
  const key = hubKey(baseUrl, params.authToken);
  const hub = hubs.get(key);
  if (!hub) return null;
  const namespace = normalizeSocketNamespace(params.namespace);
  return hub.namespaceSockets.get(namespace) ?? null;
}

export function acquireNamespaceSocket(params: AcquireNamespaceSocketParams): Socket {
  const baseUrl = params.baseUrl.replace(/\/+$/, "");
  const authToken = params.authToken;
  const namespace = normalizeSocketNamespace(params.namespace);
  const key = hubKey(baseUrl, authToken);

  if (params.forceNew) {
    destroyHub(key);
    destroyStaleHubsForBase(baseUrl, authToken);
  }

  let hub = hubs.get(key);
  if (!hub) {
    const manager = new Manager(baseUrl, {
      ...getStableSocketDefaults(),
      ...(params.options ?? {}),
    });
    hub = { manager, authToken, namespaceSockets: new Map() };
    hubs.set(key, hub);
  }

  let socket = hub.namespaceSockets.get(namespace);
  if (!socket || params.forceNew) {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }
    socket = hub.manager.socket(namespace, {
      auth: { token: authToken },
    });
    hub.namespaceSockets.set(namespace, socket);
  }

  if (!socket.connected) {
    socket.auth = { token: authToken };
    socket.connect();
  }

  return socket;
}

export function destroySocketHubsForBase(baseUrl: string): void {
  const prefix = `${baseUrl.replace(/\/+$/, "")}::`;
  for (const key of [...hubs.keys()]) {
    if (key.startsWith(prefix)) {
      destroyHub(key);
    }
  }
}

export function resetSharedSocketManagersForTests(): void {
  for (const key of [...hubs.keys()]) {
    destroyHub(key);
  }
}
