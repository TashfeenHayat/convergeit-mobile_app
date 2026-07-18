/** Backend `ChatGuestLinkPermissions`. */
export type ChatGuestLinkPermissions = {
  viewTranscript: boolean;
  viewVisitorPii: boolean;
  whisper: boolean;
  directControl: boolean;
  takeoverRequest: boolean;
};

export type GuestSessionExchangeResponse = {
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

export type GuestTranscriptResponse = {
  conversationId: string;
  messages: import("./chat.types").ChatMessage[];
  visitor?: Record<string, unknown> | null;
  visitorPresentation?: import("./chat.types").AgentVisitorPresentation;
  readOnly?: boolean;
  status?: string;
  chatCompleted?: boolean;
  [key: string]: unknown;
};

export type GuestLinkRow = {
  id: string;
  departmentId: string;
  recipientEmail: string;
  expiresAt: string;
  firstOpenedAt: string | null;
  firstOpenedByEmail?: string | null;
  lastOpenedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  department?: { id: string; name: string };
};

export type SendDepartmentGuestLinkBody = {
  departmentId?: string;
  email?: string;
};

export type GuestLinkMatchedVia =
  | "explicit_override"
  | "inquiry_external_topic"
  | "conversation_department";

export type GuestLinkSendTarget = {
  departmentId: string;
  departmentName: string;
  topicLabel: string | null;
  routingKey: string | null;
  conversationDepartmentId: string | null;
  conversationDepartmentName: string | null;
  matchedVia: GuestLinkMatchedVia;
  supervisorCount: number;
  canSend: boolean;
  chatRoutedElsewhere?: boolean;
  hint?: string | null;
  recipients: {
    emails: string[];
    userIds: string[];
    source: "involvement" | "notify_emails";
  };
};

export type SendDepartmentGuestLinkResponse = {
  conversationId: string;
  departmentId: string;
  departmentName?: string;
  topicLabel?: string | null;
  matchedVia?: GuestLinkMatchedVia;
  supervisorCount?: number;
  sent?: Array<{
    linkId: string;
    recipientEmail: string;
    expiresAt: string;
  }>;
  recipients?: Array<{
    linkId: string;
    recipientEmail: string;
    expiresAt: string;
  }>;
  sharedLink?: boolean;
  linkExpiresHours?: number;
};
