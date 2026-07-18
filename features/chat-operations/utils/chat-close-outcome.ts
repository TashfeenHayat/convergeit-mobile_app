export const CHAT_CLOSE_OUTCOMES = {
  COMPLETED: "completed",
  SPAM: "spam",
  AUTO: "auto",
  SUPERVISOR: "supervisor",
} as const;

export const CLOSED_CHAT_BUCKETS = {
  PENDING: "pending",
  COMPLETED: "completed",
  SPAM: "spam",
} as const;

export type ClosedChatBucket = (typeof CLOSED_CHAT_BUCKETS)[keyof typeof CLOSED_CHAT_BUCKETS];

export const SPAM_CATEGORIES = [
  { value: "promotional", label: "Promotional / marketing" },
  { value: "bot", label: "Bot / automated" },
  { value: "abusive", label: "Abusive / harassment" },
  { value: "wrong_number", label: "Wrong person / wrong site" },
  { value: "no_intent", label: "No real inquiry" },
  { value: "duplicate", label: "Duplicate / repeat spam" },
  { value: "other", label: "Other" },
] as const;

export type SpamCategoryValue = (typeof SPAM_CATEGORIES)[number]["value"];

export function isSpamCloseOutcome(closeOutcome: string | null | undefined): boolean {
  return closeOutcome === CHAT_CLOSE_OUTCOMES.SPAM;
}

export function isMeaningfulClosedChat(row: {
  isMeaningfulChat?: boolean;
  distributionSubmitted?: boolean;
  [key: string]: unknown;
}): boolean {
  return Boolean(row.isMeaningfulChat || row.distributionSubmitted);
}

export function resolveClosedChatBucket(row: {
  closeBucket?: string | null;
  closeOutcome?: string | null;
  requiresDistributionForm?: boolean;
  requiresDistributionSetup?: boolean;
  distributionSubmitted?: boolean;
  isMeaningfulChat?: boolean;
  agentInvolved?: boolean;
  [key: string]: unknown;
}): ClosedChatBucket {
  if (isSpamCloseOutcome(row.closeOutcome)) {
    return CLOSED_CHAT_BUCKETS.SPAM;
  }
  if (isMeaningfulClosedChat(row)) {
    return CLOSED_CHAT_BUCKETS.COMPLETED;
  }
  if (
    row.agentInvolved ||
    (row.requiresDistributionForm && !row.distributionSubmitted) ||
    row.requiresDistributionSetup
  ) {
    return CLOSED_CHAT_BUCKETS.PENDING;
  }
  if (row.closeBucket === CLOSED_CHAT_BUCKETS.SPAM) {
    return CLOSED_CHAT_BUCKETS.SPAM;
  }
  if (row.closeBucket === CLOSED_CHAT_BUCKETS.PENDING) {
    return CLOSED_CHAT_BUCKETS.PENDING;
  }
  return CLOSED_CHAT_BUCKETS.COMPLETED;
}

export function spamCategoryLabel(value: string | null | undefined): string {
  const hit = SPAM_CATEGORIES.find((c) => c.value === value);
  return hit?.label ?? value?.trim() ?? "Spam";
}

export function conversationCloseFields(row: {
  closeBucket?: string | null;
  closeOutcome?: string | null;
  requiresDistributionForm?: boolean;
  requiresDistributionSetup?: boolean;
  distributionSubmitted?: boolean;
  isMeaningfulChat?: boolean;
  agentInvolved?: boolean;
  [key: string]: unknown;
}) {
  return {
    closeBucket: typeof row.closeBucket === "string" ? row.closeBucket : null,
    closeOutcome: typeof row.closeOutcome === "string" ? row.closeOutcome : null,
    requiresDistributionForm: Boolean(row.requiresDistributionForm),
    requiresDistributionSetup: Boolean(row.requiresDistributionSetup),
    distributionSubmitted: Boolean(row.distributionSubmitted),
    isMeaningfulChat: Boolean(row.isMeaningfulChat),
    agentInvolved: Boolean(row.agentInvolved),
  };
}

/** Inbox queue row / chip — form pending vs meaningful (form sent). */
export function resolveQueueFormStatusLabel(row: {
  closeBucket?: string | null;
  closeOutcome?: string | null;
  requiresDistributionForm?: boolean;
  requiresDistributionSetup?: boolean;
  distributionSubmitted?: boolean;
  isMeaningfulChat?: boolean;
  agentInvolved?: boolean;
  [key: string]: unknown;
}): string | null {
  const fields = conversationCloseFields(row);
  const bucket = resolveClosedChatBucket(fields);
  if (bucket === CLOSED_CHAT_BUCKETS.PENDING) return "Form pending";
  if (bucket === CLOSED_CHAT_BUCKETS.COMPLETED) {
    return isMeaningfulClosedChat(fields) ? "Meaningful chat" : "Closed";
  }
  return null;
}

export function resolveQueueFormActionHint(row: {
  closeBucket?: string | null;
  closeOutcome?: string | null;
  requiresDistributionForm?: boolean;
  requiresDistributionSetup?: boolean;
  distributionSubmitted?: boolean;
  isMeaningfulChat?: boolean;
  agentInvolved?: boolean;
  [key: string]: unknown;
}): string | null {
  const fields = conversationCloseFields(row);
  const bucket = resolveClosedChatBucket(fields);
  if (bucket === CLOSED_CHAT_BUCKETS.PENDING) {
    return "Open distribution form to finish";
  }
  if (bucket === CLOSED_CHAT_BUCKETS.COMPLETED && isMeaningfulClosedChat(fields)) {
    return "Distribution form sent";
  }
  return null;
}

export function buildDistributionFormHref(conversationId: string, path?: string | null): string {
  const trimmed = path?.trim();
  if (trimmed) return trimmed;
  return `/dashboard/chat-operations/distribution?conversationId=${encodeURIComponent(conversationId)}`;
}
