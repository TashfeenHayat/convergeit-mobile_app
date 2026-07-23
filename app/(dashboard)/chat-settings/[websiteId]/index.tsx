import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppCard, PermissionDeniedPanel, Typography } from '@/components/ui';
import { tokens } from '@/theme/tokens';
import { useAuth } from '@/lib/auth';
import { useChatApiGates } from '@/lib/permissions/use-chat-api-gates';
import { ChatLivePageHeader, ChatLivePageShell } from '@/features/chat-shared';
import { useWebsiteChatSettingsQuery } from '@/features/chat-settings/hooks/useChatSettings';

export function ChatSettingsWebsiteWorkspace({ websiteId }: { websiteId: string }) {
  const { permissionsSyncing } = useAuth();
  const gates = useChatApiGates();
  const settingsQuery = useWebsiteChatSettingsQuery(websiteId, gates.widgetSettings);

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
        <PermissionDeniedPanel title="Website settings not available" description="Requires chat-widget permissions." />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      <ChatLivePageShell>
        <ChatLivePageHeader title="Website chat settings" subtitle={websiteId} navPreset="configure" />
        <AppCard style={styles.card}>
          {settingsQuery.isLoading ? (
            <Typography variant="small" muted>
              Loading settings…
            </Typography>
          ) : settingsQuery.isError ? (
            <Typography variant="small" style={{ color: tokens.colors.danger }}>
              Could not load settings for this website.
            </Typography>
          ) : (
            <Typography variant="small" muted>
              Routing, QA roster, close policy, and email tabs are available on web. Mobile loads the settings bundle for {websiteId.slice(0, 8)}…
            </Typography>
          )}
        </AppCard>
      </ChatLivePageShell>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: tokens.space.lg },
  card: { gap: tokens.space.md },
});

export default function Screen() {
  const params = useLocalSearchParams<{ websiteId?: string }>();
  const websiteId = String(params.websiteId ?? '').trim();
  if (!websiteId) return null;
  return <ChatSettingsWebsiteWorkspace websiteId={websiteId} />;
}
