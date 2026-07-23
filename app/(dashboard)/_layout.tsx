import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, usePathname, useRouter, type Href } from "expo-router";
import { Drawer } from "expo-router/drawer";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DashboardChromeProvider } from "@/components/layout/DashboardChromeContext";
import { DashboardGlassHeader } from "@/components/layout/dashboard/DashboardHeader/DashboardGlassHeader";
import { AgentDashboardProviders } from "@/components/notifications/AgentDashboardProviders";
import { LiquidGlass, Typography } from "@/components/ui";
import { SplashScreen } from "@/components/ui/SplashScreen";
import {
    AUTH_PATHS,
    mobilePathToWeb,
    webHrefToMobile,
} from "@/constants/navigation";
import { titleForHref } from "@/constants/web-route-registry";
import { useAuth } from "@/lib/auth";
import { useDashboardSidebarNavItems } from "@/lib/hooks/useDashboardSidebarNavItems";
import type {
    DashboardNavItem,
    DashboardSidebarIconKey,
} from "@/lib/permissions/dashboard-nav.types";
import { glassUi } from "@/lib/theme/glass-ui";
import { hexAlpha } from "@/lib/theme/use-theme-colors";
import { useAppTheme } from "@/theme";

const iconMap: Record<
  DashboardSidebarIconKey,
  ComponentProps<typeof FontAwesome>["name"]
> = {
  accountSetup: "wrench",
  billing: "credit-card",
  chat: "comments",
  chatWidget: "comment",
  aiTraining: "magic",
  clients: "building",
  "Reseller-Management": "briefcase",
  crmIntegration: "plug",
  dashboard: "home",
  departments: "sitemap",
  designations: "id-badge",
  distributionSetup: "share-alt",
  hrms: "calendar",
  ipBlocklist: "ban",
  licenses: "key",
  leave: "plane",
  pools: "users",
  reports: "file-text",
  resellers: "briefcase",
  roles: "shield",
  settings: "cog",
  shifts: "clock-o",
  profile: "user",
  theme: "paint-brush",
  smtpEmail: "envelope",
  socialMedia: "share-alt",
  users: "user",
  websiteAssignments: "globe",
};

