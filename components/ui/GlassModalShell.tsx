import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { LiquidGlass } from '@/components/ui/LiquidGlass';
import { glassUi } from '@/lib/theme/glass-ui';
import { tokens } from '@/theme/tokens';

export type GlassModalShellProps = {
  children: ReactNode;
  /** Called when the dimmed backdrop is pressed. */
  onBackdropPress?: () => void;
  /** Outer shell layout (width, maxWidth, alignSelf). */
  style?: StyleProp<ViewStyle>;
  /** Inner padding / content layout. */
  contentStyle?: StyleProp<ViewStyle>;
  /** Soften the scrim so glass blur still reads over the page. */
  backdropOpacity?: number;
};

/**
 * Control Center–style frosted dialog panel — shared by confirm / form / boundary modals.
 */
export function GlassModalShell({
  children,
  onBackdropPress,
  style,
  contentStyle,
  backdropOpacity = 0.42,
}: GlassModalShellProps) {
  return (
    <Pressable
      style={[styles.backdrop, { backgroundColor: `rgba(6, 8, 22, ${backdropOpacity})` }]}
      onPress={onBackdropPress}
      accessibilityRole="button"
      accessibilityLabel="Dismiss"
    >
      <Pressable style={[styles.anchor, style]} onPress={(e) => e.stopPropagation()}>
        <LiquidGlass
          intensity="strong"
          radius={glassUi.radius.lg}
          elevated
          contentStyle={[styles.content, contentStyle]}
        >
          {children}
        </LiquidGlass>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.space.lg,
  },
  anchor: {
    width: '100%',
    maxWidth: 440,
  },
  content: {
    padding: tokens.space.xl,
  },
});
