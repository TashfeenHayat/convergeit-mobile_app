import type { AiTrainingKbVariant } from "./ai-training-kb.utils";

export type AiTrainingSetupScope = "chatbot" | "copilot";

const BASE: Record<AiTrainingKbVariant, string> = {
  chatbot: "/dashboard/ai-training/chatbot",
  assistant: "/dashboard/ai-training/assistant",
};

const COPILOT_BASE = "/dashboard/ai-training/copilot";
const HUB = "/dashboard/ai-training";

export function aiTrainingHubHref(): string {
  return HUB;
}

export function aiTrainingSetupHref(
  websiteId?: string,
  scope: AiTrainingSetupScope = "chatbot",
): string {
  const base = "/dashboard/ai-training/setup";
  const params = new URLSearchParams();
  if (websiteId?.trim()) params.set("websiteId", websiteId.trim());
  if (scope !== "chatbot") params.set("scope", scope);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function aiTrainingCopilotHref(websiteId?: string): string {
  if (!websiteId?.trim()) return COPILOT_BASE;
  return `${COPILOT_BASE}?websiteId=${encodeURIComponent(websiteId.trim())}`;
}

export function aiTrainingTrainHref(websiteId?: string): string {
  const base = "/dashboard/ai-training/train";
  if (!websiteId?.trim()) return base;
  return `${base}?websiteId=${encodeURIComponent(websiteId.trim())}`;
}

export function aiTrainingPlatformKeysHref(): string {
  return "/dashboard/ai-training/platform-keys";
}

export function aiTrainingListHref(variant: AiTrainingKbVariant): string {
  return BASE[variant];
}

export function aiTrainingAddHref(variant: AiTrainingKbVariant, websiteId?: string): string {
  const base = `${BASE[variant]}/add`;
  if (!websiteId?.trim()) return base;
  return `${base}?websiteId=${encodeURIComponent(websiteId.trim())}`;
}

export function aiTrainingManageHref(
  variant: AiTrainingKbVariant,
  websiteId: string,
  options?: { panel?: "test" },
): string {
  if (options?.panel === "test") {
    return aiTrainingTestStudioHref(variant, websiteId);
  }
  const base = `${BASE[variant]}/manage?websiteId=${encodeURIComponent(websiteId.trim())}`;
  return base;
}

export function aiTrainingTestStudioHref(
  variant: AiTrainingKbVariant,
  websiteId: string,
): string {
  return `${BASE[variant]}/test?websiteId=${encodeURIComponent(websiteId.trim())}`;
}
