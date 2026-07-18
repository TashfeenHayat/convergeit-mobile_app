import { StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { tokens } from '@/theme/tokens';

export type UserTypeBadgeValue = 'Internal' | 'External' | '—';

export type UserTypeBadgeProps = {
  value: UserTypeBadgeValue | string | null | undefined;
};

export function UserTypeBadge({ value }: UserTypeBadgeProps) {
  const label = value === 'Internal' || value === 'External' ? value : '—';

  if (label === '—') {
    return (
      <Typography variant="small" color={tokens.colors.textMuted}>
        —
      </Typography>
    );
  }

  const isInternal = label === 'Internal';

  return (
    <View style={[styles.badge, isInternal ? styles.internal : styles.external]}>
      <Typography variant="small" style={styles.label}>
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
  },
  internal: {
    backgroundColor: 'rgba(59, 130, 246, 0.28)',
  },
  external: {
    backgroundColor: 'rgba(236, 72, 153, 0.24)',
  },
  label: {
    fontWeight: '600',
    color: tokens.colors.textPrimary,
  },
});
