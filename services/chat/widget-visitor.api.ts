import { getResolvedPublicApiBaseUrl } from "@/lib/public-api/resolved-base-url";
import { WIDGET_FETCH_CREDENTIALS } from "@/lib/widget-runtime/widget-fetch-credentials";
import { ensureWidgetTrackSocket } from "./sharedWidgetTrackSocket";
import type {
  VisitorCreateConversationPayload,
  VisitorCreateConversationResponse,
  VisitorSendMessagePayload,
} from "./chat.types";

export type WidgetTranscriptSocketClient = {
  isConnected(): boolean;
  waitUntilSocketReady(timeoutMs?: number): Promise<boolean>;
  fetchTranscriptWithAck(
    payload: { conversationId: string; websiteId: string },
    timeoutMs?: number,
  ): Promise<unknown>;
  requestTalkToAgentWithAck(
    payload: { conversationId: string; websiteId: string },
    timeoutMs?: number,
  ): Promise<unknown>;
  updateVisitorWithAck?(
    payload: {
      conversationId: string;
      websiteId: string;
      name?: string;
      email?: string;
      phone?: string;
      sessionId?: string;
    },
    timeoutMs?: number,
  ): Promise<unknown>;
  connect(options?: { authToken?: string; forceNew?: boolean }): unknown;
};

function peelSuccessEnvelope(raw: unknown, maxDepth = 4): unknown {
  let cur: unknown = raw;
  for (let d = 0; d < maxDepth; d++) {
    if (cur === null || typeof cur !== "object" || Array.isArray(cur)) break;
    const o = cur as Record<string, unknown>;
    if (
      (o.success === true || o.success === "true") &&
      "data" in o &&
      o.data !== null &&
      typeof o.data === "object"
    ) {
      cur = o.data;
      continue;
    }
    break;
  }
  return cur;
}

async function widgetVisitorFetchJson<T>(
  path: string,
  init: RequestInit,
  widgetBearerToken?: string,
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  const base = getResolvedPublicApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const res = await fetch(url, {
      ...init,
      credentials: WIDGET_FETCH_CREDENTIALS,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
        ...(widgetBearerToken
          ? { Authorization: `Bearer ${widgetBearerToken}` }
          : {}),
      },
    });

    if (!res.ok) {
      let message = `${res.status} ${res.statusText}`;
      try {
        const maybe = await res.json();
        if (maybe?.message && typeof maybe.message === "string") {
          message = maybe.message;
        }
      } catch {
        /* ignore */
      }
      return { ok: false, message };
    }

    return { ok: true, data: peelSuccessEnvelope(await res.json()) as T };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Network error",
    };
  }
}

/**
 * Public widget chat REST — never uses dashboard `apiClient` (same-origin iframe shares cookies).
 */
export type WidgetAnalyticsEventType =
  | "page_view"
  | "widget_open"
  | "chat_started"
  | "lead_captured";

export type TrackWidgetAnalyticsPayload = {
  websiteId: string;
  eventType: WidgetAnalyticsEventType;
  sessionId?: string;
  pageUrl?: string;
  referrerUrl?: string;
  timezone?: string;
  locale?: string;
  screenResolution?: string;
  locationCity?: string;
  locationCountry?: string;
  locationRegion?: string;
  locationZipcode?: string;
  consentGiven?: boolean;
  name?: string;
  email?: string;
  phone?: string;
};

export async function trackWidgetAnalytics(
  payload: TrackWidgetAnalyticsPayload,
  widgetBearerToken?: string,
): Promise<void> {
  const token = widgetBearerToken?.trim();
  if (token) {
    const socket = await ensureWidgetTrackSocket(token);
    if (socket) {
      try {
        await socket.trackEventWithAck(payload as Record<string, unknown>, 12_000);
        return;
      } catch {
        /* REST fallback below */
      }
    }
  }

  await widgetVisitorFetchJson<unknown>(
    "/widget/analytics/track",
    { method: "POST", body: JSON.stringify(payload) },
    widgetBearerToken,
  );
}

