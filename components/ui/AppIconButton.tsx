import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { IconSlot } from '@/components/ui/IconSlot';
import { tokens } from '@/theme/tokens';

export type ToolbarIconButtonTone = 'default' | 'muted' | 'accent' | 'danger';

export type AppIconButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  /** Muted icon chrome for dense tables; pressed state still lifts to full contrast. */
  tone?: ToolbarIconButtonTone;
  style?: StyleProp<ViewStyle>;
};

/** Standard dashboard icon control (toolbars, table row menus). */
export function AppIconButton({ tone = 'default', style, children, disabled, ...rest }: AppIconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        toneStyles[tone],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      <IconSlot slot={20}>{children}</IconSlot>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: tokens.colors.pillActive,
  },
  disabled: {
    opacity: 0.4,
  },
});

const toneStyles: Record<ToolbarIconButtonTone, ViewStyle> = {
  default: {},
  muted: { opacity: 0.7 },
  accent: { backgroundColor: 'rgba(88, 101, 242, 0.16)' },
  danger: { backgroundColor: 'rgba(239, 68, 68, 0.16)' },
};
