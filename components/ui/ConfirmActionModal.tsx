import { Modal, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button } from '@/components/ui/Button';
import { GlassModalShell } from '@/components/ui/GlassModalShell';
import { LiquidGlass } from '@/components/ui/LiquidGlass';
import { Typography } from '@/components/ui/Typography';
import { glassUi } from '@/lib/theme/glass-ui';
import { tokens } from '@/theme/tokens';
import { useAppTheme } from '@/theme';

export type ConfirmActionModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onDismiss: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  confirmButtonVariant?: 'primary' | 'danger';
};

export function ConfirmActionModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onDismiss,
  onConfirm,
  isLoading = false,
  confirmButtonVariant = 'primary',
}: ConfirmActionModalProps) {
  const theme = useAppTheme();
  const warn = theme.app.dashboard.accentOrange;

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onDismiss}>
      <GlassModalShell onBackdropPress={onDismiss} style={styles.shell} contentStyle={styles.card}>
        <LiquidGlass intensity="subtle" radius={glassUi.radius.pill} contentStyle={styles.iconCircle}>
          <Ionicons name="warning" size={32} color={warn} />
        </LiquidGlass>

        <Typography variant="regularLarge" style={styles.title}>
          {title}
        </Typography>

        <Typography variant="medium" muted style={styles.description}>
          {description}
        </Typography>

        <View style={styles.actions}>
          <Button variant="secondary" disabled={isLoading} style={styles.actionButton} onPress={onDismiss}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmButtonVariant === 'danger' ? 'danger' : 'primary'}
            disabled={isLoading}
            loading={isLoading}
            style={styles.actionButton}
            onPress={onConfirm}
          >
            {confirmLabel}
          </Button>
        </View>
      </GlassModalShell>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shell: {
    maxWidth: 400,
  },
  card: {
    padding: tokens.space.xl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
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
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: tokens.space.sm,
  },
  actionButton: {
    flex: 1,
    minWidth: 0,
  },
});
