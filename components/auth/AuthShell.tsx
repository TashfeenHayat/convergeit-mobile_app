import type { ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import {
  AuthOnGlassContext,
  authOnGlassText,
} from '@/components/auth/AuthOnGlassContext';
import { LoginParticles } from '@/components/auth/LoginParticles';
import { AppCard, GlassCard, Typography } from '@/components/ui';
import { useAppTheme } from '@/theme';

const logo = require('../../assets/images/logo.png');

/** CSS: radial-gradient(50% 50%, rgb(9, 1, 63) 0%, rgb(0, 1, 26) 100%) */
const LOGIN_BG_CENTER = 'rgb(9, 1, 63)';
const LOGIN_BG_EDGE = 'rgb(0, 1, 26)';

function LoginRadialBackground() {
  const { width, height } = useWindowDimensions();

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="loginRadialBg" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={LOGIN_BG_CENTER} />
          <Stop offset="100%" stopColor={LOGIN_BG_EDGE} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#loginRadialBg)" />
    </Svg>
  );
}

export type AuthShellProps = {
  heading?: string;
  subheading?: string;
  children: ReactNode;
  /** Use classic glassmorphism card (login). Default keeps AppCard. */
  glassCard?: boolean;
};

/**
 * Mobile AuthShell — mirrors web auth card (logo + title + form slot).
 * Sized for phone screens (safe area + keyboard avoid).
 * Particles match web `AuthShell` / `LoginParticles` (no layout redesign).
 */
export function AuthShell({ heading, subheading, children, glassCard = false }: AuthShellProps) {
  const theme = useAppTheme();
  const Card = glassCard ? GlassCard : AppCard;

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: glassCard ? LOGIN_BG_EDGE : theme.app.background.top },
      ]}
    >
      {glassCard ? <LoginRadialBackground /> : null}
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
            <AuthOnGlassContext.Provider value={glassCard}>
              <Card style={styles.card}>
                <Image
                  source={logo}
                  style={styles.logo}
                  resizeMode="contain"
                  accessibilityLabel="ConvergeIT"
                />
                {heading ? (
                  <Typography
                    variant="boldLarge"
                    color={glassCard ? authOnGlassText.primary : undefined}
                    style={styles.heading}
                  >
                    {heading}
                  </Typography>
                ) : null}
                {subheading ? (
                  <Typography
                    variant="medium"
                    muted={!glassCard}
                    color={glassCard ? authOnGlassText.secondary : undefined}
                    style={styles.subheading}
                  >
                    {subheading}
                  </Typography>
                ) : null}
                <View style={[styles.slot, { gap: theme.spacing.lg }]}>{children}</View>
              </Card>
            </AuthOnGlassContext.Provider>
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
