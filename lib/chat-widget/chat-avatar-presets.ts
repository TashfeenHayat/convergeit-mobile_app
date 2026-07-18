import type { IconType } from "react-icons";
import {
  PiChatsCircleDuotone,
  PiHeadphonesDuotone,
  PiHeadsetDuotone,
  PiIdentificationBadgeDuotone,
  PiIdentificationCardDuotone,
  PiLifebuoyDuotone,
  PiRobotDuotone,
  PiSmileyDuotone,
  PiStudentDuotone,
  PiUserCircleDuotone,
  PiUserDuotone,
  PiUserFocusDuotone,
  PiUserGearDuotone,
  PiUserSquareDuotone,
  PiUsersDuotone,
} from "react-icons/pi";

export const AGENT_AVATAR_PRESETS = [
  { id: "phosphor-headset", label: "Headset", Icon: PiHeadsetDuotone },
  { id: "phosphor-user-circle", label: "Agent", Icon: PiUserCircleDuotone },
  { id: "phosphor-headphones", label: "Headphones", Icon: PiHeadphonesDuotone },
  { id: "phosphor-lifebuoy", label: "Support", Icon: PiLifebuoyDuotone },
  { id: "phosphor-robot", label: "AI bot", Icon: PiRobotDuotone },
  { id: "phosphor-user-gear", label: "Specialist", Icon: PiUserGearDuotone },
  { id: "phosphor-chats-circle", label: "Chat agent", Icon: PiChatsCircleDuotone },
  { id: "phosphor-id-badge", label: "Badge", Icon: PiIdentificationBadgeDuotone },
  { id: "phosphor-users", label: "Team", Icon: PiUsersDuotone },
] as const satisfies ReadonlyArray<{ id: string; label: string; Icon: IconType }>;

export const VISITOR_AVATAR_PRESETS = [
  { id: "phosphor-user-circle", label: "User", Icon: PiUserCircleDuotone },
  { id: "phosphor-user", label: "Person", Icon: PiUserDuotone },
  { id: "phosphor-user-focus", label: "Focused", Icon: PiUserFocusDuotone },
  { id: "phosphor-user-square", label: "Square", Icon: PiUserSquareDuotone },
  { id: "phosphor-smiley", label: "Smiley", Icon: PiSmileyDuotone },
  { id: "phosphor-id-card", label: "ID card", Icon: PiIdentificationCardDuotone },
  { id: "phosphor-student", label: "Student", Icon: PiStudentDuotone },
  { id: "phosphor-users", label: "Group", Icon: PiUsersDuotone },
] as const satisfies ReadonlyArray<{ id: string; label: string; Icon: IconType }>;

export type AgentAvatarPresetId = (typeof AGENT_AVATAR_PRESETS)[number]["id"];
export type VisitorAvatarPresetId = (typeof VISITOR_AVATAR_PRESETS)[number]["id"];
export type ChatAvatarPresetId = AgentAvatarPresetId | VisitorAvatarPresetId;

export const DEFAULT_AGENT_AVATAR_PRESET: AgentAvatarPresetId = "phosphor-user-circle";
export const DEFAULT_VISITOR_AVATAR_PRESET: VisitorAvatarPresetId = "phosphor-user-circle";

const AGENT_PRESET_IDS = new Set<string>(AGENT_AVATAR_PRESETS.map((p) => p.id));
const VISITOR_PRESET_IDS = new Set<string>(VISITOR_AVATAR_PRESETS.map((p) => p.id));

export function normalizeAgentAvatarPreset(value: unknown): AgentAvatarPresetId {
  const id = String(value ?? "").trim();
  if (AGENT_PRESET_IDS.has(id)) return id as AgentAvatarPresetId;
  return DEFAULT_AGENT_AVATAR_PRESET;
}

export function normalizeVisitorAvatarPreset(value: unknown): VisitorAvatarPresetId {
  const id = String(value ?? "").trim();
  if (VISITOR_PRESET_IDS.has(id)) return id as VisitorAvatarPresetId;
  return DEFAULT_VISITOR_AVATAR_PRESET;
}

export function findChatAvatarPreset(
  variant: "agent" | "visitor",
  presetId: string | undefined,
) {
  const list = variant === "agent" ? AGENT_AVATAR_PRESETS : VISITOR_AVATAR_PRESETS;
  const fallback =
    variant === "agent" ? DEFAULT_AGENT_AVATAR_PRESET : DEFAULT_VISITOR_AVATAR_PRESET;
  const id = presetId?.trim() || fallback;
  return list.find((p) => p.id === id) ?? list.find((p) => p.id === fallback)!;
}
