import type { ReactElement, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
 * Use inside drawer/stack screens for consistent padding on iOS & Android.
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

  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingHorizontal: pad, paddingBottom: theme.spacing.md },
        contentStyle,
        { paddingTop: topInset },
      ]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, paddingHorizontal: pad }, contentStyle, { paddingTop: topInset }]}>
      {children}
    </View>
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
    <SafeAreaView style={[styles.flex, style]} edges={['bottom']}>
      <StatusBar style={theme.paletteMode === 'light' ? 'dark' : 'light'} />
      <LinearGradient
        colors={[theme.app.background.top, theme.app.background.bottom]}
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
