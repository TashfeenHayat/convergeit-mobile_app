import type { ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoginParticles } from '@/components/auth/LoginParticles';
import { AppCard, Typography } from '@/components/ui';
import { useAppTheme } from '@/theme';

const logo = require('../../assets/images/logo.png');

export type AuthShellProps = {
  heading?: string;
  subheading?: string;
  children: ReactNode;
};

/**
 * Mobile AuthShell — mirrors web auth card (logo + title + form slot).
 * Sized for phone screens (safe area + keyboard avoid).
 * Particles match web `AuthShell` / `LoginParticles` (no layout redesign).
 */
export function AuthShell({ heading, subheading, children }: AuthShellProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.app.background.top }]}>
      <LoginParticles />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              {
                paddingHorizontal: theme.spacing.screen,
                paddingVertical: theme.spacing.xl,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <AppCard style={styles.card}>
              <Image
                source={logo}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="ConvergeIT"
              />
              {heading ? (
                <Typography variant="boldLarge" style={styles.heading}>
                  {heading}
                </Typography>
              ) : null}
              {subheading ? (
                <Typography variant="medium" muted style={styles.subheading}>
                  {subheading}
                </Typography>
              ) : null}
              <View style={[styles.slot, { gap: theme.spacing.lg }]}>{children}</View>
            </AppCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  safe: { flex: 1, zIndex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  logo: {
    width: 168,
    height: 56,
    alignSelf: 'center',
    marginBottom: 16,
  },
  heading: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    marginBottom: 24,
    textAlign: 'center',
  },
  slot: {
    width: '100%',
  },
});