function isNavActive(pathname: string, item: DashboardNavItem): boolean {
  const webPath = mobilePathToWeb(pathname);
  const href = item.href.replace(/\/+$/, "");
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
  const theme = useAppTheme();
  const isLight = theme.paletteMode === "light";
  const accent = theme.app.dashboard.accentBlue;
  const textPrimary = theme.app.text.primary;
  const textMuted = theme.app.dashboard.textMuted;
  const iconMuted = isLight
    ? theme.app.dashboard.iconMuted
    : (theme.app.dashboard.sidebarNavIconMuted ??
      theme.app.dashboard.iconMuted);
  /** Web `navItemSx`: alpha(primary, dark 0.22 / light 0.14) */
  const navActiveBg = hexAlpha(accent, isLight ? 0.14 : 0.22);

  const hasChildren = Boolean(item.children?.length);
  const key = item.href;
  const open = expanded.has(key);
  const active = isNavActive(pathname, item);
  const childActive =
    item.children?.some((c) => isNavActive(pathname, c)) ?? false;
  /** Parent groups only show selected chrome when collapsed (child route active). */
  const highlight = hasChildren ? childActive && !open : active;

  const iconColor = highlight ? accent : iconMuted;
  const labelColor = highlight ? textPrimary : textMuted;
  const chevronColor = isLight
    ? "rgba(15, 23, 42, 0.45)"
    : "rgba(255,255,255,0.45)";

  const rowContent = (
    <>
      <View
        style={[
          styles.navIconWrap,
          {
            backgroundColor: highlight
              ? hexAlpha(accent, isLight ? 0.15 : 0.25)
              : isLight
                ? "rgba(15, 23, 42, 0.06)"
                : "rgba(255,255,255,0.08)",
          },
        ]}
      >
        <FontAwesome
          name={iconMap[item.iconKey] ?? "circle"}
          size={depth === 0 ? 15 : 13}
          color={iconColor}
 />
      </View>
      <Typography
        variant={depth === 0 ? "medium" : "small"}
        color={labelColor}
        style={[styles.navLabel, highlight && { fontWeight: "700" }]}
        numberOfLines={1}
      >
        {item.label}
      </Typography>
      {hasChildren ? (
        <Ionicons
          name={open ? "chevron-down" : "chevron-forward"}
          size={14}
          color={chevronColor}
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
            highlight && {
              backgroundColor: navActiveBg,
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderTopRightRadius: 22,
              borderBottomRightRadius: 22,
              marginLeft: 2,
            },
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
  const theme = useAppTheme();
  const { user, logout } = useAuth();
  const activityItems = useDashboardSidebarNavItems();
  const navItems = activityItems;

  const isLight = theme.paletteMode === "light";
  const sidebarBg = theme.app.dashboard.sidebarBg;
  const accent = theme.app.dashboard.accentBlue;
  const textPrimary = theme.app.text.primary;
  const textMuted = theme.app.dashboard.textMuted;
  const edgeBorder = isLight
    ? "rgba(15, 23, 42, 0.10)"
    : "rgba(255,255,255,0.10)";
  const statusDotBorder = sidebarBg;
  /**
   * Web `sidebarInnerSx`:
   * backgroundColor rgba(8,12,22,0.34) + linear-gradient(white sheen) over sidebarBg
   */
  const sidebarBase = isLight
    ? "rgba(255, 255, 255, 0.3)"
    : "rgba(8, 12, 22, 0.34)";
  const sheenColors = isLight
    ? ([
        "rgba(255,255,255,0.55)",
        "rgba(255,255,255,0.18)",
        "transparent",
      ] as const)
    : ([
        "rgba(255,255,255,0.12)",
        "rgba(255,255,255,0.02)",
        "transparent",
      ] as const);

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const item of navItems) {
        if (
          item.children?.some((c) => isNavActive(pathname, c)) &&
          !next.has(item.href)
        ) {
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
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Account";
  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <View
      style={[
        styles.drawer,
        {
          paddingTop: Math.max(insets.top, 12),
          backgroundColor: sidebarBg,
          borderRightColor: edgeBorder,
        },
      ]}
    >
      {Platform.OS === "ios" ? (
        <BlurView
          intensity={isLight ? 48 : 72}
          tint={isLight ? "light" : "dark"}
          style={StyleSheet.absoluteFillObject}
 />
      ) : null}
      {/* Web: rgba glass base over sidebarBg */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: sidebarBase },
        ]}
 />
      <LinearGradient
        colors={[...sheenColors]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
 />
      <View
        pointerEvents="none"
        style={[styles.drawerEdge, { borderRightColor: edgeBorder }]}
 />

      <View style={styles.profileHeader}>
        <View style={styles.profileLeft}>
          <LiquidGlass
            intensity="medium"
            radius={glassUi.radius.pill}
            elevated
            contentStyle={styles.avatarGlass}
          >
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: `${accent}${isLight ? "38" : "60"}`,
                  borderColor: isLight
                    ? "rgba(15, 23, 42, 0.12)"
                    : "rgba(255,255,255,0.28)",
                },
              ]}
            >
              <Typography
                variant="medium16"
                color={textPrimary}
                style={{ fontWeight: "700" }}
              >
                {initials}
              </Typography>
              <View
                style={[styles.statusDot, { borderColor: statusDotBorder }]}
 />
            </View>
          </LiquidGlass>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="medium16"
              color={textPrimary}
              style={{ fontWeight: "700" }}
              numberOfLines={1}
            >
              {displayName}
            </Typography>
            {user?.email ? (
              <Typography variant="small" color={textMuted} numberOfLines={1}>
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
          <LiquidGlass
            intensity="subtle"
            radius={12}
            elevated
            contentStyle={styles.closeBtn}
          >
            <Ionicons name="close" size={20} color={textPrimary} />
          </LiquidGlass>
        </Pressable>
      </View>

      <LiquidGlass
        intensity="subtle"
        radius={glassUi.radius.md}
        elevated
        style={styles.workspaceCard}
        contentStyle={styles.workspaceInner}
      >
        <Ionicons name="business-outline" size={16} color={accent} />
        <Typography
          variant="medium"
          color={textPrimary}
          style={{ flex: 1, fontWeight: "600" }}
          numberOfLines={1}
        >
          ConvergeIT Workspace
        </Typography>
        <Ionicons name="chevron-down" size={16} color={textMuted} />
      </LiquidGlass>

      <LiquidGlass
        intensity="medium"
        radius={glassUi.radius.lg}
        elevated
        style={styles.menuShell}
        contentStyle={styles.menuShellInner}
      >
        <Typography variant="small" color={textMuted} style={styles.menuLabel}>
          ACTIVITY
        </Typography>

        <ScrollView
          style={styles.navList}
          contentContainerStyle={styles.navListContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {navItems.length === 0 ? (
            <Typography
              variant="small"
              color={textMuted}
              style={styles.emptyMenu}
            >
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

      <Pressable
        onPress={onLogout}
        style={({ pressed }) => [styles.logout, pressed && styles.navPressed]}
      >
        <LiquidGlass
          intensity="subtle"
          radius={glassUi.radius.md}
          elevated
          contentStyle={styles.logoutInner}
        >
          <Ionicons name="log-out-outline" size={18} color="#F87171" />
          <Typography
            variant="medium"
            style={{ fontWeight: "600", color: "#F87171" }}
          >
            Log out
          </Typography>
        </LiquidGlass>
      </Pressable>
    </View>
  );
}

function titleFromRouteName(name: string): string {
  if (name === "home") return "Dashboard";
  const href = `/${name.replace(/\/index$/, "")}`;
  return (
    titleForHref(href) ??
    name
      .split("/")
      .filter((p) => !p.startsWith("["))
      .pop()
      ?.replace(/-/g, " ") ??
    "ConvergeIT"
  );
}

export default function DashboardLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const theme = useAppTheme();
  const isLight = theme.paletteMode === "light";

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
            header: (props) => (
              <DashboardGlassHeader
                navigation={navigation}
                options={props.options}
 />
            ),
            headerTransparent: true,
            headerStyle: {
              backgroundColor: "transparent",
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: theme.app.text.primary,
            headerTitleStyle: { fontWeight: "700", fontSize: 17 },
            drawerStyle: {
              backgroundColor: "transparent",
              width: 312,
            },
            drawerType: "front",
            overlayColor: isLight
              ? "rgba(15, 23, 42, 0.28)"
              : "rgba(6, 8, 22, 0.38)",
            drawerItemStyle: { display: "none" },
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
    overflow: "hidden",
    borderRightWidth: StyleSheet.hairlineWidth * 2,
  },
  drawerEdge: {
    ...StyleSheet.absoluteFillObject,
    borderRightWidth: 1,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginHorizontal: 4,
    marginBottom: 12,
    marginTop: 4,
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  workspaceCard: {
    marginHorizontal: 4,
    marginBottom: 12,
  },
  workspaceInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  avatarGlass: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  statusDot: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
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
    fontWeight: "700",
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
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    paddingRight: 12,
    borderRadius: 14,
  },
  navIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
});
