export type EmbedPanelHeaderStatusTone =
  | "live"
  | "assistant"
  | "agent"
  | "queue"
  | "offline"
  | "typing"
  | "thinking";

export type EmbedPanelHeaderStatus = {
  tone: EmbedPanelHeaderStatusTone;
  label: string;
};

export function resolveEmbedPanelHeaderStatus(params: {
  showOfflineBanner: boolean;
  offlineMessage?: string;
  talkToAgentStatus: string | null;
  agentTypingSeen: boolean;
  aiPending: boolean;
  hybridEscalatedWaiting: boolean;
  statusLabel: string;
}): EmbedPanelHeaderStatus | null {
  if (params.showOfflineBanner) {
    const label = params.offlineMessage?.trim() || "Offline";
    return { tone: "offline", label: label.slice(0, 48) };
  }
  if (params.agentTypingSeen) {
    return { tone: "typing", label: "Typing…" };
  }
  if (params.aiPending) {
    return { tone: "thinking", label: "Thinking…" };
  }
  const ho = params.talkToAgentStatus?.trim() ?? "";
  if (ho) {
    const lower = ho.toLowerCase();
    if (lower.includes("queue") || lower.includes("waiting")) {
      return { tone: "queue", label: "In queue" };
    }
    if (lower.includes("joined") || lower.includes("assigned")) {
      return { tone: "agent", label: "Agent online" };
    }
    return { tone: "agent", label: ho.length > 28 ? `${ho.slice(0, 27)}…` : ho };
  }
  if (params.hybridEscalatedWaiting) {
    return { tone: "queue", label: "Connecting agent" };
  }
  const base = params.statusLabel.trim();
  if (!base) return null;
  const tone: EmbedPanelHeaderStatusTone =
    base === "Assistant" || base === "Thinking…"
      ? "assistant"
      : base === "Connecting…"
        ? "queue"
        : base === "Offline"
          ? "offline"
          : "live";
  return { tone, label: base };
}
