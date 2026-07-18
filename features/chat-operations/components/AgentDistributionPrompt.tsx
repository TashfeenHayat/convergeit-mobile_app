import { StyleSheet, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { AgentWrapUpPayload } from "@/services/chat/wrap-up.types";
import { resolveDashboardHref } from "../utils/resolve-dashboard-href";

export function AgentDistributionPrompt({ payload, onDismiss }: { payload: AgentWrapUpPayload; onDismiss: () => void }) {
  const router = useRouter();
  const path =
    resolveDashboardHref(payload.distributionFormPath ?? "") ||
    `/dashboard/chat-operations/distribution?conversationId=${encodeURIComponent(payload.conversationId)}`;

  const visitorName = payload.visitorPresentation?.displayName || payload.visitorPresentation?.inboxTitle || "Visitor";

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Ionicons name="document-text-outline" size={22} color={tokens.colors.accentBlue} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography variant="mediumLarge" style={{ fontWeight: "700" }}>
              Distribute this chat
            </Typography>
            <Typography variant="small" muted numberOfLines={1}>
              {visitorName}
            </Typography>
          </View>
        </View>

        <View style={styles.body}>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
            <Ionicons name="sparkles-outline" size={16} color={tokens.colors.accentBlue} style={{ marginTop: 2 }} />
            <Typography variant="small" muted style={{ flex: 1, lineHeight: 18 }}>
              Chat closed — fields are prefilled from the conversation. Open the form to choose a department and send the transcript email.
            </Typography>
          </View>
          <View style={{ flexDirection: "row", gap: tokens.space.sm, flexWrap: "wrap" }}>
            <Button
              variant="primary"
              onPress={() => {
                router.push(path as Href);
                onDismiss();
              }}
            >
              Open distribution form
            </Button>
            <Button variant="secondary" onPress={onDismiss}>
              Later
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    borderRadius: tokens.radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(88, 101, 242, 0.35)",
    backgroundColor: tokens.colors.surfaceElevated,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.md,
    backgroundColor: "rgba(88, 101, 242, 0.12)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(88, 101, 242, 0.2)",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(88, 101, 242, 0.2)",
  },
  body: {
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.md,
  },
});
