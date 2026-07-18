import { StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui';
import { tokens } from '@/theme/tokens';

export type InlineAlertProps = {
  severity?: 'info' | 'success' | 'warning' | 'error';
  children: string;
};

const palette = {
  info: { bg: 'rgba(88, 101, 242, 0.18)', border: tokens.colors.accentBlue },
  success: { bg: 'rgba(34, 197, 94, 0.16)', border: tokens.colors.accentGreen },
  warning: { bg: 'rgba(249, 115, 22, 0.16)', border: tokens.colors.accentOrange },
  error: { bg: 'rgba(239, 68, 68, 0.16)', border: tokens.colors.danger },
} as const;

export function InlineAlert({ severity = 'info', children }: InlineAlertProps) {
  const colors = palette[severity];
  return (
    <View style={[styles.box, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Typography variant="small" color={tokens.colors.textPrimary}>
        {children}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.md,
  },
});
