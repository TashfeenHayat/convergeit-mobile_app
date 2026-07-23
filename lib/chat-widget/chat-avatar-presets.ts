import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export const AGENT_AVATAR_PRESETS = [
  { id: 'phosphor-headset', label: 'Headset', ionicon: 'headset-outline' },
  { id: 'phosphor-user-circle', label: 'Agent', ionicon: 'person-circle-outline' },
  { id: 'phosphor-headphones', label: 'Headphones', ionicon: 'headset' },
  { id: 'phosphor-lifebuoy', label: 'Support', ionicon: 'help-buoy-outline' },
  { id: 'phosphor-robot', label: 'AI bot', ionicon: 'hardware-chip-outline' },
  { id: 'phosphor-user-gear', label: 'Specialist', ionicon: 'settings-outline' },
  { id: 'phosphor-chats-circle', label: 'Chat agent', ionicon: 'chatbubbles-outline' },
  { id: 'phosphor-id-badge', label: 'Badge', ionicon: 'id-card-outline' },
  { id: 'phosphor-users', label: 'Team', ionicon: 'people-outline' },
] as const satisfies ReadonlyArray<{ id: string; label: string; ionicon: IoniconName }>;

export const VISITOR_AVATAR_PRESETS = [
  { id: 'phosphor-user-circle', label: 'User', ionicon: 'person-circle-outline' },
  { id: 'phosphor-user', label: 'Person', ionicon: 'person-outline' },
  { id: 'phosphor-user-focus', label: 'Focused', ionicon: 'scan-outline' },
  { id: 'phosphor-user-square', label: 'Square', ionicon: 'square-outline' },
  { id: 'phosphor-smiley', label: 'Smiley', ionicon: 'happy-outline' },
  { id: 'phosphor-id-card', label: 'ID card', ionicon: 'card-outline' },
  { id: 'phosphor-student', label: 'Student', ionicon: 'school-outline' },
  { id: 'phosphor-users', label: 'Group', ionicon: 'people-outline' },
] as const satisfies ReadonlyArray<{ id: string; label: string; ionicon: IoniconName }>;

export type AgentAvatarPresetId = (typeof AGENT_AVATAR_PRESETS)[number]['id'];
export type VisitorAvatarPresetId = (typeof VISITOR_AVATAR_PRESETS)[number]['id'];
export type ChatAvatarPresetId = AgentAvatarPresetId | VisitorAvatarPresetId;

export const DEFAULT_AGENT_AVATAR_PRESET: AgentAvatarPresetId = 'phosphor-user-circle';
export const DEFAULT_VISITOR_AVATAR_PRESET: VisitorAvatarPresetId =
  'phosphor-user-circle';

const AGENT_PRESET_IDS = new Set<string>(AGENT_AVATAR_PRESETS.map((p) => p.id));
const VISITOR_PRESET_IDS = new Set<string>(
  VISITOR_AVATAR_PRESETS.map((p) => p.id),
);

export function normalizeAgentAvatarPreset(value: unknown): AgentAvatarPresetId {
  const id = String(value ?? '').trim();
  if (AGENT_PRESET_IDS.has(id)) return id as AgentAvatarPresetId;
  return DEFAULT_AGENT_AVATAR_PRESET;
}

export function normalizeVisitorAvatarPreset(
  value: unknown,
): VisitorAvatarPresetId {
  const id = String(value ?? '').trim();
  if (VISITOR_PRESET_IDS.has(id)) return id as VisitorAvatarPresetId;
  return DEFAULT_VISITOR_AVATAR_PRESET;
}

export function findChatAvatarPreset(
  variant: 'agent' | 'visitor',
  presetId: string | undefined,
) {
  const list = variant === 'agent' ? AGENT_AVATAR_PRESETS : VISITOR_AVATAR_PRESETS;
  const fallback =
    variant === 'agent' ? DEFAULT_AGENT_AVATAR_PRESET : DEFAULT_VISITOR_AVATAR_PRESET;
  const id = presetId?.trim() || fallback;
  return list.find((p) => p.id === id) ?? list.find((p) => p.id === fallback)!;
}
