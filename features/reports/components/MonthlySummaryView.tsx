import { StyleSheet, View } from "react-native";

import { AppCard, Typography } from "@/components/ui";
import type { MonthlyChatSummaryResponse } from "@/api/reports/reports.types";
import { useAppTheme } from "@/theme";

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Intl.NumberFormat().format(n);
}

export type MonthlySummaryViewProps = {
  data: MonthlyChatSummaryResponse;
};

/** Mobile monthly summary metrics — KPI grid + department / lead tables. */
export function MonthlySummaryView({ data }: MonthlySummaryViewProps) {
  const theme = useAppTheme();
  const metrics: { label: string; value: string }[] = [
    { label: "Visitors", value: fmt(data.accountSummary.visitors.total.value) },
    { label: "Chats", value: fmt(data.accountSummary.chats.total.value) },
    { label: "Meaningful chats", value: fmt(data.accountSummary.meaningfulChats.total.value) },
    { label: "Quality coverage", value: `${fmt(data.topMetrics.qualityCoverage.value)}%` },
    { label: "Uptime", value: `${fmt(data.systemInformation.serviceUptimePercentage.value)}%` },
    { label: "Team strength", value: fmt(data.systemInformation.teamStrength.value) },
  ];

  return (
    <View style={{ gap: theme.spacing.md }}>
      <View style={styles.metricGrid}>
        {metrics.map((m) => (
          <AppCard key={m.label} style={styles.metricCard}>
            <Typography variant="small" muted>
              {m.label}
            </Typography>
            <Typography variant="boldLarge" color={theme.app.dashboard.accentBlue}>
              {m.value}
            </Typography>
          </AppCard>
        ))}
      </View>

      <AppCard style={{ gap: theme.spacing.sm }}>
        <Typography variant="medium16">Department distribution</Typography>
        {data.departmentDistribution.length === 0 ? (
          <Typography variant="small" muted>
            No department data.
          </Typography>
        ) : (
          data.departmentDistribution.map((d) => (
            <View key={d.distributionDepartmentId} style={styles.rowBetween}>
              <Typography variant="medium">{d.department}</Typography>
              <Typography variant="medium" muted>
                {fmt(d.count)}
              </Typography>
            </View>
          ))
        )}
      </AppCard>

      <AppCard style={{ gap: theme.spacing.sm }}>
        <Typography variant="medium16">Chats to leads (recent months)</Typography>
        {data.chatsToLeadComparison.map((row) => (
          <View key={row.monthName} style={styles.rowBetween}>
            <Typography variant="medium">{row.monthName}</Typography>
            <Typography variant="medium" muted>
              {fmt(row.totalChats)} chats · {fmt(row.billableChats)} billable
            </Typography>
          </View>
        ))}
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metricCard: { flexBasis: "47%", gap: 4 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
});
