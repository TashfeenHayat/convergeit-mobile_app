import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, usePathname, useRouter, type Href } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { Pressable, ScrollView, StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgentDashboardProviders } from '@/components/notifications/AgentDashboardProviders';
import { DashboardChromeProvider } from '@/components/layout/DashboardChromeContext';
import { DashboardGlassHeader } from '@/components/layout/dashboard/DashboardHeader/DashboardGlassHeader';
import { LiquidGlass, Typography } from '@/components/ui';
import { SplashScreen } from '@/components/ui/SplashScreen';
import { AUTH_PATHS, mobilePathToWeb, webHrefToMobile } from '@/constants/navigation';
import { titleForHref } from '@/constants/web-route-registry';
import { glassUi } from '@/lib/theme/glass-ui';
import { useAuth } from '@/lib/auth';
import { useDashboardSidebarNavItems } from '@/lib/hooks/useDashboardSidebarNavItems';
import type { DashboardNavItem, DashboardSidebarIconKey } from '@/lib/permissions/dashboard-nav.types';
import { tokens } from '@/theme';

const iconMap: Record<DashboardSidebarIconKey, ComponentProps<typeof FontAwesome>['name']> = {
  accountSetup: 'wrench',
  billing: 'credit-card',
  chat: 'comments',
  chatWidget: 'comment',
  aiTraining: 'magic',
  clients: 'building',
  'Reseller-Management': 'briefcase',
  crmIntegration: 'plug',
  dashboard: 'home',
  departments: 'sitemap',
  designations: 'id-badge',
  distributionSetup: 'share-alt',
  hrms: 'calendar',
  ipBlocklist: 'ban',
  licenses: 'key',
  leave: 'plane',
  pools: 'users',
  reports: 'file-text',
  resellers: 'briefcase',
  roles: 'shield',
  settings: 'cog',
  shifts: 'clock-o',
  profile: 'user',
  theme: 'paint-brush',
  smtpEmail: 'envelope',
  socialMedia: 'share-alt',
  users: 'user',
  websiteAssignments: 'globe',
};

function isNavActive(pathname: string, item: DashboardNavItem): boolean {
  const webPath = mobilePathToWeb(pathname);
  const href = item.href.replace(/\/+$/, '');
  if (webPath === href) return true;
  if (item.pathIncludes && webPath.includes(item.pathIncludes)) return true;
  if (item.prefixMatch) {
    if (item.pathExcludes?.some((ex) => webPath.includes(ex))) return false;
    return webPath === href || webPath.startsWith(`${href}/`);
  }
  return false;
}

function NavRow({
  item,
  depth,
  pathname,
  expanded,
  onToggle,
  onNavigate,
}: {
  item: DashboardNavItem;
  depth: number;
  pathname: string;
  expanded: Set<string>;
  onToggle: (key: string) => void;
  onNavigate: (href: string) => void;
}) {
  const hasChildren = Boolean(item.children?.length);
  const key = item.href;
  const open = expanded.has(key);
  const active = isNavActive(pathname, item);
  const childActive = item.children?.some((c) => isNavActive(pathname, c)) ?? false;
  const highlight = active || (hasChildren && childActive && !open);

  const rowContent = (
    <>
      <View style={[styles.navIconWrap, highlight && styles.navIconWrapActive]}>
        <FontAwesome
          name={iconMap[item.iconKey] ?? 'circle'}
          size={depth === 0 ? 15 : 13}
          color={highlight ? '#FFFFFF' : 'rgba(255,255,255,0.72)'}
        />
      </View>
      <Typography
        variant={depth === 0 ? 'medium' : 'small'}
        color={highlight ? tokens.colors.textPrimary : tokens.colors.textSecondary}
        style={[styles.navLabel, highlight && { fontWeight: '700' }]}
        numberOfLines={1}
      >
        {item.label}
      </Typography>
      {hasChildren ? (
        <Ionicons
          name={open ? 'chevron-down' : 'chevron-forward'}
          size={14}
          color="rgba(255,255,255,0.45)"
        />
      ) : null}
    </>
  );

  return (
    <View>
      <Pressable
        onPress={() => {
          if (hasChildren) {
            onToggle(key);
            onNavigate(webHrefToMobile(item.href));
            return;
          }
          onNavigate(webHrefToMobile(item.href));
        }}
        style={({ pressed }) => [pressed && styles.navPressed]}
      >
        <View
          style={[
            styles.navItem,
            { paddingLeft: 14 + depth * 14 },
            highlight && styles.navItemActive,
          ]}
        >
          {rowContent}
        </View>
      </Pressable>
      {hasChildren && open
        ? item.children!.map((child) => (
            <NavRow
              key={child.href + child.label}
              item={child}
              depth={depth + 1}
              pathname={pathname}
              expanded={expanded}
              onToggle={onToggle}
              onNavigate={onNavigate}
            />
          ))
        : null}
    </View>
  );
}

