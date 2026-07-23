import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { MobileScreen } from "@/components/layout";
import {
  AppCard,
  Button,
  FormModal,
  SearchBar,
  SegmentedControl,
  SelectField,
  TablePagination,
  Typography,
} from "@/components/ui";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth";
import { OP } from "@/lib/permissions/operational-keys";
import { useAppTheme } from "@/theme";
import { tokens } from "@/theme/tokens";
import {
  fetchAnalyticsLogDetail,
  fetchAuditLogDetail,
} from "@/api/observability/observability-logs.api";
import type {
  AnalyticsLogListItem,
  AuditLogListItem,
} from "@/api/observability/observability-logs.types";
import { PAGE } from "@/lib/permissions/permission-constants";
import { ChatScopeFiltersToolbar, useChatScopeFilters } from "@/features/chat-shared";
import { useObservabilityLogs, type ObservabilityLogTab } from "../hooks/useObservabilityLogs";
import {
  formatLogActor,
  formatLogTimestamp,
  formatLogWebsiteLabel,
} from "../utils/format-log";
import { LogDetailDrawer } from "./LogDetailDrawer";

/** Mobile system logs — audit / analytics tabs with scope + detail modal. */
export function SettingsLogsWorkspace() {
  const theme = useAppTheme();
  const { hasPage, isPlatformAdmin } = useAuth();
  const allowed = isPlatformAdmin || hasPage(PAGE.OBSERVABILITY_LOGS);

  const logs = useObservabilityLogs({ apiEnabled: allowed });
  const scopeFilters = useChatScopeFilters({}, { apiEnabled: allowed });
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    logs.setWebsiteId(scopeFilters.filters.websiteId);
    logs.setPage(1);
  }, [scopeFilters.filters.websiteId]);

  if (!allowed) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" muted>
            You do not have permission to view system logs.
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Typography variant="boldLarge">System logs</Typography>
        <Typography variant="medium" muted>
          Audit and analytics events · {logs.retentionDays}-day retention
        </Typography>
        <SegmentedControl
          options={[
            { label: "Audit", value: "audit" },
            { label: "Analytics", value: "analytics" },
          ]}
          value={logs.tab}
          onChange={(v) => logs.setTab(v as ObservabilityLogTab)}
 />
        <ChatScopeFiltersToolbar
          filters={scopeFilters.filters}
          onPatch={scopeFilters.patchFilters}
          onReset={scopeFilters.resetFilters}
          canFilterByResellerId={scopeFilters.canFilterByResellerId}
          resellerOptions={scopeFilters.resellerOptions}
          parentCompanyOptions={scopeFilters.parentCompanyOptions}
          childCompanyOptions={scopeFilters.childCompanyOptions}
          websiteOptions={scopeFilters.websiteOptions}
          title="Log scope filters"
 />
        {logs.tab === "audit" ? (
          <SelectField
            label="Severity"
            value={logs.severity}
            onChange={logs.setSeverity}
            options={[
              { label: "All severities", value: "" },
              { label: "Info", value: "info" },
              { label: "Warning", value: "warning" },
              { label: "Error", value: "error" },
            ]}
            searchable={false}
 />
        ) : null}
        <SearchBar
          value={logs.eventType}
          onChange={(v) => {
            logs.setEventType(v);
            logs.setPage(1);
          }}
          placeholder="Filter by event type…"
 />
      </View>

      {logs.loading ? (
        <ActivityIndicator color={theme.app.dashboard.accentBlue} />
      ) : logs.error ? (
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(logs.error, "Could not load logs.")}
          </Typography>
        </AppCard>
      ) : (
        <FlatList
          data={logs.items as (AuditLogListItem | AnalyticsLogListItem)[]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 24 }}
          ListEmptyComponent={
            <AppCard>
              <Typography variant="medium" muted>
                No log entries match your filters.
              </Typography>
            </AppCard>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => setDetailId(item.id)}>
              <AppCard style={{ gap: 4 }}>
                <View style={styles.rowBetween}>
                  <Typography variant="medium16">{item.eventType}</Typography>
                  <Typography variant="small" muted>
                    {formatLogTimestamp(item.createdAt)}
                  </Typography>
                </View>
                {"severity" in item ? (
                  <Typography variant="small" color={theme.app.dashboard.accentOrange}>
                    {item.severity}
                  </Typography>
                ) : null}
                <Typography variant="small" muted>
                  {formatLogActor(item.actor)} · {formatLogWebsiteLabel(item.website)}
                </Typography>
              </AppCard>
            </Pressable>
          )}
          ListFooterComponent={
            logs.totalPages > 1 ? (
              <TablePagination
                page={logs.page}
                pageCount={logs.totalPages}
                onPageChange={logs.setPage}
 />
            ) : null
          }
  showsVerticalScrollIndicator={false}/>
      )}

      <LogDetailDrawer
        open={Boolean(detailId)}
        logId={detailId}
        tab={logs.tab}
        onClose={() => setDetailId(null)}
 />
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
});
