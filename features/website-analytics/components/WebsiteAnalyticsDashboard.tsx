import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { MobileScreen } from "@/components/layout";
import { AppCard, SelectField, Typography } from "@/components/ui";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useAppTheme } from "@/theme";
import {
  ChatScopeFiltersToolbar,
  useChatScopeFilters,
} from "@/features/chat-shared";
import {
  fetchWebsiteAnalyticsReport,
  fetchWebsiteVisitors,
  type WebsiteVisitorRow,
} from "@/services/chat/website-analytics-report.api";

function fmt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return Intl.NumberFormat().format(n);
}

function pctLabel(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value}%`;
}

function defaultRange() {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

/** Mobile website analytics — KPI summary + visitor list for selected website. */
export function WebsiteAnalyticsDashboard() {
  const theme = useAppTheme();
  const scope = useChatScopeFilters(undefined);
  const websiteId = scope.filters.websiteId.trim();
  const range = useMemo(() => defaultRange(), []);
  const [trafficSource, setTrafficSource] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState<WebsiteVisitorRow | null>(null);

  const reportQuery = useQuery({
    queryKey: ["website-analytics-report", websiteId, range.from, range.to],
    queryFn: () => fetchWebsiteAnalyticsReport({ websiteId, from: range.from, to: range.to }),
    enabled: Boolean(websiteId),
  });

  const visitorsQuery = useQuery({
    queryKey: ["website-analytics-visitors", websiteId, range.from, range.to, trafficSource],
    queryFn: () =>
      fetchWebsiteVisitors({
        websiteId,
        from: range.from,
        to: range.to,
        page: 1,
        limit: 50,
        trafficSource: trafficSource || undefined,
      }),
    enabled: Boolean(websiteId),
  });

  const report = reportQuery.data;
  const visitors = visitorsQuery.data?.items ?? [];

  const kpis = report
    ? [
        { label: "Unique visitors", value: fmt(report.summary.uniqueVisitors) },
        { label: "Page views", value: fmt(report.summary.pageViews) },
        { label: "Widget opens", value: fmt(report.summary.widgetOpens) },
        { label: "Chats started", value: fmt(report.summary.chatsStarted) },
        { label: "Meaningful chats", value: fmt(report.summary.meaningfulChats) },
        { label: "Lead rate", value: pctLabel(report.summary.leadRatePct) },
      ]
    : [];

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Typography variant="boldLarge">Website analytics</Typography>
        <Typography variant="medium" muted>
          Last 30 days · visitor funnel and traffic
        </Typography>
        <ChatScopeFiltersToolbar
          filters={scope.filters}
          onPatch={scope.patchFilters}
          onReset={scope.resetFilters}
          canFilterByResellerId={scope.canFilterByResellerId}
          resellerOptions={scope.resellerOptions}
          parentCompanyOptions={scope.parentCompanyOptions}
          childCompanyOptions={scope.childCompanyOptions}
          websiteOptions={scope.websiteOptions}
          title="Analytics scope"
        />
        {websiteId ? (
          <SelectField
            label="Traffic source"
            value={trafficSource}
            onChange={setTrafficSource}
            options={[
              { label: "All sources", value: "" },
              ...(report?.trafficSources ?? []).map((s) => ({ label: s.label, value: s.source })),
            ]}
            searchable={false}
          />
        ) : null}
      </View>

      {!websiteId ? (
        <AppCard>
          <Typography variant="medium" muted>
            Select a website to view analytics.
          </Typography>
        </AppCard>
      ) : reportQuery.isLoading ? (
        <ActivityIndicator color={theme.app.dashboard.accentBlue} />
      ) : reportQuery.isError ? (
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(reportQuery.error, "Could not load analytics.")}
          </Typography>
        </AppCard>
      ) : (
        <>
          <View style={styles.metricGrid}>
            {kpis.map((k) => (
              <AppCard key={k.label} style={styles.metricCard}>
                <Typography variant="small" muted>
                  {k.label}
                </Typography>
                <Typography variant="boldLarge" color={theme.app.dashboard.accentBlue}>
                  {k.value}
                </Typography>
              </AppCard>
            ))}
          </View>

          <Typography variant="medium16" style={{ marginVertical: theme.spacing.sm }}>
            Recent visitors
          </Typography>

          {visitorsQuery.isLoading ? (
            <ActivityIndicator color={theme.app.dashboard.accentBlue} />
          ) : (
            <FlatList
              data={visitors}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 24 }}
              ListEmptyComponent={
                <AppCard>
                  <Typography variant="medium" muted>
                    No visitors in this period.
                  </Typography>
                </AppCard>
              }
              renderItem={({ item }) => (
                <Pressable onPress={() => setSelectedVisitor(item)}>
                  <AppCard style={{ gap: 4 }}>
                    <Typography variant="medium16">
                      {item.name || item.email || "Anonymous visitor"}
                    </Typography>
                    <Typography variant="small" muted>
                      {item.trafficSourceLabel} · {item.pageViewCount} page views
                    </Typography>
                    <Typography variant="small" muted>
                      {item.location || item.locationCountry || "—"}
                      {item.hasChatted ? " · chatted" : ""}
                      {item.hasLead ? " · lead" : ""}
                    </Typography>
                  </AppCard>
                </Pressable>
              )}
            />
          )}
        </>
      )}

      {selectedVisitor ? (
        <AppCard style={[styles.detailOverlay, { gap: 8 }]}>
          <Typography variant="medium16">Visitor detail</Typography>
          <Typography variant="small" muted>
            {selectedVisitor.email || "No email"} · {selectedVisitor.phone || "No phone"}
          </Typography>
          <Typography variant="small">
            Landing: {selectedVisitor.landingPageUrl || "—"}
          </Typography>
          <Typography variant="small" muted onPress={() => setSelectedVisitor(null)}>
            Close
          </Typography>
        </AppCard>
      ) : null}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  metricCard: { flexBasis: "47%", gap: 4 },
  detailOverlay: { position: "absolute", left: 16, right: 16, bottom: 24 },
});