export async function createWidgetConversation(
  payload: VisitorCreateConversationPayload,
  widgetBearerToken?: string,
): Promise<VisitorCreateConversationResponse> {
  const result = await widgetVisitorFetchJson<VisitorCreateConversationResponse>(
    "/chat/widget/conversations",
    { method: "POST", body: JSON.stringify(payload) },
    widgetBearerToken,
  );
  if (!result.ok) {
    throw new Error(result.message);
  }
  return result.data;
}

export async function sendWidgetVisitorMessage(
  conversationId: string,
  payload: VisitorSendMessagePayload,
  widgetBearerToken?: string,
  websiteId?: string,
): Promise<unknown> {
  const websiteQuery =
    websiteId?.trim() ?
      `?websiteId=${encodeURIComponent(websiteId.trim())}`
    : "";
  const result = await widgetVisitorFetchJson<unknown>(
    `/chat/widget/conversations/${encodeURIComponent(conversationId)}/messages${websiteQuery}`,
    { method: "POST", body: JSON.stringify(payload) },
    widgetBearerToken,
  );
  if (!result.ok) {
    throw new Error(result.message);
  }
  return result.data;
}

export type WidgetTranscriptMessage = {
  id: string;
  senderType: string;
  content: string;
  messageType?: string;
  attachmentMetadata?: Record<string, unknown>;
  createdAt: string;
};

export type WidgetTranscriptResult = {
  id: string;
  status: string;
  chatCompleted: boolean;
  canSendMessages: boolean;
  talkToAgentRequested?: boolean;
  /** @deprecated Use {@link talkToAgentRequested}. */
  handoverRequested?: boolean;
  queuedForAgent?: boolean;
  assignedAgentId?: string | null;
  visitor?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  messages: WidgetTranscriptMessage[];
};

function parseWidgetTranscriptPayload(
  raw: unknown,
  conversationId: string,
): WidgetTranscriptResult | null {
  const peeled = peelSuccessEnvelope(raw);
  const o =
    peeled !== null && typeof peeled === "object" && !Array.isArray(peeled)
      ? (peeled as Record<string, unknown>)
      : null;
  if (!o) return null;

  const messagesRaw = Array.isArray(o.messages) ? o.messages : [];
  const messages: WidgetTranscriptMessage[] = [];
  for (const row of messagesRaw) {
    if (!row || typeof row !== "object") continue;
    const m = row as Record<string, unknown>;
    const id = typeof m.id === "string" ? m.id : "";
    const content =
      typeof m.content === "string"
        ? m.content
        : typeof m.message === "string"
          ? m.message
          : "";
    const senderType = typeof m.senderType === "string" ? m.senderType : "visitor";
    const createdAt =
      typeof m.createdAt === "string" ? m.createdAt : new Date().toISOString();
    if (!id || !content.trim()) continue;
    const attachmentMetadata =
      m.attachmentMetadata &&
      typeof m.attachmentMetadata === "object" &&
      !Array.isArray(m.attachmentMetadata)
        ? (m.attachmentMetadata as Record<string, unknown>)
        : undefined;
    messages.push({
      id,
      content,
      senderType,
      messageType: typeof m.messageType === "string" ? m.messageType : undefined,
      ...(attachmentMetadata ? { attachmentMetadata } : {}),
      createdAt,
    });
  }

  const visitor =
    o.visitor !== null && typeof o.visitor === "object" && !Array.isArray(o.visitor)
      ? (o.visitor as WidgetTranscriptResult["visitor"])
      : null;

  return {
    id: typeof o.id === "string" ? o.id : conversationId,
    status: typeof o.status === "string" ? o.status : "active",
    chatCompleted: o.chatCompleted === true,
    canSendMessages: o.canSendMessages !== false,
    talkToAgentRequested:
      o.talkToAgentRequested === true || o.handoverRequested === true,
    handoverRequested:
      o.talkToAgentRequested === true || o.handoverRequested === true,
    queuedForAgent: o.queuedForAgent === true,
    assignedAgentId:
      typeof o.assignedAgentId === "string"
        ? o.assignedAgentId
        : typeof o.agentId === "string"
          ? o.agentId
          : null,
    visitor,
    messages,
  };
}

