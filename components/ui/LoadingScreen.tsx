import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { SplashScreen } from '@/components/ui/SplashScreen';
import { Typography } from '@/components/ui/Typography';
import { tokens } from '@/theme/tokens';

export type LoadingScreenProps = {
  message?: string;
  /** Full-screen branded splash (default). Inline = compact spinner for sections. */
  fullPage?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Full-page loads use the brand splash (never a blank/white frame).
 * Inline mode keeps a compact spinner for in-list / card loading.
 */
export function LoadingScreen({
  message,
  fullPage = true,
  style,
}: LoadingScreenProps) {
  if (fullPage) {
    return <SplashScreen message={message ?? 'Loading…'} style={style} />;
  }

  return (
    <View style={[styles.inline, style]}>
      <ActivityIndicator size="large" color={tokens.colors.accentBlue} />
      {message ? (
        <Typography variant="medium" muted style={styles.message}>
          {message}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space.md,
    paddingVertical: tokens.space.xxl,
  },
  message: {
    marginTop: tokens.space.sm,
  },
});
