import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { tokens } from '@/theme/tokens';

export type DashboardPageIntroProps = {
  /** Shown under the app-bar title (drawer header already shows the page title). */
  subtitle?: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Page intro block for dashboard routes — subtitle + toolbar (search, actions).
 * Avoid duplicating the large page title; `DashboardGlassHeader` already shows it.
 */
export function DashboardPageIntro({ subtitle, children, style }: DashboardPageIntroProps) {
  return (
    <View style={[styles.wrap, style]}>
      {subtitle ? (
        <Typography variant="medium" muted style={styles.subtitle}>
          {subtitle}
        </Typography>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    marginBottom: 4,
  },
  subtitle: {
    lineHeight: 20,
  },
});