function CustomDrawerContent({ navigation }: DrawerContentComponentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const activityItems = useDashboardSidebarNavItems();
  const navItems = activityItems;

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const item of navItems) {
        if (item.children?.some((c) => isNavActive(pathname, c)) && !next.has(item.href)) {
          next.add(item.href);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [navItems, pathname]);

  const onToggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const onNavigate = (href: string) => {
    navigation.closeDrawer();
    router.push(href as Href);
  };

  const onLogout = async () => {
    await logout();
    router.replace(AUTH_PATHS.login);
  };

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Account';
  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    'U';

  return (
    <View style={[styles.drawer, { paddingTop: Math.max(insets.top, 12) }]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={72} tint="dark" style={StyleSheet.absoluteFillObject} />
      ) : null}
      <LinearGradient colors={[...glassUi.gradient.sidebar]} style={StyleSheet.absoluteFillObject} />
      <LinearGradient
        colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.03)', 'transparent']}
        locations={[0, 0.28, 0.7]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View pointerEvents="none" style={styles.drawerEdge} />

      <View style={styles.profileHeader}>
        <View style={styles.profileLeft}>
          <LiquidGlass intensity="medium" radius={glassUi.radius.pill} elevated contentStyle={styles.avatarGlass}>
            <View style={styles.avatar}>
              <Typography variant="medium16" style={{ fontWeight: '700' }}>
                {initials}
              </Typography>
              <View style={styles.statusDot} />
            </View>
          </LiquidGlass>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography variant="medium16" style={{ fontWeight: '700' }} numberOfLines={1}>
              {displayName}
            </Typography>
            {user?.email ? (
              <Typography variant="small" muted numberOfLines={1}>
                {user.email}
              </Typography>
            ) : null}
          </View>
        </View>
        <Pressable
          onPress={() => navigation.closeDrawer()}
          style={({ pressed }) => [pressed && styles.navPressed]}
          accessibilityLabel="Close menu"
        >
          <LiquidGlass intensity="subtle" radius={12} elevated contentStyle={styles.closeBtn}>
            <Ionicons name="close" size={20} color={tokens.colors.textPrimary} />
          </LiquidGlass>
        </Pressable>
      </View>

      <LiquidGlass intensity="subtle" radius={glassUi.radius.md} elevated style={styles.workspaceCard} contentStyle={styles.workspaceInner}>
        <Ionicons name="business-outline" size={16} color="#A78BFA" />
        <Typography variant="medium" style={{ flex: 1, fontWeight: '600' }} numberOfLines={1}>
          ConvergeIT Workspace
        </Typography>
        <Ionicons name="chevron-down" size={16} color={tokens.colors.textMuted} />
      </LiquidGlass>

      <LiquidGlass intensity="medium" radius={glassUi.radius.lg} elevated style={styles.menuShell} contentStyle={styles.menuShellInner}>
        <Typography variant="small" muted style={styles.menuLabel}>
          MENU
        </Typography>

        <ScrollView
          style={styles.navList}
          contentContainerStyle={styles.navListContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {navItems.length === 0 ? (
            <Typography variant="small" muted style={styles.emptyMenu}>
              No modules available for your role yet.
            </Typography>
          ) : (
            navItems.map((item) => (
              <NavRow
                key={item.href + item.label}
                item={item}
                depth={0}
                pathname={pathname}
                expanded={expanded}
                onToggle={onToggle}
                onNavigate={onNavigate}
              />
            ))
          )}
        </ScrollView>
      </LiquidGlass>

      <Pressable onPress={onLogout} style={({ pressed }) => [styles.logout, pressed && styles.navPressed]}>
        <LiquidGlass intensity="subtle" radius={glassUi.radius.md} elevated contentStyle={styles.logoutInner}>
          <Ionicons name="log-out-outline" size={18} color="#F87171" />
          <Typography variant="medium" style={{ fontWeight: '600', color: '#F87171' }}>
            Log out
          </Typography>
        </LiquidGlass>
      </Pressable>
    </View>
  );
}

