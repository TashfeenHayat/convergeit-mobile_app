import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  ChatLivePageHeader,
  ChatLivePageShell,
  ChatScopeTableFiltersCard,
  useChatScopeFilters,
} from "@/features/chat-shared";
import { ChatInvolvementScopeFilterPanel } from "@/features/chat-involvement/components/ChatInvolvementScopeFilterPanel";
import { PermissionDeniedPanel, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { useChatApiGates } from "@/lib/permissions/use-chat-api-gates";
import { useAuth } from "@/lib/auth";
import { PAGE } from "@/lib/permissions/permission-constants";
import { OP } from "@/lib/permissions/operational-keys";
import { InternalSupervisorsTab } from "./InternalSupervisorsTab";

export function InternalSupervisorsWorkspace() {
  const { hasPage, hasOperational, permissionsSyncing } = useAuth();
  const gates = useChatApiGates();
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const scopeFilters = useChatScopeFilters(undefined, { apiEnabled: gates.widgetSettings });
  const canAccess =
    hasPage(PAGE.CHAT_INTERNAL_SUPERVISORS) || (hasPage(PAGE.CHAT_WIDGET) && hasOperational(OP.chatWidget.view));

  const hasActiveTableFilters = Boolean(
    scopeFilters.filters.resellerId.trim() ||
      scopeFilters.filters.parentCompanyId.trim() ||
      scopeFilters.filters.childCompanyId.trim() ||
      scopeFilters.filters.websiteId.trim(),
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

  if (!canAccess || !gates.widgetSettings) {
    return (
      <View style={styles.center}>
        <PermissionDeniedPanel
          title="Internal supervisors not available"
          description="Requires page:chat-internal-supervisors or page:chat-widget with chat-widget:view."
 />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      <ChatLivePageShell>
        <ChatLivePageHeader
          title="Internal Supervisors"
          subtitle="Internal supervisors only (external users use involvement). Assign internal users to monitor internal pools."
          navPreset="configure"
 />

        <ChatScopeTableFiltersCard
          hasActiveFilters={hasActiveTableFilters}
          expanded={filtersExpanded}
          onExpandedChange={setFiltersExpanded}
        >
          <ChatInvolvementScopeFilterPanel
            filters={scopeFilters.filters}
            onPatch={scopeFilters.patchFilters}
            canFilterByResellerId={scopeFilters.canFilterByResellerId}
            resellerOptions={scopeFilters.resellerOptions}
            parentCompanyOptions={scopeFilters.parentCompanyOptions}
            childCompanyOptions={scopeFilters.childCompanyOptions}
            websiteOptions={scopeFilters.websiteOptions}
            hasActiveFilters={hasActiveTableFilters}
            onClearAll={scopeFilters.resetFilters}
            onClose={() => setFiltersExpanded(false)}
 />
        </ChatScopeTableFiltersCard>

        <InternalSupervisorsTab
          filters={scopeFilters.filters}
          canFilterByResellerId={scopeFilters.canFilterByResellerId}
          canEdit={hasOperational(OP.chatWidget.update)}
          apiEnabled={gates.widgetSettings}
 />
      </ChatLivePageShell>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", padding: tokens.space.lg },
});