async function fetchWidgetTranscriptRest(
  conversationId: string,
  websiteId: string,
  widgetBearerToken?: string,
): Promise<
  { ok: true; data: WidgetTranscriptResult } | { ok: false; message: string }
> {
  const base = getResolvedPublicApiBaseUrl();
  const url =
    `${base}/chat/widget/conversations/${encodeURIComponent(conversationId)}` +
    `/transcript?websiteId=${encodeURIComponent(websiteId)}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      credentials: WIDGET_FETCH_CREDENTIALS,
      headers: {
        Accept: "application/json",
        ...(widgetBearerToken
          ? { Authorization: `Bearer ${widgetBearerToken}` }
          : {}),
      },
    });

    if (!res.ok) {
      let message = `${res.status} ${res.statusText}`;
      try {
        const maybe = await res.json();
        if (maybe?.message && typeof maybe.message === "string") {
          message = maybe.message;
        }
      } catch {
        /* ignore */
      }
      return { ok: false, message };
    }

    const parsed = parseWidgetTranscriptPayload(await res.json(), conversationId);
    if (!parsed) {
      return { ok: false, message: "Invalid transcript response" };
    }
    return { ok: true, data: parsed };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Network error",
    };
  }
}

export async function fetchWidgetTranscript(
  conversationId: string,
  websiteId: string,
  widgetBearerToken?: string,
  socketClient?: WidgetTranscriptSocketClient,
): Promise<
  { ok: true; data: WidgetTranscriptResult } | { ok: false; message: string }
> {
  if (socketClient && widgetBearerToken) {
    socketClient.connect({ authToken: widgetBearerToken });
    const ready = await socketClient.waitUntilSocketReady(12_000);
    if (ready && socketClient.isConnected()) {
      try {
        const ack = await socketClient.fetchTranscriptWithAck(
          { conversationId, websiteId },
          15_000,
        );
        const parsed = parseWidgetTranscriptPayload(ack, conversationId);
        if (parsed) {
          return { ok: true, data: parsed };
        }
      } catch {
        /* REST fallback below */
      }
    }
  }

  return fetchWidgetTranscriptRest(conversationId, websiteId, widgetBearerToken);
}

export type WidgetTalkToAgentResult = {
  message: string;
  assignedAgentId: string | null;
  queuedForAgent: boolean;
  talkToAgentRequested?: boolean;
  talkToAgentPending?: boolean;
  /** @deprecated Legacy keys — mirrored from Talk to agent fields. */
  handoverRequested?: boolean;
  handoverPending?: boolean;
};

/** @deprecated Use {@link WidgetTalkToAgentResult}. */
export type WidgetRequestHumanResult = WidgetTalkToAgentResult;

function parseWidgetTalkToAgentPayload(raw: unknown): WidgetTalkToAgentResult | null {
  const peeled = peelSuccessEnvelope(raw);
  const o =
    peeled !== null && typeof peeled === "object" && !Array.isArray(peeled)
      ? (peeled as Record<string, unknown>)
      : null;
  if (!o) return null;

  return {
    message:
      typeof o.message === "string"
        ? o.message
        : "Your request has been sent to our team.",
    assignedAgentId:
      typeof o.assignedAgentId === "string" ? o.assignedAgentId : null,
    queuedForAgent: o.queuedForAgent === true,
    talkToAgentRequested:
      o.talkToAgentRequested === true || o.handoverRequested === true,
    talkToAgentPending:
      o.talkToAgentPending === true ||
      o.handoverPending === true ||
      ("handoverPending" in o && o.handoverPending === true),
    handoverRequested:
      o.talkToAgentRequested === true || o.handoverRequested === true,
    handoverPending:
      o.talkToAgentPending === true ||
      o.handoverPending === true ||
      ("handoverPending" in o && o.handoverPending === true),
  };
}

const TALK_TO_AGENT_SOCKET_READY_MS = 2_500;
const TALK_TO_AGENT_SOCKET_ACK_MS = 10_000;

async function requestTalkToAgentViaSocket(
  conversationId: string,
  websiteId: string,
  widgetBearerToken: string,
  socketClient?: WidgetTranscriptSocketClient,
): Promise<WidgetTalkToAgentResult | null> {
  const trySocket = async (socket: WidgetTranscriptSocketClient): Promise<WidgetTalkToAgentResult | null> => {
    socket.connect({ authToken: widgetBearerToken });
    const ready = await socket.waitUntilSocketReady(TALK_TO_AGENT_SOCKET_READY_MS);
    if (!ready || !socket.isConnected()) return null;
    try {
      const ack = await socket.requestTalkToAgentWithAck(
        { conversationId, websiteId },
        TALK_TO_AGENT_SOCKET_ACK_MS,
      );
      return parseWidgetTalkToAgentPayload(ack);
    } catch {
      return null;
    }
  };

  if (socketClient) {
    const parsed = await trySocket(socketClient);
    if (parsed) return parsed;
  }

  const shared = await ensureWidgetTrackSocket(widgetBearerToken);
  if (!shared) return null;
  return trySocket(shared);
}

async function postWidgetTalkToAgentViaRest(
  conversationId: string,
  websiteId: string,
  widgetBearerToken?: string,
): Promise<
  { ok: true; data: WidgetTalkToAgentResult } | { ok: false; message: string }
> {
  const base = getResolvedPublicApiBaseUrl();
  const url =
    `${base}/chat/widget/conversations/${encodeURIComponent(conversationId)}` +
    `/request-talk-to-agent?websiteId=${encodeURIComponent(websiteId)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: WIDGET_FETCH_CREDENTIALS,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(widgetBearerToken
          ? { Authorization: `Bearer ${widgetBearerToken}` }
          : {}),
      },
      body: "{}",
    });

    if (!res.ok) {
      let message = `${res.status} ${res.statusText}`;
      try {
        const maybe = await res.json();
        if (maybe?.message && typeof maybe.message === "string") {
          message = maybe.message;
        }
      } catch {
        /* ignore */
      }
      return { ok: false, message };
    }

    const parsed = parseWidgetTalkToAgentPayload(await res.json());
    if (!parsed) {
      return { ok: false, message: "Invalid talk-to-agent response" };
    }
    return { ok: true, data: parsed };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Network error",
    };
  }
}