function titleFromRouteName(name: string): string {
  if (name === 'home') return 'Dashboard';
  const href = `/${name.replace(/\/index$/, '')}`;
  return (
    titleForHref(href) ??
    name
      .split('/')
      .filter((p) => !p.startsWith('['))
      .pop()
      ?.replace(/-/g, ' ') ??
    'ConvergeIT'
  );
}

export default function DashboardLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen message="Restoring session…" />;
  }

  if (!isAuthenticated) {
    return <Redirect href={AUTH_PATHS.login} />;
  }

  return (
    <AgentDashboardProviders>
      <DashboardChromeProvider>
        <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={({ route, navigation }) => ({
        header: (props) => <DashboardGlassHeader navigation={navigation} options={props.options} />,
        headerTransparent: true,
        headerStyle: {
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: tokens.colors.textPrimary,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        drawerStyle: {
          backgroundColor: 'transparent',
          width: 312,
        },
        drawerType: 'front',
        overlayColor: 'rgba(6, 8, 22, 0.38)',
        drawerItemStyle: { display: 'none' },
        title: titleFromRouteName(route.name),
      })}
        />
      </DashboardChromeProvider>
    </AgentDashboardProviders>
  );
}

const styles = StyleSheet.create({
  drawer: {
    flex: 1,
    paddingBottom: 12,
    paddingHorizontal: 12,
    overflow: 'hidden',
    borderRightWidth: StyleSheet.hairlineWidth * 2,
    borderRightColor: 'rgba(255,255,255,0.22)',
    backgroundColor: '#12142a',
  },
  drawerEdge: {
    ...StyleSheet.absoluteFillObject,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.16)',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginHorizontal: 4,
    marginBottom: 12,
    marginTop: 4,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workspaceCard: {
    marginHorizontal: 4,
    marginBottom: 12,
  },
  workspaceInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  avatarGlass: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(110, 142, 251, 0.38)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  statusDot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#141833',
  },
  menuShell: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 10,
  },
  menuShellInner: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: 8,
  },
  menuLabel: {
    marginBottom: 8,
    marginHorizontal: 14,
    letterSpacing: 1.4,
    fontWeight: '700',
    fontSize: 11,
  },
  navList: {
    flex: 1,
  },
  navListContent: {
    paddingHorizontal: 8,
    paddingBottom: 16,
    gap: 4,
    flexGrow: 1,
  },
  emptyMenu: {
    marginHorizontal: 10,
    marginTop: 8,
    lineHeight: 18,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingRight: 12,
    borderRadius: 14,
  },
  navItemActive: {
    backgroundColor: glassUi.fill.activeNav,
    borderWidth: 1,
    borderColor: glassUi.border.subtle,
  },
  navIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  navIconWrapActive: {
    backgroundColor: 'rgba(110, 142, 251, 0.55)',
  },
  navLabel: {
    flex: 1,
  },
  navPressed: {
    opacity: 0.88,
  },
  logout: {
    marginHorizontal: 4,
    marginTop: 2,
  },
  logoutInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
});
