import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { LiquidGlass } from '@/components/ui/LiquidGlass';
import { glassUi } from '@/lib/theme/glass-ui';
import { tokens } from '@/theme/tokens';

export type AppCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Frosted glass content card — same Control Center material as header / sidebar. */
export function AppCard({ children, style }: AppCardProps) {
  return (
    <LiquidGlass
      intensity="medium"
      radius={glassUi.radius.lg}
      elevated
      contentStyle={[styles.content, style]}
    >
      {children}
    </LiquidGlass>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: tokens.space.xl,
  },
});
