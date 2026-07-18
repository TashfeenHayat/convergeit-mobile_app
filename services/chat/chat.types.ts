export type ChatParticipantRole = "visitor" | "agent" | "ai" | "system";

export type VisitorProfileField = "name" | "email" | "phone";

export type PatchAgentVisitorProfileBody = {
  field: VisitorProfileField;
  value: string;
  sourceMessageId?: string;
  sourceText?: string;
  confirmOverwrite?: boolean;
};

export type AgentVisitorProfileUpdateResult = {
  visitorId: string;
  conversationId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  visitorProfileComplete: boolean;
  visitorPresentation: AgentVisitorPresentation;
};

/** Backend `AgentVisitorPresentation` — lists, popups, monitor rows. */
export interface AgentVisitorPresentation {
  visitorProfileComplete: boolean;
  displayName: string;
  subtitle: string | null;
  originLabel: string;
  locationLabel: string | null;
  inboxTitle: string;
  websiteName: string;
  childCompanyName: string;
  websiteUrl: string;
  /** e.g. "Instagram · @handle" — social inbound only */
  channelLabel?: string | null;
  inboundChannel?: string | null;
}

/** Rich product/project card attached to AI messages. */
export interface VisitorAiRichCard {
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  price?: string;
  brand?: string;
}

/** Unified client chat message shape (REST + realtime). */
export interface ChatMessage {
  id?: string;
  conversationId: string;
  content: string;
  senderId?: string;
  senderName?: string;
  role: ChatParticipantRole;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

/** POST /chat/widget/conversations — request body */
export interface WidgetVisitorPayload {
  name?: string;
  email?: string;
  phone?: string;
  /** Client-side persisted visitor session identifier */
  sessionId: string;
}

export interface VisitorCreateConversationPayload {
  websiteId: string;
  visitor: WidgetVisitorPayload;
  firstMessage: string;
  currentPageUrl: string;
  referrerUrl?: string;
  clientLocationCity?: string;
  clientLocationCountry?: string;
  clientLocationRegion?: string;
  clientLocationZipcode?: string;
  clientTimezone?: string;
  clientLocale?: string;
  clientScreenResolution?: string;
  routingKey?: string;
  serviceChannel?: "Internal" | "External";
  inquiryDepartmentId?: string;
  inquiryPoolId?: string;
  inquiryLabel?: string;
  /** Skip server AI on pre-chat registration message; embed handles welcome locally. */
  deferInitialAiReply?: boolean;
  /** Dashboard sandbox preview — no analytics or lead counters. */
  sandbox?: boolean;
  /** @deprecated Use routingKey + inquiryDepartmentId from widget inquire config */
  topic?: string;
}

/** Message row nested in POST /chat/widget/conversations (visitor or AI). */
export interface WidgetConversationMessageDto {
  id?: string;
  conversationId?: string;
  content?: string;
  senderType?: string;
  messageType?: string;
  attachmentMetadata?: Record<string, unknown>;
  createdAt?: string;
}

/** POST /chat/widget/conversations — response */
export interface VisitorCreateConversationResponse {
  conversationId: string;
  visitorId: string;
  status: "assigned" | "waiting" | "active" | string;
  assignedAgentId: string | null;
  assignedRank: "Primary" | "Secondary" | "Backup" | null;
  /** Present when the server already generated an AI reply on create (HYBRID / AI_ONLY). */
  aiMessage?: WidgetConversationMessageDto | null;
  firstVisitorMessage?: WidgetConversationMessageDto | null;
  chatMode?: string;
  /** @deprecated Legacy key — prefer {@link talkToAgentRequested}. */
  handoverRequested?: boolean;
  talkToAgentRequested?: boolean;
  queuedForAgent?: boolean;
  /** True when an open chat for this visitor session was reused instead of creating a new row. */
  resumed?: boolean;
}

/** POST .../widget/conversations/:id/messages */
export interface VisitorSendMessagePayload {
  message: string;
  currentPageUrl: string;
  /** Optional server message discriminator (SendVisitorMessageDto). */
  messageType?: string;
}

/** POST .../agent/conversations/:id/messages */
export interface AgentSendMessagePayload {
  message: string;
  /** Optional server message discriminator (SendAgentMessageDto). */
  messageType?: string;
}

export interface ConversationSummary {
  /** Normalized id (always `conversationId` when present on API). */
  id: string;
  conversationId?: string;
  websiteId?: string;
  departmentId?: string | null;
  serviceChannel?: "Internal" | "External" | string | null;
  lastTransferFrom?: {
    userId: string;
    label: string;
    transferredAt?: string;
  } | null;
  status?: "assigned" | "waiting" | "active" | "closed" | string;
  visitorId?: string;
  assignedAgentId?: string | null;
  assignedRank?: string | null;
  lastMessageAt?: string;
  unreadCount?: number;
  visitor?: Record<string, unknown>;
  visitorPresentation?: AgentVisitorPresentation;
  [key: string]: unknown;
}

export interface ConversationHistoryResponse {
  conversationId: string;
  messages: ChatMessage[];
  visitor?: Record<string, unknown>;
  /** Allow rich history envelopes from backend */
  [key: string]: unknown;
}

/** POST /chat/agent/conversations/:id/close */
export interface ChatCloseResponse {
  conversationId: string;
  closedBy?: string;
  reassigned?: {
    conversationId: string;
    agentId: string;
    rank: string;
  } | null;
}

/** Socket: server → client typing */
export interface TypingPayload {
  conversationId: string;
  userType?: "agent" | "visitor" | string;
  /** Resolved role for live preview (supervisor takeover vs assigned agent). */
  typingRole?: "visitor" | "agent" | "supervisor" | string;
  userId?: string;
  /** Ephemeral live draft preview. Not persisted. */
  draft?: string;
}

/** Socket: client → server join/leave (backend contract: conversationId only). */
export interface JoinLeaveRoomPayload {
  conversationId: string;
}

/** Socket: client → server visitor_message */
export interface SocketVisitorMessagePayload {
  conversationId: string;
  message: string;
  currentPageUrl?: string;
  clientLocationCity?: string;
  clientLocationCountry?: string;
  clientLocationRegion?: string;
  clientLocationZipcode?: string;
}

/** Socket: client → server agent_message (server persists auth userId; agentId matches gateway convention). */
export interface SocketAgentMessagePayload {
  conversationId: string;
  message: string;
  agentId?: string;
}

/** Client → server typing / stop_typing (gateway accepts userType / userId; server may derive for visitors). */
export interface SocketTypingEmitPayload {
  conversationId: string;
  userType?: "agent" | "visitor" | string;
  userId?: string;
  draft?: string;
}
