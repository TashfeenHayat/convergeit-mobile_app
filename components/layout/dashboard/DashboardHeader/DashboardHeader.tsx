import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { NotificationsBellDrawer } from "@/components/notifications/NotificationsBellDrawer";
import { Typography } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { tokens } from "@/theme/tokens";

import {
  dashboardDisplayName,
  dashboardFirstWord,
  dashboardRoleLabel,
  dashboardUserInitials,
} from "./dashboard-header.labels";
import { DashboardHeaderCheckInButton } from "./DashboardHeaderCheckInButton";
import { SubscriptionCountdownChip } from "@/components/layout/dashboard/SubscriptionCountdownChip";

export type DashboardHeaderProps = {
  /** Optional menu control — mobile drawer already lives in `app/(dashboard)/_layout.tsx`. */
  onMenuClick?: () => void;
};

/**
 * Compact dashboard header for mobile (welcome + actions).
 * Nav drawer is owned by the Expo Router layout — no hamburger here by default.
 */
export default function DashboardHeader(_props: DashboardHeaderProps) {
  const { user } = useAuth();

  const displayName = useMemo(() => dashboardDisplayName(user), [user]);
  const initials = useMemo(() => dashboardUserInitials(displayName), [displayName]);
  const roleLabel = useMemo(() => dashboardRoleLabel(user), [user]);
  const welcomeName = useMemo(() => dashboardFirstWord(displayName), [displayName]);

  return (
    <View style={styles.header} accessibilityRole="header">
      <View style={styles.welcomeCol}>
        <Typography variant="small" color={tokens.colors.textMuted}>
          Dashboard
        </Typography>
        <Typography variant="medium16" numberOfLines={1} style={styles.welcome}>
          Welcome back, {welcomeName}
        </Typography>
      </View>

      <View style={styles.actions}>
        <SubscriptionCountdownChip />
        <DashboardHeaderCheckInButton />
        <NotificationsBellDrawer />
        <Pressable style={styles.avatar} accessibilityLabel={`${displayName}, ${roleLabel}`}>
          <Typography variant="small" style={styles.avatarText}>
            {initials}
          </Typography>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.md,
    backgroundColor: tokens.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.overlayBorder,
  },
  welcomeCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  welcome: {
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
    flexShrink: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: tokens.colors.accentBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontWeight: "700",
    color: "#fff",
  },
});
