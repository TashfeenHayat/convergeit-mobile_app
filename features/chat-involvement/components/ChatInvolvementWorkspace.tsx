import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { AppCard, PermissionDeniedPanel, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { useAuth } from "@/lib/auth";
import { useChatApiGates } from "@/lib/permissions/use-chat-api-gates";
import { OP } from "@/lib/permissions/operational-keys";
import { ChatLivePageHeader, ChatLivePageShell, ChatScopeTableFiltersCard, useChatScopeFilters } from "@/features/chat-shared";
import { fetchWebsiteInvolvementLinks } from "@/services/chat/involvement.api";
import { InvolvementUsersTab } from "./InvolvementUsersTab";
import { ChatInvolvementScopeFilterPanel } from "./ChatInvolvementScopeFilterPanel";

type TabId = "users" | "links";

export function ChatInvolvementWorkspace() {
  const { hasOperational, permissionsSyncing } = useAuth();
  const gates = useChatApiGates();
  const [tab, setTab] = useState<TabId>("users");
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const scopeFilters = useChatScopeFilters(undefined, { apiEnabled: gates.widgetSettings });
  const websiteId = scopeFilters.filters.websiteId.trim();

  const hasActiveTableFilters = Boolean(
    scopeFilters.filters.resellerId.trim() || scopeFilters.filters.parentCompanyId.trim() || scopeFilters.filters.childCompanyId.trim() || scopeFilters.filters.websiteId.trim(),
  );

  const linksQuery = useQuery({
    queryKey: ["involvement-links", websiteId] as const,
    queryFn: () => fetchWebsiteInvolvementLinks(websiteId),
    enabled: gates.widgetSettings && Boolean(websiteId) && tab === "links",
  });

  if (permissionsSyncing) {
    return (
      <View style={styles.centerWrap}>
        <Typography variant="medium" muted>
          Loading permissions…
        </Typography>
      </View>
    );
  }

  if (!gates.widgetSettings) {
    return (
      <View style={styles.centerWrap}>
        <PermissionDeniedPanel title="Chat involvement not available" description="Requires page:chat-widget and chat-widget:view or update." />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <ChatLivePageShell>
        <ChatLivePageHeader
          title="Chat Involvement"
          subtitle="External users who receive monitor links by email — not live chat agents. Scope filters apply to the table only."
          navPreset="configure"
        />

        <ChatScopeTableFiltersCard hint="Filters this list only — does not affect Add actions" hasActiveFilters={hasActiveTableFilters} expanded={filtersExpanded} onExpandedChange={setFiltersExpanded}>
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

        <View style={styles.tabsRow}>
          {(
            [
              { id: "users" as const, label: "Involvement users" },
              { id: "links" as const, label: "Link activity" },
            ]
          ).map((t) => (
            <Pressable key={t.id} style={[styles.tab, tab === t.id && styles.tabActive]} onPress={() => setTab(t.id)}>
              <Typography variant="small" color={tab === t.id ? tokens.colors.textPrimary : tokens.colors.textMuted} style={{ fontWeight: tab === t.id ? "700" : "500" }}>
                {t.label}
              </Typography>
            </Pressable>
          ))}
        </View>

        {tab === "users" ? (
          <InvolvementUsersTab filters={scopeFilters.filters} canFilterByResellerId={scopeFilters.canFilterByResellerId} canEdit={hasOperational(OP.chatWidget.update)} apiEnabled={gates.widgetSettings} />
        ) : null}

        {tab === "links" ? (
          <AppCard style={{ padding: tokens.space.md }}>
            <Typography variant="mediumLarge" style={{ fontWeight: "700", marginBottom: 4 }}>
              Recent involvement links
            </Typography>
            <Typography variant="small" muted style={{ marginBottom: tokens.space.md }}>
              Use Filters → Website to view links for one site. One shared URL per send.
            </Typography>
            {!websiteId ? (
              <Typography variant="small" muted>
                Open Filters and pick a website.
              </Typography>
            ) : linksQuery.isLoading ? (
              <Typography variant="small" muted>
                Loading…
              </Typography>
            ) : (linksQuery.data ?? []).length === 0 ? (
              <Typography variant="small" muted>
                No links sent yet for this website.
              </Typography>
            ) : (
              (linksQuery.data ?? []).map((link) => {
                const opened = Boolean(link.firstOpenedAt);
                const revoked = Boolean(link.revokedAt);
                const label = revoked ? "Revoked" : opened ? "Opened" : "Pending";
                const emails = Array.isArray(link.recipientEmails) ? link.recipientEmails : [link.recipientEmail];
                return (
                  <View key={link.id} style={styles.linkRow}>
                    <View style={styles.linkChips}>
                      <View style={styles.chip}>
                        <Typography variant="small" style={{ fontSize: 10, fontWeight: "700" }}>
                          {label}
                        </Typography>
                      </View>
                      <View style={[styles.chip, styles.chipOutline]}>
                        <Typography variant="small" style={{ fontSize: 10 }}>
                          {link.department?.name ?? "Dept"}
                        </Typography>
                      </View>
                    </View>
                    <Typography variant="small" muted>
                      Chat {link.conversationId.slice(0, 8)}… · {emails.filter(Boolean).join(", ")}
                    </Typography>
                  </View>
                );
              })
            )}
          </AppCard>
        ) : null}
      </ChatLivePageShell>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: tokens.space.lg },
  tabsRow: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    backgroundColor: "rgba(255,255,255,0.03)",
    marginBottom: tokens.space.md,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: "center" },
  tabActive: { backgroundColor: "rgba(88, 101, 242, 0.22)" },
  linkRow: {
    marginBottom: tokens.space.sm,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
  },
  linkChips: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 4 },
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(88,101,242,0.16)",
  },
  chipOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
  },
});
