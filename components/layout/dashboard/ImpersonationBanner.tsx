import { Pressable, StyleSheet, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { Typography } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import {
  getImpersonationSession,
  isImpersonatingSessionActive,
  clearImpersonationSession,
} from "@/lib/auth/impersonation-session";
import { tokens } from "@/theme/tokens";

/**
 * Shown while login-as metadata is active.
 * Exit clears impersonation metadata and signs out (full token restore lands with AuthProvider parity).
 */
export function ImpersonationBanner() {
  const { user, logout } = useAuth();
  const isImpersonating = isImpersonatingSessionActive();

  if (!isImpersonating) return null;

  const session = getImpersonationSession();
  const displayName =
    dashboardNameFromUser(user) ||
    session?.impersonatedUser?.displayName?.trim() ||
    user?.email?.trim() ||
    session?.impersonatedUser?.email?.trim() ||
    "this user";
  const actorLabel =
    session?.actorUser?.displayName?.trim() || session?.actorUser?.email?.trim() || null;

  const handleExit = () => {
    clearImpersonationSession();
    void logout();
  };

  return (
    <View style={styles.banner} accessibilityRole="summary">
      <View style={styles.copy}>
        <FontAwesome name="exclamation-triangle" size={16} color="#ffc107" />
        <Typography variant="small" style={styles.text}>
          Login as {displayName}
          {actorLabel ? ` (your admin: ${actorLabel})` : ""}. Actions apply to this account.
        </Typography>
      </View>
      <Pressable onPress={handleExit} style={styles.exitBtn} accessibilityRole="button">
        <Typography variant="small" style={styles.exitLabel}>
          Exit login as
        </Typography>
      </Pressable>
    </View>
  );
}

function dashboardNameFromUser(
  user: { firstName?: string; lastName?: string; email?: string } | null,
): string {
  if (!user) return "";
  const parts = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return parts || user.email?.trim() || "";
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: tokens.space.md,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.sm,
    marginVertical: tokens.space.sm,
    borderRadius: tokens.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,193,7,0.45)",
    backgroundColor: "rgba(255,193,7,0.12)",
  },
  copy: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
    flex: 1,
    minWidth: 0,
  },
  text: {
    flex: 1,
    color: "#fff",
  },
  exitBtn: {
    paddingHorizontal: tokens.space.md,
    paddingVertical: 6,
    borderRadius: tokens.radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
  },
  exitLabel: {
    color: "#fff",
    fontWeight: "600",
  },
});
