import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button } from '@/components/ui/Button';
import { GlassModalShell } from '@/components/ui/GlassModalShell';
import { LiquidGlass } from '@/components/ui/LiquidGlass';
import { Typography } from '@/components/ui/Typography';
import { glassUi } from '@/lib/theme/glass-ui';
import { tokens } from '@/theme/tokens';

export type AppBoundaryKind = 'session_expired' | 'network' | 'permission_denied' | 'server_error' | 'unexpected';

export type AppBoundaryAction = {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary';
  onClick?: () => void | Promise<void>;
  keepOpen?: boolean;
};

export type AppBoundaryModalProps = {
  open: boolean;
  kind: AppBoundaryKind;
  title: string;
  description: string;
  dismissible?: boolean;
  actions: AppBoundaryAction[];
  onDismiss?: () => void;
};

const KIND_META: Record<AppBoundaryKind, { icon: keyof typeof Ionicons.glyphMap; accent: string }> = {
  session_expired: { icon: 'key-outline', accent: tokens.colors.accentOrange },
  network: { icon: 'cloud-offline-outline', accent: '#22D3EE' },
  permission_denied: { icon: 'lock-closed-outline', accent: tokens.colors.accentPink },
  server_error: { icon: 'server-outline', accent: '#A855F7' },
  unexpected: { icon: 'warning-outline', accent: tokens.colors.accentBlue },
};

export function AppBoundaryModal({
  open,
  kind,
  title,
  description,
  dismissible = true,
  actions,
  onDismiss,
}: AppBoundaryModalProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const meta = KIND_META[kind];

  const runAction = async (action: AppBoundaryAction) => {
    if (!action.onClick) {
      onDismiss?.();
      return;
    }
    setLoadingId(action.id);
    try {
      await action.onClick();
    } finally {
      setLoadingId(null);
      if (!action.keepOpen) onDismiss?.();
    }
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => dismissible && onDismiss?.()}
    >
      <GlassModalShell
        onBackdropPress={dismissible ? onDismiss : undefined}
        style={styles.shell}
        contentStyle={styles.card}
      >
        <LiquidGlass intensity="subtle" radius={glassUi.radius.pill} contentStyle={styles.iconCircle}>
          <Ionicons name={meta.icon} size={28} color={meta.accent} />
        </LiquidGlass>

        <Typography variant="regularLarge" style={styles.title}>
          {title}
        </Typography>

        <Typography variant="medium" muted style={styles.description}>
          {description}
        </Typography>

        <View style={styles.actions}>
          {actions.map((action) => {
            const isPrimary = action.variant !== 'secondary';
            const busy = loadingId === action.id;
            return (
              <Button
                key={action.id}
                variant={isPrimary ? 'primary' : 'secondary'}
                disabled={Boolean(loadingId) && !busy}
                loading={busy}
                fullWidth
                onPress={() => void runAction(action)}
              >
                {action.label}
              </Button>
            );
          })}
        </View>
      </GlassModalShell>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shell: {
    maxWidth: 420,
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
    width: '100%',
    gap: tokens.space.sm,
  },
});
