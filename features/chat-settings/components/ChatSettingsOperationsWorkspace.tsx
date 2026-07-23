import { ScrollView, StyleSheet, View } from "react-native";
import { AppCard, PermissionDeniedPanel, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { useAuth } from "@/lib/auth";
import { useChatApiGates } from "@/lib/permissions/use-chat-api-gates";
import { ChatLivePageHeader, ChatLivePageShell, ChatScopeFiltersPanel, useChatScopeFilters } from "@/features/chat-shared";
import type { ClosePolicyListRow } from "@/services/chat/close-policy-list.types";
import { useClosePolicyListQuery } from "../hooks/useChatSettings";

export function ClosePolicyListTab() {
  const { permissionsSyncing } = useAuth();
  const gates = useChatApiGates();
  const scopeFilters = useChatScopeFilters(undefined, { apiEnabled: gates.widgetSettings });
  const listQuery = useClosePolicyListQuery(
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
      <Typography variant="medium" muted>
        Loading…
      </Typography>
    );
  }

  if (!gates.widgetSettings) {
    return <PermissionDeniedPanel title="Close policy not available" description="Requires chat-widget permissions." />;
  }

  const rows = (listQuery.data ?? []) as ClosePolicyListRow[];

  return (
    <View style={{ gap: tokens.space.sm }}>
      {listQuery.isLoading ? (
        <Typography variant="small" muted>
          Loading close policies…
        </Typography>
      ) : rows.length === 0 ? (
        <Typography variant="small" muted>
          No close policies in this scope.
        </Typography>
      ) : (
        rows.map((row) => (
          <View key={row.websiteId} style={styles.row}>
            <Typography variant="medium" style={{ fontWeight: "600" }} numberOfLines={1}>
              {row.websiteName || row.websiteUrl || row.websiteId.slice(0, 8)}
            </Typography>
            <Typography variant="small" muted numberOfLines={2}>
              {row.hasCustomSettings ? "Custom close policy" : "Default close policy"}
            </Typography>
          </View>
        ))
      )}
    </View>
  );
}

export function ChatSettingsOperationsWorkspace() {
  const { permissionsSyncing } = useAuth();
  const gates = useChatApiGates();
  const scopeFilters = useChatScopeFilters(undefined, { apiEnabled: gates.widgetSettings });

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
        <PermissionDeniedPanel title="Close policy not available" description="Requires chat-widget permissions." />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      <ChatLivePageShell>
        <ChatLivePageHeader title="Close Policy" subtitle="Distribution and close-out rules by website." navPreset="configure" />
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
          <ClosePolicyListTab />
        </AppCard>
      </ChatLivePageShell>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", padding: tokens.space.lg },
  card: { gap: tokens.space.md },
  row: {
    paddingVertical: tokens.space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.border,
  },
});