export async function postWidgetTalkToAgent(
  conversationId: string,
  websiteId: string,
  widgetBearerToken?: string,
  socketClient?: WidgetTranscriptSocketClient,
): Promise<
  { ok: true; data: WidgetTalkToAgentResult } | { ok: false; message: string }
> {
  const token = widgetBearerToken?.trim();
  const rest = await postWidgetTalkToAgentViaRest(
    conversationId,
    websiteId,
    token,
  );
  if (rest.ok) {
    return rest;
  }

  if (token) {
    const socketData = await requestTalkToAgentViaSocket(
      conversationId,
      websiteId,
      token,
      socketClient,
    );
    if (socketData) {
      return { ok: true, data: socketData };
    }
  }

  return rest;
}

export type WidgetVisitorAvailability = {
  chatMode: string;
  behavior: "open" | "queue" | "offline";
  agentsAvailable: boolean;
  shouldShowOfflineForm: boolean;
};

export async function fetchWidgetVisitorAvailability(
  websiteId: string,
  widgetKey: string,
): Promise<WidgetVisitorAvailability | null> {
  const base = getResolvedPublicApiBaseUrl();
  const params = new URLSearchParams({ widgetKey });
  const url = `${base}/widget/websites/${encodeURIComponent(websiteId)}/visitor-availability?${params}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      credentials: WIDGET_FETCH_CREDENTIALS,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const raw = await res.json();
    const data = peelSuccessEnvelope(raw) as WidgetVisitorAvailability | null;
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

/** @deprecated Use {@link postWidgetTalkToAgent}. */
export const postWidgetRequestHuman = postWidgetTalkToAgent;
