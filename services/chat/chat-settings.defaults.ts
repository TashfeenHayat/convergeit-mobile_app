import type { ChatOperationsJson, ServiceSchedule } from "./chat-settings.types";

/** Mirrors backend — takeover request flow removed. */
export const CHAT_TAKEOVER_REQUESTS_ENABLED = false;

export const DEFAULT_SERVICE_SCHEDULE: ServiceSchedule = {
  timezone: "Asia/Karachi",
  gapPolicy: "queue_until_next_window",
  windows: [
    {
      channel: "Internal",
      daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      startTime: "09:00",
      endTime: "18:00",
      crossesMidnight: false,
    },
    {
      channel: "External",
      daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      startTime: "10:00",
      endTime: "22:00",
      crossesMidnight: false,
    },
  ],
};

/** Mirrors backend `DEFAULT_CHAT_OPERATIONS` — merged on save (unknown keys preserved). */
export const DEFAULT_CHAT_OPERATIONS: ChatOperationsJson = {
  guestAccess: {
    enabled: true,
    sendMode: "agent_manual_only",
    linkExpiresHours: 72,
    guestSessionMinutesAfterOpen: 240,
    urlStrictSingleOpen: true,
    revokePreviousLinksOnNewSend: true,
    permissions: {
      viewTranscript: true,
      viewVisitorPii: true,
      whisper: true,
      directControl: true,
      takeoverRequest: false,
    },
  },
  takeover: {
    enabled: false,
    directControlEnabled: true,
    requesters: {
      poolHead: true,
      departmentHead: true,
      resellerMonitor: true,
      guestLinkRecipient: true,
    },
    notify: { currentAgent: true, poolHead: true },
    approval: { mode: "immediate" },
    whisper: { supervisorSuggestionEnabled: true, agentMustClickSend: true },
  },
  qa: {
    enabled: false,
    autoAssignOnClose: true,
    autoAssignOnTakeover: false,
    notifyAssignedQaOnTakeover: false,
    externalCanSeeWhispers: false,
    assignMode: "least_pending",
    internalAssignScope: "website",
    reviewSlaHours: null,
  },
  sessionResume: {
    enabled: true,
    reopenClosedWithinMinutes: 1440,
  },
  assignment: {
    requireHrmsShiftForInternal: false,
    skipShiftWhenUnconfigured: true,
    serviceSchedule: DEFAULT_SERVICE_SCHEDULE,
  },
  reporting: {
    enabled: true,
    maxRangeDays: 90,
  },
  csat: {
    enabled: false,
    required: false,
    scaleMax: 5,
  },
  cannedResponses: {
    enabled: true,
  },
  closePolicy: {
    enabled: true,
    visitorIdle: {
      enabled: true,
      nudgeAfterMinutes: 8,
      nudgeMessage:
        "Are you still there? Reply to keep this chat open.",
      closeAfterMinutes: 10,
      closeMessage:
        "This chat was closed due to inactivity. You can start a new conversation anytime.",
    },
    agentNoResponse: {
      enabled: true,
      firstAlertAgentAfterMinutes: 2,
      fallbackToVisitorAfterMinutes: 5,
      fallbackMessage:
        "Thanks for your patience. An agent will respond shortly.",
      closeAfterMinutes: 20,
      closeMessage:
        "We could not connect you with an agent right now. Please try again later.",
    },
    supervisorClose: {
      enabled: true,
      requireReason: true,
      reasonMinLength: 3,
    },
    onClose: {
      insertDistributionLinkInTranscript: true,
    },
  },
};

/** Shallow-merge operations sections (same semantics as Nest `mergeOperations`). */
export function mergeChatOperationsJson(
  base: ChatOperationsJson,
  patch?: Partial<ChatOperationsJson> | null,
): ChatOperationsJson {
  if (!patch || typeof patch !== "object") return base;
  const merged = { ...base, ...patch } as ChatOperationsJson;
  if (patch.closePolicy && typeof patch.closePolicy === "object") {
    merged.closePolicy = {
      ...(base.closePolicy as Record<string, unknown> | undefined),
      ...(patch.closePolicy as Record<string, unknown>),
      visitorIdle: {
        ...((base.closePolicy as Record<string, unknown> | undefined)?.visitorIdle as
          | Record<string, unknown>
          | undefined),
        ...((patch.closePolicy as Record<string, unknown>).visitorIdle as
          | Record<string, unknown>
          | undefined),
      },
      agentNoResponse: {
        ...((base.closePolicy as Record<string, unknown> | undefined)?.agentNoResponse as
          | Record<string, unknown>
          | undefined),
        ...((patch.closePolicy as Record<string, unknown>).agentNoResponse as
          | Record<string, unknown>
          | undefined),
      },
      supervisorClose: {
        ...((base.closePolicy as Record<string, unknown> | undefined)?.supervisorClose as
          | Record<string, unknown>
          | undefined),
        ...((patch.closePolicy as Record<string, unknown>).supervisorClose as
          | Record<string, unknown>
          | undefined),
      },
      onClose: {
        ...((base.closePolicy as Record<string, unknown> | undefined)?.onClose as
          | Record<string, unknown>
          | undefined),
        ...((patch.closePolicy as Record<string, unknown>).onClose as
          | Record<string, unknown>
          | undefined),
      },
    };
  }
  return merged;
}
