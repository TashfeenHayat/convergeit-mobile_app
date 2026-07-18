import 'react-native-gesture-handler';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AppProviders } from '@/components/app-root/AppProviders';
import { SplashScreen } from '@/components/ui/SplashScreen';
import { useAppTheme } from '@/theme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

/** Match native splash + in-app splash — avoids white flash under the root view. */
const BOOT_BG = '#050508';

ExpoSplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (!loaded) return;
    // Hand off to in-app splash (same #050508) — no blank frame.
    void ExpoSplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) {
    return <SplashScreen message="Loading…" />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <AppProviders>
        <RootLayoutNav />
      </AppProviders>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const { paletteMode, app } = useAppTheme();

  const navTheme = {
    ...(paletteMode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(paletteMode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      primary: app.dashboard.accentBlue,
      background: app.background.bottom,
      card: app.dashboard.headerBg,
      text: app.text.primary,
      border: app.border.divider,
      notification: app.dashboard.accentOrange,
    },
  };

  return (
    <NavThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: app.background.bottom || BOOT_BG },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(dashboard)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true }} />
        <Stack.Screen
          name="storybook"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
      </Stack>
    </NavThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BOOT_BG,
  },
});
