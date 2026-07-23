import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui';
import { findLauncherIconPreset } from '@/lib/chat-widget/launcher-icon-presets';
import type { LauncherIconPresetId } from '@/lib/chat-widget/launcher-icon-presets';
import type { WidgetLauncherStyleId } from '@/lib/chat-widget/launcher-style';

export type TextUsLauncherChipProps = {
  buttonColor: string;
  buttonHoverColor?: string;
  iconColor?: string;
  iconPreset?: LauncherIconPresetId | string;
  iconEnabled?: boolean;
  launcherStyle?: WidgetLauncherStyleId | string;
  glowColor?: string;
  buttonLabel?: string;
  size?: 'preview' | 'embed';
  onPress?: () => void;
};

/** Floating Text Us launcher — pill with icon + label, or icon-only. */
export function TextUsLauncherChip({
  buttonColor,
  iconColor = '#ffffff',
  iconPreset = 'phosphor-chat-circle',
  iconEnabled = true,
  glowColor,
  buttonLabel,
  size = 'embed',
  onPress,
}: TextUsLauncherChipProps) {
  const label = buttonLabel?.trim() ?? '';
  const showLabel = label.length > 0;
  const showIcon = iconEnabled !== false;
  const fabSize = size === 'preview' ? 48 : 52;
  const iconPx = size === 'preview' ? 20 : 22;
  const iconName =
    findLauncherIconPreset(String(iconPreset) as LauncherIconPresetId)
      ?.ionicon ?? 'chatbubble-outline';
  const bg = buttonColor.trim() || '#1E63D5';
  const glow = glowColor?.trim() || bg;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label || 'Text Us'}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: bg,
          height: fabSize,
          paddingHorizontal: showLabel ? 14 : 0,
          width: showLabel ? undefined : fabSize,
          minWidth: showLabel ? undefined : fabSize,
          opacity: pressed ? 0.9 : 1,
          shadowColor: glow,
          shadowOpacity: 0.35,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        },
      ]}
    >
      {showIcon ? (
        <Ionicons name={iconName} size={iconPx} color={iconColor} />
      ) : null}
      {showLabel ? (
        <Typography
          variant="small"
          color={iconColor}
          style={{ fontWeight: '700', fontSize: size === 'preview' ? 12 : 13 }}
        >
          {label}
        </Typography>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
