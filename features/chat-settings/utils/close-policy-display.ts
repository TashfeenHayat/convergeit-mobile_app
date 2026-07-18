import type { ClosePolicyListSummary } from "@/services/chat/close-policy-list.types";

export function formatVisitorIdleTimers(cp: ClosePolicyListSummary): string {
  if (!cp.enabled || !cp.visitorIdle.enabled) return "—";
  const { nudgeAfterMinutes, closeAfterMinutes } = cp.visitorIdle;
  return `Nudge ${nudgeAfterMinutes}m · Close ${closeAfterMinutes}m`;
}

export function formatAgentNoResponseTimers(cp: ClosePolicyListSummary): string {
  if (!cp.enabled || !cp.agentNoResponse.enabled) return "—";
  const a = cp.agentNoResponse;
  return `Alert ${a.firstAlertAgentAfterMinutes}m · Fallback ${a.fallbackToVisitorAfterMinutes}m · Close ${a.closeAfterMinutes}m`;
}

export function formatSupervisorClose(cp: ClosePolicyListSummary): string {
  if (!cp.enabled) return "—";
  if (!cp.supervisorClose.enabled) return "Disabled";
  return cp.supervisorClose.requireReason ? "On · reason required" : "On";
}

export type ClosePolicyStatusFilter = "all" | "enabled" | "disabled";

export function matchesClosePolicyStatusFilter(
  row: ClosePolicyListSummary,
  filter: ClosePolicyStatusFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "enabled") return row.enabled;
  return !row.enabled;
}
