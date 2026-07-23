import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";

import { MobileScreen } from "@/components/layout";
import { AppCard, Button, SelectField, Typography } from "@/components/ui";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth";
import { useAppTheme } from "@/theme";
import type { ReportType } from "@/api/reports/reports.types";
import {
  useChatTranscriptsReportQuery,
  useMonthWiseChatCountQuery,
  useMonthlyChatSummaryQuery,
  useTrafficConversionQuery,
  useVisitorInfoWithTranscriptReportQuery,
  useWebsiteDistributionReportQuery,
} from "../hooks/useReportsQueries";
import { MonthlySummaryView } from "../components/MonthlySummaryView";
import { REPORT_TYPE_OPTIONS } from "../reports.constants";

function currentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const label = now.toLocaleString(undefined, { month: "long", year: "numeric" });
  return { year, month, label };
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Intl.NumberFormat().format(n);
}

type Row = { id: string; title: string; subtitle: string; extra?: string; url?: string };

/**
 * Mobile-simplified report viewer — one report type at a time, current month
 * by default. Multi-month comparisons / export wizard stay on web.
 */
export function GenerateReportsPage() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const [reportType, setReportType] = useState<ReportType>("monthly_chat_summary");
  const { year, month, label } = useMemo(() => currentMonthRange(), []);

  const scope = useMemo(
    () => ({
      resellerId: user?.resellerId ?? undefined,
      parentCompanyId: user?.parentCompanyId ?? undefined,
    }),
    [user?.resellerId, user?.parentCompanyId],
  );

  const monthlySummary = useMonthlyChatSummaryQuery(
    { ...scope, year, month },
    reportType === "monthly_chat_summary",
  );
  const trafficConversion = useTrafficConversionQuery(
    { ...scope, year, month },
    reportType === "traffic_chat_conversion_ratios",
  );
  const transcripts = useChatTranscriptsReportQuery(
    { ...scope, year, month, page: 1, limit: 50 },
    reportType === "chat_transcripts_report",
  );
  const visitorInfo = useVisitorInfoWithTranscriptReportQuery(
    { ...scope, year, month, page: 1, limit: 50 },
    reportType === "visitor_info_with_transcript",
  );
  const distribution = useWebsiteDistributionReportQuery(
    { ...scope, page: 1, limit: 50 },
    reportType === "website_distribution_report",
  );
  const monthWise = useMonthWiseChatCountQuery(
    { ...scope, monthCount: 6 },
    reportType === "month_wise_chat_count",
  );

  const active =
    reportType === "monthly_chat_summary"
      ? monthlySummary
      : reportType === "traffic_chat_conversion_ratios"
        ? trafficConversion
        : reportType === "chat_transcripts_report"
          ? transcripts
          : reportType === "visitor_info_with_transcript"
            ? visitorInfo
            : reportType === "website_distribution_report"
              ? distribution
              : monthWise;

  const rows: Row[] = useMemo(() => {
    if (!active.data) return [];
    if (reportType === "traffic_chat_conversion_ratios") {
      const d = active.data as NonNullable<typeof trafficConversion.data>;
      return d.rows.map((r) => ({
        id: r.websiteId,
        title: r.domainName || r.websiteUrl,
        subtitle: `${fmt(r.uniqueVisitors)} visitors · ${fmt(r.chats)} chats`,
        extra: `${fmt(r.meaningfulChats)} meaningful`,
      }));
    }
    if (reportType === "chat_transcripts_report") {
      const d = active.data as NonNullable<typeof transcripts.data>;
      return d.items.map((r) => ({
        id: r.conversationId,
        title: r.visitorName || "Visitor",
        subtitle: `${r.domainName} · ${r.day}`,
        extra: r.leadType,
        url: r.chatTranscript?.url,
      }));
    }
    if (reportType === "visitor_info_with_transcript") {
      const d = active.data as NonNullable<typeof visitorInfo.data>;
      return d.items.map((r) => ({
        id: r.conversationId,
        title: r.fullName || "Visitor",
        subtitle: [r.city, r.country].filter(Boolean).join(", ") || r.email || "—",
        extra: r.leadSource,
        url: r.chatTranscript?.url,
      }));
    }
    if (reportType === "website_distribution_report") {
      const d = active.data as NonNullable<typeof distribution.data>;
      return d.items.map((r, i) => ({
        id: `${r.websiteId}-${r.recipientId}-${i}`,
        title: r.domainName,
        subtitle: `${r.departmentName} · ${r.addressType}`,
        extra: r.emailAddress,
      }));
    }
    if (reportType === "month_wise_chat_count") {
      const d = active.data as NonNullable<typeof monthWise.data>;
      return d.months.map((m) => ({
        id: m.monthKey,
        title: m.monthLabel,
        subtitle: `${fmt(m.visitors)} visitors · ${fmt(m.totalChats)} chats`,
        extra: `${fmt(m.billableChats)} billable`,
      }));
    }
    return [];
  }, [active.data, reportType]);

  return (
    <MobileScreen scroll={reportType === "monthly_chat_summary"} contentStyle={styles.screen}>
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Typography variant="boldLarge">Generate Reports</Typography>
        <Typography variant="medium" muted>
          {label} · your scope
        </Typography>
        <SelectField
          label="Report type"
          value={reportType}
          onChange={(v) => setReportType(v as ReportType)}
          options={REPORT_TYPE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          searchable={false}
 />
      </View>

      {active.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.app.dashboard.accentBlue} />
        </View>
      ) : active.isError ? (
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(active.error, "Could not load report.")}
          </Typography>
        </AppCard>
      ) : reportType === "monthly_chat_summary" && monthlySummary.data ? (
        <MonthlySummaryView data={monthlySummary.data} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ gap: theme.spacing.sm }}
          refreshControl={
            <RefreshControl refreshing={active.isRefetching} onRefresh={() => void active.refetch()} />
          }
          ListEmptyComponent={
            <AppCard>
              <Typography variant="medium" muted>
                No data for this period.
              </Typography>
            </AppCard>
          }
          renderItem={({ item }) => (
            <AppCard style={{ gap: 4, padding: theme.spacing.lg }}>
              <Typography variant="medium16">{item.title}</Typography>
              <Typography variant="small" muted>
                {item.subtitle}
              </Typography>
              {item.extra ? <Typography variant="small">{item.extra}</Typography> : null}
              {item.url ? (
                <Button size="compact" variant="outlined" onPress={() => Linking.openURL(item.url!)}>
                  View transcript
                </Button>
              ) : null}
            </AppCard>
          )}
  showsVerticalScrollIndicator={false}/>
      )}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
  centered: { alignItems: "center", justifyContent: "center", paddingVertical: 48 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
});
