import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export const LAUNCHER_ICON_PRESETS = [
  { id: 'phosphor-chat-circle', label: 'Chat circle', ionicon: 'chatbubble-outline' },
  { id: 'phosphor-chats-circle', label: 'Chats circle', ionicon: 'chatbubbles-outline' },
  { id: 'phosphor-chat-dots', label: 'Chat dots', ionicon: 'chatbox-ellipses-outline' },
  { id: 'phosphor-chat-teardrop', label: 'Chat teardrop', ionicon: 'chatbubble-ellipses-outline' },
  { id: 'phosphor-chat', label: 'Chat', ionicon: 'chatbox-outline' },
  { id: 'phosphor-chat-text', label: 'Chat text', ionicon: 'chatbox' },
  { id: 'phosphor-chat-centered', label: 'Chat centered', ionicon: 'chatbubble' },
  { id: 'phosphor-chat-centered-dots', label: 'Centered dots', ionicon: 'chatbubbles' },
  { id: 'phosphor-chat-centered-text', label: 'Centered text', ionicon: 'chatbubble-outline' },
  { id: 'phosphor-chat-circle-dots', label: 'Circle dots', ionicon: 'chatbubble-ellipses-outline' },
  { id: 'phosphor-chat-circle-text', label: 'Circle text', ionicon: 'chatbubble' },
  { id: 'phosphor-chat-teardrop-dots', label: 'Teardrop dots', ionicon: 'chatbox-ellipses-outline' },
  { id: 'phosphor-chats', label: 'Chats', ionicon: 'chatbubbles-outline' },
  { id: 'phosphor-chats-teardrop', label: 'Chats teardrop', ionicon: 'chatbubbles' },
  { id: 'phosphor-headset', label: 'Headset', ionicon: 'headset-outline' },
  { id: 'phosphor-headphones', label: 'Headphones', ionicon: 'headset' },
  { id: 'phosphor-lifebuoy', label: 'Support', ionicon: 'help-buoy-outline' },
  { id: 'phosphor-robot', label: 'AI bot', ionicon: 'hardware-chip-outline' },
  { id: 'phosphor-hand-waving', label: 'Wave', ionicon: 'hand-left-outline' },
  { id: 'phosphor-megaphone', label: 'Megaphone', ionicon: 'megaphone-outline' },
  { id: 'phosphor-phone-call', label: 'Phone call', ionicon: 'call-outline' },
  { id: 'phosphor-envelope', label: 'Email', ionicon: 'mail-outline' },
  { id: 'phosphor-bell', label: 'Bell', ionicon: 'notifications-outline' },
  { id: 'phosphor-question', label: 'Help', ionicon: 'help-circle-outline' },
  { id: 'phosphor-user-circle', label: 'Agent', ionicon: 'person-circle-outline' },
  { id: 'phosphor-users', label: 'Team', ionicon: 'people-outline' },
  { id: 'phosphor-sparkle', label: 'Sparkle', ionicon: 'star-outline' },
  { id: 'phosphor-heart-straight', label: 'Heart', ionicon: 'heart-outline' },
  { id: 'phosphor-whatsapp-logo', label: 'WhatsApp', ionicon: 'logo-whatsapp' },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  ionicon: IoniconName;
}>;

export type LauncherIconPresetIdNonEmpty =
  (typeof LAUNCHER_ICON_PRESETS)[number]['id'];

/** Empty string = custom uploaded icon override. */
export type LauncherIconPresetId = '' | LauncherIconPresetIdNonEmpty;

export const LAUNCHER_ICON_PRESET_ID_SET = new Set<string>(
  LAUNCHER_ICON_PRESETS.map((p) => p.id),
);

export function normalizeLauncherIconPreset(
  value: unknown,
  fallback: LauncherIconPresetId = 'phosphor-chat-circle',
): LauncherIconPresetId {
  if (value === '') return '';
  if (typeof value === 'string' && LAUNCHER_ICON_PRESET_ID_SET.has(value)) {
    return value as LauncherIconPresetIdNonEmpty;
  }
  return fallback;
}

export function findLauncherIconPreset(id: LauncherIconPresetId) {
  if (!id) return null;
  return LAUNCHER_ICON_PRESETS.find((p) => p.id === id) ?? null;
}
