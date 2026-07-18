import { ScrollView, StyleSheet, View } from "react-native";
import { AppCard, PermissionDeniedPanel, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { useAuth } from "@/lib/auth";
import { OP } from "@/lib/permissions/operational-keys";
import { useChatApiGates } from "@/lib/permissions/use-chat-api-gates";
import { publishAppToast } from "@/lib/notify";
import { extractApiErrorMessageForToast } from "@/lib/notify";
import { ChatLivePageHeader, ChatLivePageShell, ChatScopeFiltersPanel, useChatScopeFilters } from "@/features/chat-shared";
import { useCannedResponsesListQuery } from "../hooks/useCannedResponses";
import { CannedResponsesTab } from "./CannedResponsesTab";

export function ChatSettingsWorkspace() {
  const { hasOperational, permissionsSyncing } = useAuth();
  const gates = useChatApiGates();
  const canEdit = hasOperational(OP.chatWidget.update);
  const scopeFilters = useChatScopeFilters(undefined, { apiEnabled: gates.widgetSettings });

  const listQuery = useCannedResponsesListQuery(
    {
      resellerId: scopeFilters.canFilterByResellerId ? scopeFilters.filters.resellerId : undefined,
      parentCompanyId: scopeFilters.filters.parentCompanyId,
      childCompanyId: scopeFilters.filters.childCompanyId,
      websiteId: scopeFilters.filters.websiteId,
    },
    gates.widgetSettings,
  );

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
        <PermissionDeniedPanel
          title="Canned messages not available"
          description="Requires page:chat-widget and chat-widget:view or chat-widget:update."
        />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <ChatLivePageShell>
        <ChatLivePageHeader
          title="Canned Messages"
          subtitle="Quick replies agents insert from the inbox composer."
          navPreset="configure"
        />
        <AppCard style={styles.card}>
          <ChatScopeFiltersPanel
            compact
            filters={scopeFilters.filters}
            onPatch={scopeFilters.patchFilters}
            onReset={scopeFilters.resetFilters}
            canFilterByResellerId={scopeFilters.canFilterByResellerId}
            resellerOptions={scopeFilters.resellerOptions}
            parentCompanyOptions={scopeFilters.parentCompanyOptions}
            childCompanyOptions={scopeFilters.childCompanyOptions}
            websiteOptions={scopeFilters.websiteOptions}
          />
          <CannedResponsesTab
            rows={listQuery.data ?? []}
            loading={listQuery.isLoading}
            canEdit={canEdit}
            websiteOptions={scopeFilters.websiteOptions}
            onNotifyError={(e) =>
              publishAppToast({ message: extractApiErrorMessageForToast(e, "Request failed"), variant: "error" })
            }
            onNotifySuccess={(message) => publishAppToast({ message, variant: "success" })}
          />
        </AppCard>
      </ChatLivePageShell>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", padding: tokens.space.lg },
  card: { gap: tokens.space.md },
});
