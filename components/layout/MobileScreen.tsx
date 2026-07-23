import type { ReactElement, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDashboardChromeInset } from '@/components/layout/DashboardChromeContext';
import { AppScrollView } from '@/components/ui/AppScroll';
import { useAppTheme } from '@/theme';

export type MobileScreenProps = {
  children: ReactNode;
  /** Scroll content (forms / long pages). Default true. */
  scroll?: boolean;
  /** Edge-to-edge without horizontal padding. */
  flush?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  keyboard?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
};

/**
 * Standard mobile screen chrome — safe area, optional scroll + keyboard avoid.
 * Horizontal inset is always `theme.spacing.screen` (8px) unless `flush`.
 * Vertical scrollbar is always hidden via AppScrollView defaults.
 */
export function MobileScreen({
  children,
  scroll = true,
  flush = false,
  style,
  contentStyle,
  keyboard = true,
  refreshControl,
}: MobileScreenProps) {
  const theme = useAppTheme();
  const dashboardInset = useDashboardChromeInset();
  const pad = flush ? 0 : theme.spacing.screen;
  const topInset = dashboardInset > 0 ? dashboardInset : theme.spacing.md;
  /** Web `appBackground` — never contentBgStops (those are chrome greys). */
  const g0 = theme.app.background.top;
  const g1 = theme.app.background.bottom;

  /** Applied last so horizontal gutter cannot drift per page. */
  const gutterStyle = {
    paddingHorizontal: pad,
    paddingTop: topInset,
  } as const;

  const body = scroll ? (
    <AppScrollView
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      contentContainerStyle={[
        styles.scrollContent,
        contentStyle,
        gutterStyle,
        { paddingBottom: theme.spacing.md },
      ]}
    >
      {children}
    </AppScrollView>
  ) : (
    <View style={[styles.flex, contentStyle, gutterStyle]}>{children}</View>
  );

  const wrapped = keyboard ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: g0 }, style]} edges={['bottom']}>
      <StatusBar style={theme.paletteMode === 'light' ? 'dark' : 'light'} />
      {/* Match web Discord: linear-gradient(180deg, #050508 → #0a0a2c) */}
      <LinearGradient
        colors={[g0, g1]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      {wrapped}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
});
