import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { LiquidGlass } from '@/components/ui/LiquidGlass';
import { glassUi } from '@/lib/theme/glass-ui';
import { tokens } from '@/theme/tokens';

export type DashboardCardProps = {
  children: ReactNode;
  /** Layout on the outer glass shell (flex, width, margin). */
  style?: StyleProp<ViewStyle>;
  /** Inner padding and content layout. */
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Glass-panel card used across dashboard surfaces (Control Center frost).
 */
export function DashboardCard({ children, style, contentStyle }: DashboardCardProps) {
  const shellStyle = contentStyle != null ? style : undefined;
  const innerStyle = contentStyle ?? style;

  return (
    <LiquidGlass
      intensity="strong"
      radius={glassUi.radius.lg}
      elevated
      style={shellStyle}
      contentStyle={[styles.content, innerStyle]}
    >
      {children}
    </LiquidGlass>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: tokens.space.lg,
  },
});
