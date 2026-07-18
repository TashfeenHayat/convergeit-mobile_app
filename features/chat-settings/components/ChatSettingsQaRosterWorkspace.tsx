import { ScrollView, StyleSheet, View } from "react-native";
import { AppCard, PermissionDeniedPanel, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { useAuth } from "@/lib/auth";
import { PAGE } from "@/lib/permissions/permission-constants";
import { OP } from "@/lib/permissions/operational-keys";
import { useChatApiGates } from "@/lib/permissions/use-chat-api-gates";
import { ChatLivePageHeader, ChatLivePageShell, ChatScopeFiltersPanel, useChatScopeFilters } from "@/features/chat-shared";

export function ChatSettingsQaRosterWorkspace() {
  const { hasPage, hasOperational, permissionsSyncing } = useAuth();
  const gates = useChatApiGates();
  const canView =
    hasPage(PAGE.CHAT_QA_ROSTER) || hasPage(PAGE.CHAT_WIDGET) || hasOperational(OP.qa.chatAssign);
  const scopeFilters = useChatScopeFilters(undefined, { apiEnabled: gates.widgetSettings || canView });
  const websiteId = scopeFilters.filters.websiteId.trim();

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
        <PermissionDeniedPanel title="QA roster not available" description="Requires QA roster or chat-widget permissions." />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <ChatLivePageShell>
        <ChatLivePageHeader
          title="QA Roster"
          subtitle="Assign QA reviewers per website. Pick a website in scope filters."
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
          <Typography variant="medium" style={{ fontWeight: "600" }}>
            {websiteId ? `Website selected: ${websiteId.slice(0, 8)}…` : "Select a website to manage QA roster"}
          </Typography>
          <Typography variant="small" muted>
            Full roster assignment UI mirrors web QaRosterTab — use web for bulk edits; mobile confirms scope and website selection.
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
