import { ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { AppCard, Button, PermissionDeniedPanel, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { useAuth } from "@/lib/auth";
import { OP } from "@/lib/permissions/operational-keys";
import { useChatApiGates } from "@/lib/permissions/use-chat-api-gates";
import { ChatLivePageHeader, ChatLivePageShell } from "@/features/chat-shared";
import { WidgetDeployStatusCard } from "./WidgetDeployStatusCard";
import { WidgetPublishStatusChip } from "./WidgetPublishStatusChip";
import { useWidgetAdminLifecycle } from "../hooks/useWidgetAdminLifecycle";

export type ChatWidgetDetailVariant = "view" | "manage";

export function ChatWidgetDetailClient({
  widgetKey,
  variant = "view",
}: {
  widgetKey: string;
  variant?: ChatWidgetDetailVariant;
}) {
  const router = useRouter();
  const { hasOperational, permissionsSyncing } = useAuth();
  const gates = useChatApiGates();
  const canEdit = hasOperational(OP.chatWidget.update) && variant === "manage";
  const lifecycle = useWidgetAdminLifecycle(widgetKey);

  if (permissionsSyncing) {
    return (
      <View style={styles.center}>
        <Typography variant="medium" muted>
          Loading permissions…
        </Typography>
      </View>
    );
  }

  if (!gates.widgetSettings) {
    return (
      <View style={styles.center}>
        <PermissionDeniedPanel title="Widget not available" description="Requires chat-widget permissions." />
      </View>
    );
  }

  const websiteLabel = lifecycle.meta?.websiteId?.slice(0, 8) ?? widgetKey;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <ChatLivePageShell>
        <ChatLivePageHeader title={websiteLabel} subtitle={`Widget key ${widgetKey}`} navPreset="configure" />
        <AppCard style={styles.card}>
          {lifecycle.loading ? (
            <Typography variant="small" muted>
              Loading widget…
            </Typography>
          ) : lifecycle.error ? (
            <Typography variant="small" style={{ color: tokens.colors.danger }}>
              {lifecycle.error}
            </Typography>
          ) : (
            <>
              <WidgetPublishStatusChip label={lifecycle.statusLabel ?? "—"} isLive={lifecycle.isLive} />
              <WidgetDeployStatusCard meta={lifecycle.meta} />
              {canEdit ? (
                <View style={styles.actions}>
                  <Button variant="primary" disabled={lifecycle.busy} onPress={() => void lifecycle.publishLatest()}>
                    Go live
                  </Button>
                  <Button variant="secondary" disabled={lifecycle.busy} onPress={() => void lifecycle.unpublishLatest()}>
                    Take offline
                  </Button>
                  <Button
                    variant="secondary"
                    onPress={() =>
                      router.push(`/(dashboard)/chat-widget/${encodeURIComponent(widgetKey)}/edit` as Href)
                    }
                  >
                    Edit configuration
                  </Button>
                </View>
              ) : null}
            </>
          )}
        </AppCard>
      </ChatLivePageShell>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", padding: tokens.space.lg },
  card: { gap: tokens.space.md },
  actions: { gap: tokens.space.sm },
});
