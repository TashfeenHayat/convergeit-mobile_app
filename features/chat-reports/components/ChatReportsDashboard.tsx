import { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, MetricCard, PermissionDeniedPanel, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { useAuth } from "@/lib/auth";
import { useChatApiGates } from "@/lib/permissions/use-chat-api-gates";
import {
  ChatLivePageHeader,
  ChatLivePageShell,
  ChatScopeFiltersPanel,
  calendarDateToIsoEnd,
  calendarDateToIsoStart,
  isoToCalendarDate,
  useChatScopeFilters,
} from "@/features/chat-shared";
import { useChatReports } from "../hooks/useChatReports";
import { ReportBucketTable } from "./ReportBucketTable";
import { defaultReportRange, formatDurationSeconds, formatScore } from "../utils/format-metric";
import { chatReportsStyles, KpiCard } from "../styles/chat-reports.styles";

const defaultRange = defaultReportRange();

export function ChatReportsDashboard() {
  const { permissionsSyncing } = useAuth();
  const gates = useChatApiGates();
  const allowed = gates.reports;
  const reports = useChatReports({ apiEnabled: allowed });
  const scopeFilters = useChatScopeFilters(
    { dateFrom: isoToCalendarDate(defaultRange.from), dateTo: isoToCalendarDate(defaultRange.to) },
    { apiEnabled: allowed },
  );

  useEffect(() => {
    const from = calendarDateToIsoStart(scopeFilters.filters.dateFrom) || defaultRange.from;
    const to = calendarDateToIsoEnd(scopeFilters.filters.dateTo) || defaultRange.to;
    reports.setRange({ from, to });
    reports.setWebsiteId(scopeFilters.filters.websiteId);
    reports.setDepartmentId(scopeFilters.filters.departmentId);
  }, [
    scopeFilters.filters.dateFrom,
    scopeFilters.filters.dateTo,
    scopeFilters.filters.departmentId,
    scopeFilters.filters.websiteId,
    reports.setRange,
    reports.setWebsiteId,
    reports.setDepartmentId,
  ]);

  if (permissionsSyncing) {
    return (
      <View style={styles.center}>
        <Typography variant="medium" muted>
          Loading permissions…
        </Typography>
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={styles.center}>
        <PermissionDeniedPanel
          title="Chat reports not available"
          description="Requires page:chat-reports and chat:report:view from /auth/me."
 />
      </View>
    );
  }

  if (!reports.token) {
    return (
      <View style={styles.center}>
        <Typography variant="medium" muted>
          Sign in to view chat reports.
        </Typography>
      </View>
    );
  }

  const summary = reports.overview?.summary;
  const qa = reports.overview?.qa;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      <ChatLivePageShell>
        <ChatLivePageHeader
          title="Live Chat Reports"
          subtitle="Scoped metrics from closed and active conversations in your monitor access."
          navPreset="configure"
 />
        <View style={styles.toolbar}>
          <Button variant="secondary" size="compact" onPress={() => void reports.refresh()}>
            Refresh
          </Button>
        </View>

        <View style={styles.scopeCard}>
          <ChatScopeFiltersPanel
            compact
            filters={scopeFilters.filters}
            onPatch={scopeFilters.patchFilters}
            onReset={() => {
              scopeFilters.resetFilters();
              const dr = defaultReportRange();
              scopeFilters.patchFilters({
                dateFrom: isoToCalendarDate(dr.from),
                dateTo: isoToCalendarDate(dr.to),
              });
            }}
            canFilterByResellerId={scopeFilters.canFilterByResellerId}
            resellerOptions={scopeFilters.resellerOptions}
            parentCompanyOptions={scopeFilters.parentCompanyOptions}
            childCompanyOptions={scopeFilters.childCompanyOptions}
            websiteOptions={scopeFilters.websiteOptions}
            showDepartment
            departmentOptions={[{ value: "", label: "All departments" }]}
            hint="Pick org scope; set report period using date from/to fields below."
 />
          <Typography variant="small" muted style={{ marginTop: tokens.space.sm }}>
            Date from: {scopeFilters.filters.dateFrom || "—"} · Date to: {scopeFilters.filters.dateTo || "—"}
          </Typography>
        </View>

        {reports.loading ? (
          <Typography variant="small" muted style={{ padding: tokens.space.lg }}>
            Loading report…
          </Typography>
        ) : reports.error ? (
          <Typography variant="small" style={{ color: tokens.colors.danger, padding: tokens.space.lg }}>
            Could not load report. Check date range and permissions.
          </Typography>
        ) : reports.overview ? (
          <>
            {reports.overview.capped ? (
              <Typography variant="small" style={{ color: tokens.colors.accentOrange, paddingHorizontal: tokens.space.md }}>
                Results capped at 8,000 conversations — narrow filters for full accuracy.
              </Typography>
            ) : null}
            <Typography variant="small" muted style={{ paddingHorizontal: tokens.space.md }}>
              Range {new Date(reports.overview.range.from).toLocaleDateString()} –{" "}
              {new Date(reports.overview.range.to).toLocaleDateString()}
            </Typography>

            <View style={[chatReportsStyles.kpiGrid, { padding: tokens.space.md }]}>
              <KpiCard label="Conversations" value={String(summary?.conversationCount ?? 0)} />
              <KpiCard label="Closed" value={String(summary?.closedCount ?? 0)} />
              <KpiCard label="Takeovers" value={String(summary?.takeoverCount ?? 0)} />
              <KpiCard label="Avg FRT" value={formatDurationSeconds(summary?.avgFirstResponseSeconds)} />
              <KpiCard label="Avg queue" value={formatDurationSeconds(summary?.avgQueueSeconds)} />
              <KpiCard label="Avg handle" value={formatDurationSeconds(summary?.avgHandleSeconds)} />
              <KpiCard label="Avg QA score" value={formatScore(summary?.avgQaScore)} />
              <KpiCard label="Avg CSAT" value={formatScore(summary?.avgCsatScore)} />
              <KpiCard label="QA pending" value={String(qa?.pending ?? 0)} />
              <KpiCard label="QA completed" value={String(qa?.completed ?? 0)} />
            </View>

            <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
              <ReportBucketTable
                title="By department"
                rows={(reports.overview.byDepartment ?? []).map((b) => ({
                  label: b.label,
                  conversationCount: b.conversationCount,
                  avgQaScore: b.avgQaScore,
                }))}
 />
              <ReportBucketTable
                title="By routing key"
                rows={(reports.overview.byRoutingKey ?? []).slice(0, 12).map((b) => ({
                  label: b.label,
                  conversationCount: b.conversationCount,
                  avgQaScore: b.avgQaScore,
                }))}
 />
            </View>
          </>
        ) : null}
      </ChatLivePageShell>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", padding: tokens.space.lg },
  toolbar: { paddingHorizontal: tokens.space.md, paddingBottom: tokens.space.sm },
  scopeCard: { paddingHorizontal: tokens.space.md, marginBottom: tokens.space.sm },
});
