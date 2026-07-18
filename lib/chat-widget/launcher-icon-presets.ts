import type { IconType } from "react-icons";
import {
  PiBellDuotone,
  PiChatCenteredDotsDuotone,
  PiChatCenteredDuotone,
  PiChatCenteredTextDuotone,
  PiChatCircleDotsDuotone,
  PiChatCircleDuotone,
  PiChatCircleTextDuotone,
  PiChatDotsDuotone,
  PiChatDuotone,
  PiChatTeardropDotsDuotone,
  PiChatTeardropDuotone,
  PiChatTextDuotone,
  PiChatsCircleDuotone,
  PiChatsDuotone,
  PiChatsTeardropDuotone,
  PiEnvelopeDuotone,
  PiHandWavingDuotone,
  PiHeadphonesDuotone,
  PiHeadsetDuotone,
  PiHeartStraightDuotone,
  PiLifebuoyDuotone,
  PiMegaphoneDuotone,
  PiPhoneCallDuotone,
  PiQuestionDuotone,
  PiRobotDuotone,
  PiSparkleDuotone,
  PiUserCircleDuotone,
  PiUsersDuotone,
  PiWhatsappLogoDuotone,
} from "react-icons/pi";

export const LAUNCHER_ICON_PRESETS = [
  { id: "phosphor-chat-circle", label: "Chat circle", Icon: PiChatCircleDuotone },
  { id: "phosphor-chats-circle", label: "Chats circle", Icon: PiChatsCircleDuotone },
  { id: "phosphor-chat-dots", label: "Chat dots", Icon: PiChatDotsDuotone },
  { id: "phosphor-chat-teardrop", label: "Chat teardrop", Icon: PiChatTeardropDuotone },
  { id: "phosphor-chat", label: "Chat", Icon: PiChatDuotone },
  { id: "phosphor-chat-text", label: "Chat text", Icon: PiChatTextDuotone },
  { id: "phosphor-chat-centered", label: "Chat centered", Icon: PiChatCenteredDuotone },
  { id: "phosphor-chat-centered-dots", label: "Centered dots", Icon: PiChatCenteredDotsDuotone },
  { id: "phosphor-chat-centered-text", label: "Centered text", Icon: PiChatCenteredTextDuotone },
  { id: "phosphor-chat-circle-dots", label: "Circle dots", Icon: PiChatCircleDotsDuotone },
  { id: "phosphor-chat-circle-text", label: "Circle text", Icon: PiChatCircleTextDuotone },
  { id: "phosphor-chat-teardrop-dots", label: "Teardrop dots", Icon: PiChatTeardropDotsDuotone },
  { id: "phosphor-chats", label: "Chats", Icon: PiChatsDuotone },
  { id: "phosphor-chats-teardrop", label: "Chats teardrop", Icon: PiChatsTeardropDuotone },
  { id: "phosphor-headset", label: "Headset", Icon: PiHeadsetDuotone },
  { id: "phosphor-headphones", label: "Headphones", Icon: PiHeadphonesDuotone },
  { id: "phosphor-lifebuoy", label: "Support", Icon: PiLifebuoyDuotone },
  { id: "phosphor-robot", label: "AI bot", Icon: PiRobotDuotone },
  { id: "phosphor-hand-waving", label: "Wave", Icon: PiHandWavingDuotone },
  { id: "phosphor-megaphone", label: "Megaphone", Icon: PiMegaphoneDuotone },
  { id: "phosphor-phone-call", label: "Phone call", Icon: PiPhoneCallDuotone },
  { id: "phosphor-envelope", label: "Email", Icon: PiEnvelopeDuotone },
  { id: "phosphor-bell", label: "Bell", Icon: PiBellDuotone },
  { id: "phosphor-question", label: "Help", Icon: PiQuestionDuotone },
  { id: "phosphor-user-circle", label: "Agent", Icon: PiUserCircleDuotone },
  { id: "phosphor-users", label: "Team", Icon: PiUsersDuotone },
  { id: "phosphor-sparkle", label: "Sparkle", Icon: PiSparkleDuotone },
  { id: "phosphor-heart-straight", label: "Heart", Icon: PiHeartStraightDuotone },
  { id: "phosphor-whatsapp-logo", label: "WhatsApp", Icon: PiWhatsappLogoDuotone },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  Icon: IconType;
}>;

export type LauncherIconPresetIdNonEmpty = (typeof LAUNCHER_ICON_PRESETS)[number]["id"];

/** Empty string = custom uploaded icon override. */
export type LauncherIconPresetId = "" | LauncherIconPresetIdNonEmpty;

export const LAUNCHER_ICON_PRESET_ID_SET = new Set<string>(
  LAUNCHER_ICON_PRESETS.map((p) => p.id),
);

export function normalizeLauncherIconPreset(
  value: unknown,
  fallback: LauncherIconPresetId = "phosphor-chat-circle",
): LauncherIconPresetId {
  if (value === "") return "";
  if (typeof value === "string" && LAUNCHER_ICON_PRESET_ID_SET.has(value)) {
    return value as LauncherIconPresetIdNonEmpty;
  }
  return fallback;
}

export function findLauncherIconPreset(id: LauncherIconPresetId) {
  if (!id) return null;
  return LAUNCHER_ICON_PRESETS.find((p) => p.id === id) ?? null;
}
