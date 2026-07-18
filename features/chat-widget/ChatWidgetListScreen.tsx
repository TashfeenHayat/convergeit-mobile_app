import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { listAdminWidgets, widgetResponseData } from "@/api/widgets/widgets.api";
import type { JsonRecord } from "@/api/types/common.types";
import { AppCard, Button, PermissionDeniedPanel, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { useAuth } from "@/lib/auth";
import { OP } from "@/lib/permissions/operational-keys";
import { useChatApiGates } from "@/lib/permissions/use-chat-api-gates";
import { ChatLivePageHeader, ChatLivePageShell, ChatScopeFiltersPanel, useChatScopeFilters } from "@/features/chat-shared";
import { parseWidgetsListEnvelope } from "@/features/chat-settings/utils/map-settings-website";
import { WidgetPublishStatusChip } from "./components/WidgetPublishStatusChip";
import { useWidgetAdminLifecycle } from "./hooks/useWidgetAdminLifecycle";

function WidgetListRow({ widgetKey, label, onPress }: { widgetKey: string; label: string; onPress: () => void }) {
  const lifecycle = useWidgetAdminLifecycle(widgetKey);
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography variant="medium" style={{ fontWeight: "600" }} numberOfLines={1}>
          {label}
        </Typography>
        <Typography variant="small" muted numberOfLines={1}>
          {widgetKey}
        </Typography>
      </View>
      {lifecycle.loading ? (
        <ActivityIndicator size="small" color={tokens.colors.accentBlue} />
      ) : (
        <WidgetPublishStatusChip label={lifecycle.statusLabel ?? lifecycle.deployState ?? "—"} isLive={lifecycle.isLive} />
      )}
    </Pressable>
  );
}

export function ChatWidgetListScreen() {
  const router = useRouter();
  const { hasOperational, permissionsSyncing } = useAuth();
  const gates = useChatApiGates();
  const canEdit = hasOperational(OP.chatWidget.update);
  const scopeFilters = useChatScopeFilters(undefined, { apiEnabled: gates.widgetSettings });
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Array<{ widgetKey: string; label: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({
      all: true as const,
      widgetType: "CHAT" as const,
      resellerId: scopeFilters.canFilterByResellerId ? scopeFilters.filters.resellerId : undefined,
      parentCompanyId: scopeFilters.filters.parentCompanyId || undefined,
      childCompanyId: scopeFilters.filters.childCompanyId || undefined,
    }),
    [scopeFilters.canFilterByResellerId, scopeFilters.filters],
  );

  useEffect(() => {
    if (!gates.widgetSettings) return;
    let cancelled = false;
    setLoading(true);
    void listAdminWidgets(queryParams)
      .then((envelope) => {
        if (cancelled) return;
        const parsed = parseWidgetsListEnvelope(widgetResponseData<JsonRecord>(envelope));
        setRows(
          parsed.map((w) => ({
            widgetKey: w.widgetKey,
            label: w.name || w.url || w.widgetKey,
          })),
        );
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load widgets.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gates.widgetSettings, queryParams]);

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
        <PermissionDeniedPanel title="Chat widgets not available" description="Requires chat-widget permissions." />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <ChatLivePageShell>
        <ChatLivePageHeader
          title="Chat Widgets"
          subtitle="Manage live chat widget configuration and publish state."
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
          {canEdit ? (
            <Button variant="primary" size="compact" onPress={() => router.push("/(dashboard)/chat-widget/add" as Href)}>
              Add widget
            </Button>
          ) : null}
          {loading ? (
            <ActivityIndicator color={tokens.colors.accentBlue} />
          ) : error ? (
            <Typography variant="small" style={{ color: tokens.colors.danger }}>
              {error}
            </Typography>
          ) : rows.length === 0 ? (
            <Typography variant="small" muted>
              No chat widgets in this scope.
            </Typography>
          ) : (
            rows.map((row) => (
              <WidgetListRow
                key={row.widgetKey}
                widgetKey={row.widgetKey}
                label={row.label}
                onPress={() => router.push(`/(dashboard)/chat-widget/${encodeURIComponent(row.widgetKey)}` as Href)}
              />
            ))
          )}
        </AppCard>
      </ChatLivePageShell>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", padding: tokens.space.lg },
  card: { gap: tokens.space.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
    paddingVertical: tokens.space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.border,
  },
});
