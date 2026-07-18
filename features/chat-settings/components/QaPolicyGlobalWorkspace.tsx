import { ScrollView, StyleSheet, View } from "react-native";
import { AppCard, PermissionDeniedPanel, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { useAuth } from "@/lib/auth";
import { PAGE } from "@/lib/permissions/permission-constants";
import { OP } from "@/lib/permissions/operational-keys";
import { useChatApiGates } from "@/lib/permissions/use-chat-api-gates";
import { ChatLivePageHeader, ChatLivePageShell, ChatScopeFiltersPanel, useChatScopeFilters } from "@/features/chat-shared";

/** Mobile-simplified QA policy screen — edit full policy on web for complex rules. */
export function QaPolicyGlobalWorkspace() {
  const { hasPage, hasOperational, permissionsSyncing } = useAuth();
  const gates = useChatApiGates();
  const canView = gates.widgetSettings || hasOperational(OP.qa.chatAssign) || hasPage(PAGE.CHAT_QA_ROSTER);
  const scopeFilters = useChatScopeFilters(undefined, { apiEnabled: canView });

  if (permissionsSyncing) {
    return (
      <View style={styles.center}>
        <Typography variant="medium" muted>
          Loading permissions…
        </Typography>
      </View>
    );
  }

  if (!canView) {
    return (
      <View style={styles.center}>
        <PermissionDeniedPanel title="QA policy not available" description="Requires chat settings or QA assign permissions." />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <ChatLivePageShell>
        <ChatLivePageHeader title="QA Policy" subtitle="Global QA policy scoped by organization." navPreset="configure" />
        <AppCard style={styles.card}>
          <ChatScopeFiltersPanel
            compact
            hideWebsiteFilter
            filters={scopeFilters.filters}
            onPatch={scopeFilters.patchFilters}
            onReset={scopeFilters.resetFilters}
            canFilterByResellerId={scopeFilters.canFilterByResellerId}
            resellerOptions={scopeFilters.resellerOptions}
            parentCompanyOptions={scopeFilters.parentCompanyOptions}
            childCompanyOptions={scopeFilters.childCompanyOptions}
            websiteOptions={scopeFilters.websiteOptions}
          />
          <Typography variant="small" muted>
            QA policy editing uses the same API as web. Open the web dashboard for full SLA and checklist configuration; mobile shows scope selection here.
          </Typography>
        </AppCard>
      </ChatLivePageShell>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", padding: tokens.space.lg },
  card: { gap: tokens.space.md },
});
