import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button } from '@/components/ui/Button';
import { GlassModalShell } from '@/components/ui/GlassModalShell';
import { LiquidGlass } from '@/components/ui/LiquidGlass';
import { Typography } from '@/components/ui/Typography';
import { glassUi } from '@/lib/theme/glass-ui';
import { tokens } from '@/theme/tokens';
import { useAppTheme } from '@/theme';

export type FormModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  onSave: () => void;
  primaryButtonLabel?: string;
  primaryButtonDisabled?: boolean;
  cancelButtonLabel?: string;
  showCancelButton?: boolean;
  primaryButtonVariant?: 'primary' | 'danger';
  children?: ReactNode;
};

export function FormModal({
  open,
  title,
  description,
  onClose,
  onSave,
  primaryButtonLabel = 'Save',
  primaryButtonDisabled = false,
  cancelButtonLabel = 'Cancel',
  showCancelButton = true,
  primaryButtonVariant = 'primary',
  children,
}: FormModalProps) {
  const theme = useAppTheme();

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <GlassModalShell
        onBackdropPress={onClose}
        style={styles.shell}
        contentStyle={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Typography variant="mediumLarge">{title}</Typography>
            {description ? (
              <Typography variant="small" muted style={styles.description}>
                {description}
              </Typography>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close dialog"
            hitSlop={8}
            onPress={onClose}
          >
            <LiquidGlass intensity="subtle" radius={glassUi.radius.pill} contentStyle={styles.closeButton}>
              <Ionicons name="close" size={18} color={theme.app.text.secondary} />
            </LiquidGlass>
          </Pressable>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>

        <View style={styles.footer}>
          {showCancelButton ? (
            <Button variant="secondary" size="compact" onPress={onClose}>
              {cancelButtonLabel}
            </Button>
          ) : null}
          <Button
            variant={primaryButtonVariant === 'danger' ? 'danger' : 'primary'}
            size="compact"
            disabled={primaryButtonDisabled}
            onPress={onSave}
          >
            {primaryButtonLabel}
          </Button>
        </View>
      </GlassModalShell>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shell: {
    maxWidth: 520,
    width: '100%',
    maxHeight: '92%',
  },
  card: {
    padding: tokens.space.lg,
    maxHeight: '100%',
    flexShrink: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: tokens.space.md,
    gap: tokens.space.sm,
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
  },
  description: {
    marginTop: 4,
  },
  closeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flexGrow: 1,
    flexShrink: 1,
    marginBottom: tokens.space.md,
  },
  bodyContent: {
    gap: tokens.space.md,
    paddingBottom: tokens.space.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: tokens.space.sm,
    flexShrink: 0,
  },
});
