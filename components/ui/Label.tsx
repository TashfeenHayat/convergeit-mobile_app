import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { tokens } from '@/theme/tokens';

export type LabelProps = {
  children: ReactNode;
  error?: boolean;
  style?: StyleProp<TextStyle>;
};

export function Label({ children, error = false, style }: LabelProps) {
  return (
    <Typography
      variant="label"
      color={error ? tokens.colors.danger : tokens.colors.textPrimary}
      style={[styles.label, style]}
    >
      {children}
    </Typography>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 6,
  },
});
