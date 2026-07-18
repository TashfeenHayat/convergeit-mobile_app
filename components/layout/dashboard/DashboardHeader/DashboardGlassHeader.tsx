import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { usePathname, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { ParamListBase } from '@react-navigation/native';

import {
  isDashboardHomePath,
  dashboardHeaderBodyHeight,
} from '@/components/layout/dashboard/dashboard-header.utils';
import { NotificationsBellDrawer } from '@/components/notifications/NotificationsBellDrawer';
import { LiquidGlass, Typography } from '@/components/ui';
import { webHrefToMobile } from '@/constants/navigation';
import { glassUi } from '@/lib/theme/glass-ui';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/theme';

import {
  dashboardDisplayName,
  dashboardUserInitials,
} from './dashboard-header.labels';
import { DashboardProfileMenu } from './DashboardProfileMenu';

export function useDashboardHeaderOffset(extra = 0): number {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  return insets.top + dashboardHeaderBodyHeight(pathname) + extra;
}

export type DashboardGlassHeaderProps = {
  navigation: DrawerNavigationProp<ParamListBase>;
  options: { title?: string };
};

/**
 * Floating glass header — matches frosted pill chrome (menu + title, search).
 */
export function DashboardGlassHeader({ navigation, options }: DashboardGlassHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const displayName = useMemo(() => dashboardDisplayName(user), [user]);
  const initials = useMemo(() => dashboardUserInitials(displayName), [displayName]);
  const title = typeof options.title === 'string' ? options.title : 'Dashboard';
  const pathname = usePathname();
  const showGlobalSearch = isDashboardHomePath(pathname);
  const iconColor = theme.app.text.primary;
  const mutedColor = theme.app.text.secondary;

  return (
    <>
      <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
        <View style={styles.row}>
          <LiquidGlass
            intensity="strong"
            radius={glassUi.radius.pill}
            elevated
            style={styles.titlePill}
            contentStyle={styles.titlePillInner}
          >
            <Pressable
              onPress={() => navigation.openDrawer()}
              style={({ pressed }) => [styles.menuHit, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Open menu"
              hitSlop={8}
            >
              <Ionicons name="menu" size={22} color={iconColor} />
            </Pressable>
            <Typography variant="medium16" numberOfLines={1} style={styles.title}>
              {title}
            </Typography>
          </LiquidGlass>

          <View style={styles.actions}>
            <LiquidGlass
              intensity="medium"
              radius={glassUi.radius.pill}
              elevated
              contentStyle={styles.actionGlass}
            >
              <NotificationsBellDrawer />
            </LiquidGlass>
            <Pressable
              onPress={() => setProfileOpen(true)}
              style={({ pressed }) => [pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Open account menu"
            >
              <LiquidGlass intensity="medium" radius={glassUi.radius.pill} elevated contentStyle={styles.avatarGlass}>
                <View style={[styles.avatar, { backgroundColor: `${theme.app.dashboard.accentBlue}73` }]}>
                  <Typography variant="small" style={styles.avatarText}>
                    {initials}
                  </Typography>
                  <View style={styles.onlineDot} />
                </View>
              </LiquidGlass>
            </Pressable>
          </View>
        </View>

        {showGlobalSearch ? (
          <Pressable
            onPress={() => router.push(webHrefToMobile('/dashboard/chat-operations') as Href)}
            accessibilityRole="button"
            accessibilityLabel="Search"
          >
            <LiquidGlass
              intensity="strong"
              radius={glassUi.radius.pill}
              elevated
              style={styles.searchPill}
              contentStyle={styles.searchInner}
            >
              <Ionicons name="search" size={18} color={mutedColor} />
              <Typography variant="medium" muted style={styles.searchText}>
                Search anything...
              </Typography>
            </LiquidGlass>
          </Pressable>
        ) : null}
      </View>

      <DashboardProfileMenu
        visible={profileOpen}
        onClose={() => setProfileOpen(false)}
        displayName={displayName}
        email={user?.email}
        initials={initials}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
    gap: 10,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titlePill: {
    flex: 1,
    minWidth: 0,
  },
  titlePillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 14,
    paddingRight: 18,
    paddingVertical: 12,
    minHeight: 48,
  },
  menuHit: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontWeight: '700',
    letterSpacing: -0.2,
    fontSize: 17,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionGlass: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlass: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarText: {
    fontWeight: '800',
    color: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: 'rgba(20,24,48,0.9)',
  },
  searchPill: {
    alignSelf: 'stretch',
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    minHeight: 48,
  },
  searchText: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.88,
  },
});
