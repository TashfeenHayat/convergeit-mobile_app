import { StyleSheet, View } from "react-native";

import { AppCard, Button, SelectField, Typography } from "@/components/ui";
import type { ReportType } from "@/api/reports/reports.types";
import { useAppTheme } from "@/theme";
import { LEAD_TYPE_OPTIONS, REPORT_TYPE_OPTIONS } from "../reports.constants";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2000, i, 1).toLocaleString(undefined, { month: "long" }),
}));

function yearOptions(): { value: string; label: string }[] {
  const current = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => {
    const y = current - i;
    return { value: String(y), label: String(y) };
  });
}

export type ReportFiltersPanelProps = {
  reportType: ReportType;
  onReportTypeChange: (value: ReportType) => void;
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  leadType?: string;
  onLeadTypeChange?: (value: string) => void;
  onApply?: () => void;
};

/** Mobile report filters — type, period, optional lead type. */
export function ReportFiltersPanel({
  reportType,
  onReportTypeChange,
  year,
  month,
  onYearChange,
  onMonthChange,
  leadType = "",
  onLeadTypeChange,
  onApply,
}: ReportFiltersPanelProps) {
  const theme = useAppTheme();
  const showLeadType =
    reportType === "chat_transcripts_report" || reportType === "visitor_info_with_transcript";

  return (
    <AppCard style={{ gap: theme.spacing.sm }}>
      <Typography variant="medium16">Filters</Typography>
      <SelectField
        label="Report type"
        value={reportType}
        onChange={(v) => onReportTypeChange(v as ReportType)}
        options={REPORT_TYPE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
        searchable={false}
      />
      <View style={styles.row}>
        <View style={styles.half}>
          <SelectField
            label="Year"
            value={String(year)}
            onChange={(v) => onYearChange(Number(v))}
            options={yearOptions()}
            searchable={false}
          />
        </View>
        <View style={styles.half}>
          <SelectField
            label="Month"
            value={String(month)}
            onChange={(v) => onMonthChange(Number(v))}
            options={MONTH_OPTIONS}
            searchable={false}
          />
        </View>
      </View>
      {showLeadType && onLeadTypeChange ? (
        <SelectField
          label="Lead type"
          value={leadType}
          onChange={onLeadTypeChange}
          options={LEAD_TYPE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          searchable={false}
        />
      ) : null}
      {onApply ? (
        <Button size="compact" onPress={onApply}>
          Apply filters
        </Button>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1, minWidth: 0 },
});
