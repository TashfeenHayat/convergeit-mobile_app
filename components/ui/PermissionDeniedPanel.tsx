import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button } from '@/components/ui/Button';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { Typography } from '@/components/ui/Typography';
import { tokens } from '@/theme/tokens';

export type PermissionDeniedPanelProps = {
  title?: string;
  description?: string;
  /** Navigates home when pressed. Hidden when omitted. */
  onGoHome?: () => void;
  homeLabel?: string;
};

/**
 * In-page permission boundary (route / operational view) — same visual language as
 * {@link AppBoundaryModal}.
 */
export function PermissionDeniedPanel({
  title = 'Access denied',
  description = "You don't have view permission for this area. Ask an administrator to assign the right operational permission for this screen.",
  onGoHome,
  homeLabel = 'Go to home',
}: PermissionDeniedPanelProps) {
  return (
    <View style={styles.container}>
      <DashboardCard style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed-outline" size={32} color={tokens.colors.accentPink} />
        </View>

        <Typography variant="regularLarge" style={styles.title}>
          {title}
        </Typography>

        <Typography variant="medium" color={tokens.colors.textSecondary} style={styles.description}>
          {description}
        </Typography>

        {onGoHome ? (
          <Button variant="primary" onPress={onGoHome}>
            {homeLabel}
          </Button>
        ) : null}
      </DashboardCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.space.lg,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    alignItems: 'center',
    padding: tokens.space.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(236, 72, 153, 0.16)',
    marginBottom: tokens.space.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: tokens.space.sm,
  },
  description: {
    textAlign: 'center',
    marginBottom: tokens.space.lg,
  },
});
