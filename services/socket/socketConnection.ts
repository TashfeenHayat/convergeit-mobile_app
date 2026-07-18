import type { Socket } from "socket.io-client";
import {
  acquireNamespaceSocket,
  destroySocketHubsForBase,
  resolveNamespaceSocket,
} from "./sharedSocketManager";
import type { SocketEndpoint, StableSocketOptions } from "./socketCommon";

export interface SocketConnectionConfig {
  authToken?: string;
  forceNew?: boolean;
  options?: StableSocketOptions;
}

type SocketListener = (...args: unknown[]) => void;

export class SocketConnection {
  private socket: Socket | null = null;
  private readonly endpoint: SocketEndpoint;
  private readonly options?: StableSocketOptions;
  private authToken?: string;
  /** Survives socket recreation (`forceNew`) so chat hooks keep receiving events. */
  private readonly listeners = new Map<string, Set<SocketListener>>();

  constructor(endpoint: SocketEndpoint, options?: StableSocketOptions) {
    this.endpoint = endpoint;
    this.options = options;
  }

  private attachStoredListeners(target: Socket): void {
    for (const [event, set] of this.listeners) {
      for (const listener of set) {
        target.off(event, listener);
        target.on(event, listener);
      }
    }
  }

  /** Re-bind to the live multiplexed namespace socket after hub reuse. */
  private syncLiveSocket(): Socket | null {
    const token = this.authToken ?? "";
    if (!token) return this.socket;
    const live =
      resolveNamespaceSocket({
        baseUrl: this.endpoint.baseUrl,
        namespace: this.endpoint.namespace,
        authToken: token,
      }) ?? this.socket;
    if (live && live !== this.socket) {
      this.socket = live;
      this.attachStoredListeners(live);
    }
    return this.socket;
  }

  connect(config?: SocketConnectionConfig): Socket {
    if (config?.authToken !== undefined) {
      this.authToken = config.authToken;
    }

    const token = this.authToken ?? "";
    const shouldRecreate = Boolean(config?.forceNew);
    this.syncLiveSocket();
    if (this.socket?.connected && !shouldRecreate) {
      return this.socket;
    }

    if (!token) {
      if (this.socket) return this.socket;
      throw new Error("Socket auth token is required.");
    }

    this.socket = acquireNamespaceSocket({
      baseUrl: this.endpoint.baseUrl,
      namespace: this.endpoint.namespace,
      authToken: token,
      forceNew: shouldRecreate,
      options: {
        ...(this.options ?? {}),
        ...(config?.options ?? {}),
      },
    });
    this.attachStoredListeners(this.socket);
    this.socket.off("connected", this.handleServerReady);
    this.socket.on("connected", this.handleServerReady);

    return this.socket;
  }

  async waitUntilConnected(timeoutMs = 12_000): Promise<Socket> {
    const socket = this.connect();
    if (socket.connected) return socket;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("Socket connect timeout"));
      }, timeoutMs);

      const onConnect = () => {
        cleanup();
        resolve(socket);
      };
      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };

      const cleanup = () => {
        clearTimeout(timer);
        socket.off("connect", onConnect);
        socket.off("connect_error", onError);
      };

      socket.once("connect", onConnect);
      socket.once("connect_error", onError);
    });
  }

  /**
   * Transport connected and server emitted handshake `connected` (JWT accepted).
   */
  async waitUntilSocketReady(
    timeoutMs = 12_000,
    serverReadyEvent = "connected",
  ): Promise<Socket> {
    const socket = await this.waitUntilConnected(timeoutMs);
    if (this.serverReadyReceived) return socket;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("Socket server ready timeout"));
      }, timeoutMs);

      const onReady = () => {
        this.serverReadyReceived = true;
        cleanup();
        resolve(socket);
      };
      const onDisconnect = () => {
        cleanup();
        reject(new Error("Socket disconnected before server ready"));
      };

      const cleanup = () => {
        clearTimeout(timer);
        socket.off(serverReadyEvent, onReady);
        socket.off("disconnect", onDisconnect);
      };

      socket.once(serverReadyEvent, onReady);
      socket.once("disconnect", onDisconnect);
    });
  }

  private serverReadyReceived = false;

  private handleServerReady = (): void => {
    this.serverReadyReceived = true;
  };

  /**
   * Detach listeners only — keeps the shared transport alive for other namespaces.
   * Pass `hard=true` on logout to tear down every namespace on this API host.
   */
  disconnect(clearListeners = true, hard = false): void {
    if (hard && this.authToken) {
      destroySocketHubsForBase(this.endpoint.baseUrl);
    }
    this.serverReadyReceived = false;
    this.socket = null;
    if (clearListeners) {
      this.listeners.clear();
    }
  }

  getSocket(): Socket | null {
    return this.syncLiveSocket();
  }

  isConnected(): boolean {
    const socket = this.syncLiveSocket();
    return Boolean(socket?.connected);
  }

  emit<TPayload>(event: string, payload: TPayload): void {
    this.syncLiveSocket()?.emit(event, payload);
  }

  /** Socket.IO ack callback — used for chat send (visitor_message / agent_message). */
  once<TPayload>(event: string, listener: (payload: TPayload) => void): () => void {
    const socket = this.syncLiveSocket();
    if (!socket) return () => {};
    const wrapped = listener as SocketListener;
    socket.once(event, wrapped);
    return () => socket.off(event, wrapped);
  }

  emitWithAck<TPayload, TResponse = unknown>(
    event: string,
    payload: TPayload,
    timeoutMs = 30_000,
  ): Promise<TResponse> {
    const socket = this.syncLiveSocket();
    if (!socket?.connected) {
      return Promise.reject(new Error("Socket is not connected."));
    }
    return new Promise((resolve, reject) => {
      socket.timeout(timeoutMs).emit(event, payload, (err: Error | null, response: TResponse) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(response);
      });
    });
  }

  on<TPayload>(event: string, listener: (payload: TPayload) => void): () => void {
    const wrapped = listener as SocketListener;
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(wrapped);
    this.syncLiveSocket()?.on(event, wrapped);
    return () => {
      this.listeners.get(event)?.delete(wrapped);
      this.socket?.off(event, wrapped);
    };
  }
}
