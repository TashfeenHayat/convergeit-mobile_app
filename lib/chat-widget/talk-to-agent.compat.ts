import { DEFAULT_TALK_TO_AGENT_BUTTON_LABEL } from "./talk-to-agent.constants";

export const LEGACY_HANDOVER_REQUESTED = "handoverRequested" as const;
export const TALK_TO_AGENT_REQUESTED = "talkToAgentRequested" as const;
export const LEGACY_AGENT_HANDOVER_ENABLED = "agentHandoverEnabled" as const;
export const TALK_TO_AGENT_ENABLED = "agentTalkToAgentEnabled" as const;
export const LEGACY_HANDOVER_TRIGGER_TEXT = "handoverTriggerText" as const;
export const TALK_TO_AGENT_TRIGGER_TEXT = "talkToAgentTriggerText" as const;
export const LEGACY_HANDOVER_BUTTON_BG = "handoverButtonBg" as const;
export const TALK_TO_AGENT_BUTTON_BG = "talkToAgentButtonBg" as const;
export const LEGACY_CALL_HANDOVER_ENABLED = "callHandoverEnabled" as const;

export function readTalkToAgentRequested(
  value: Record<string, unknown> | null | undefined,
): boolean {
  if (!value) return false;
  return (
    value[TALK_TO_AGENT_REQUESTED] === true ||
    value[LEGACY_HANDOVER_REQUESTED] === true
  );
}

export function readTalkToAgentTriggerText(
  ...sources: Array<Record<string, unknown> | null | undefined>
): string {
  for (const src of sources) {
    if (!src) continue;
    const next =
      (typeof src[TALK_TO_AGENT_TRIGGER_TEXT] === "string" &&
        src[TALK_TO_AGENT_TRIGGER_TEXT]) ||
      (typeof src[LEGACY_HANDOVER_TRIGGER_TEXT] === "string" &&
        src[LEGACY_HANDOVER_TRIGGER_TEXT]);
    if (typeof next === "string" && next.trim()) return next.trim();
  }
  return DEFAULT_TALK_TO_AGENT_BUTTON_LABEL;
}

export function readTalkToAgentEnabled(
  ...sources: Array<Record<string, unknown> | null | undefined>
): boolean {
  for (const src of sources) {
    if (!src) continue;
    if (
      src[TALK_TO_AGENT_ENABLED] === false ||
      src[LEGACY_AGENT_HANDOVER_ENABLED] === false
    ) {
      return false;
    }
  }
  return true;
}
