import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from "react-native";

import { MobileScreen } from "@/components/layout";
import {
  AppCard,
  Button,
  ConfirmActionModal,
  FormModal,
  InputField,
  SelectField,
  Typography,
} from "@/components/ui";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useAppTheme } from "@/theme";
import type { ReportConfiguration, ReportType } from "@/api/reports/reports.types";
import {
  useCreateReportConfigurationMutation,
  useDeleteReportConfigurationMutation,
  useGenerateReportMutation,
  useGeneratedReportsQuery,
  useReportConfigurationsQuery,
  useShareGeneratedReportMutation,
} from "../hooks/useReportsQueries";
import { DAY_OF_WEEK_OPTIONS, REPORT_TYPE_OPTIONS, SCHEDULE_TYPE_OPTIONS } from "../reports.constants";

function scheduleSummary(config: ReportConfiguration): string {
  const s = config.schedules[0];
  if (!s) return "No schedule";
  if (s.scheduleType === "weekly") {
    const day = DAY_OF_WEEK_OPTIONS.find((d) => Number(d.value) === s.dayOfWeek)?.label ?? "—";
    return `Weekly · ${day} · ${s.scheduleTime ?? "—"}`;
  }
  if (s.scheduleType === "monthly") {
    return `Monthly · day ${s.dayOfMonth ?? "—"} · ${s.scheduleTime ?? "—"}`;
  }
  return "No schedule";
}

/** Mobile-simplified config CRUD — single recipient add at a time, no multi-recipient grid. */
export function ReportsConfigurationPage() {
  const theme = useAppTheme();
  const configsQuery = useReportConfigurationsQuery();
  const createMutation = useCreateReportConfigurationMutation();
  const deleteMutation = useDeleteReportConfigurationMutation();
  const generateMutation = useGenerateReportMutation();
  const shareMutation = useShareGeneratedReportMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("monthly_chat_summary");
  const [scheduleType, setScheduleType] = useState<"weekly" | "monthly">("monthly");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [recipientEmail, setRecipientEmail] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<string | null>(null);
  const [shareEmail, setShareEmail] = useState("");

  const generatedQuery = useGeneratedReportsQuery(expandedId ?? undefined, Boolean(expandedId));

  const resetCreateForm = () => {
    setReportType("monthly_chat_summary");
    setScheduleType("monthly");
    setDayOfMonth("1");
    setDayOfWeek("1");
    setScheduleTime("09:00");
    setRecipientEmail("");
  };

  const onCreate = () => {
    if (!recipientEmail.trim()) {
      Alert.alert("Recipient required", "Add at least one recipient email.");
      return;
    }
    createMutation.mutate(
      {
        reportType,
        recipients: [{ email: recipientEmail.trim(), recipientType: "to" }],
        schedule: {
          scheduleType,
          dayOfMonth: scheduleType === "monthly" ? Number(dayOfMonth) || 1 : undefined,
          dayOfWeek: scheduleType === "weekly" ? Number(dayOfWeek) || 0 : undefined,
          scheduleTime,
          isActive: true,
        },
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          resetCreateForm();
        },
        onError: (err) => Alert.alert("Could not save", extractApiErrorMessage(err)),
      },
    );
  };

  const configs = useMemo(() => configsQuery.data ?? [], [configsQuery.data]);

  return (
    <MobileScreen contentStyle={styles.screen}>
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Typography variant="boldLarge">Report Schedules</Typography>
        <Typography variant="medium" muted>
          Scheduled report configurations and generated history.
        </Typography>
        <Button onPress={() => setCreateOpen(true)}>New schedule</Button>
      </View>

      {configsQuery.isLoading ? (
        <ActivityIndicator color={theme.app.dashboard.accentBlue} />
      ) : configsQuery.isError ? (
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(configsQuery.error, "Could not load configurations.")}
          </Typography>
        </AppCard>
      ) : configs.length === 0 ? (
        <AppCard>
          <Typography variant="medium" muted>
            No report schedules yet.
          </Typography>
        </AppCard>
      ) : (
        <FlatList
          data={configs}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ gap: theme.spacing.sm }}
          renderItem={({ item }) => {
            const expanded = expandedId === item.id;
            return (
              <AppCard style={{ gap: theme.spacing.sm }}>
                <View style={styles.rowBetween}>
                  <Typography variant="medium16">
                    {REPORT_TYPE_OPTIONS.find((o) => o.value === item.reportType)?.label ??
                      item.reportType}
                  </Typography>
                  <Typography variant="small" muted>
                    {scheduleSummary(item)}
                  </Typography>
                </View>
                <Typography variant="small" muted>
                  {item.recipients.map((r) => r.email).join(", ") || "No recipients"}
                </Typography>
                <View style={styles.actionsRow}>
                  <Button
                    size="compact"
                    variant="outlined"
                    onPress={() => setExpandedId(expanded ? null : item.id)}
                  >
                    {expanded ? "Hide history" : "History"}
                  </Button>
                  <Button
                    size="compact"
                    disabled={generateMutation.isPending}
                    onPress={() =>
                      generateMutation.mutate(
                        { id: item.id },
                        {
                          onSuccess: () => Alert.alert("Generated", "Report generated."),
                          onError: (err) =>
                            Alert.alert("Failed", extractApiErrorMessage(err)),
                        },
                      )
                    }
                  >
                    Generate now
                  </Button>
                  <Button size="compact" variant="danger" onPress={() => setDeleteTarget(item.id)}>
                    Delete
                  </Button>
                </View>

                {expanded ? (
                  <View style={{ gap: 8, marginTop: 4 }}>
                    {generatedQuery.isLoading ? (
                      <ActivityIndicator color={theme.app.dashboard.accentBlue} />
                    ) : (generatedQuery.data ?? []).length === 0 ? (
                      <Typography variant="small" muted>
                        No generated reports yet.
                      </Typography>
                    ) : (
                      (generatedQuery.data ?? []).map((g) => (
                        <View key={g.id} style={styles.historyRow}>
                          <Typography variant="small" muted>
                            {new Date(g.generatedAt).toLocaleString()}
                          </Typography>
                          <Button size="compact" variant="ghost" onPress={() => setShareTarget(g.id)}>
                            Share
                          </Button>
                        </View>
                      ))
                    )}
                  </View>
                ) : null}
              </AppCard>
            );
          }}
  showsVerticalScrollIndicator={false}/>
      )}

      <FormModal
        open={createOpen}
        title="New report schedule"
        onClose={() => setCreateOpen(false)}
        onSave={onCreate}
        primaryButtonDisabled={createMutation.isPending}
        primaryButtonLabel={createMutation.isPending ? "Saving…" : "Save"}
      >
        <SelectField
          label="Report type"
          value={reportType}
          onChange={(v) => setReportType(v as ReportType)}
          options={REPORT_TYPE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          searchable={false}
 />
        <SelectField
          label="Frequency"
          value={scheduleType}
          onChange={(v) => setScheduleType(v as "weekly" | "monthly")}
          options={SCHEDULE_TYPE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          searchable={false}
 />
        {scheduleType === "weekly" ? (
          <SelectField
            label="Day of week"
            value={dayOfWeek}
            onChange={setDayOfWeek}
            options={DAY_OF_WEEK_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
            searchable={false}
 />
        ) : (
          <InputField
            label="Day of month"
            keyboardType="number-pad"
            value={dayOfMonth}
            onChangeText={setDayOfMonth}
 />
        )}
        <InputField
          label="Send time (HH:mm)"
          value={scheduleTime}
          onChangeText={setScheduleTime}
          placeholder="09:00"
 />
        <InputField
          label="Recipient email"
          value={recipientEmail}
          onChangeText={setRecipientEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="name@company.com"
 />
      </FormModal>

      <ConfirmActionModal
        open={Boolean(deleteTarget)}
        title="Delete schedule?"
        description="This report schedule will no longer run automatically."
        confirmLabel="Delete"
        confirmButtonVariant="danger"
        isLoading={deleteMutation.isPending}
        onDismiss={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget, {
            onSuccess: () => setDeleteTarget(null),
            onError: (err) => Alert.alert("Could not delete", extractApiErrorMessage(err)),
          });
        }}
 />

      <FormModal
        open={Boolean(shareTarget)}
        title="Share report"
        onClose={() => {
          setShareTarget(null);
          setShareEmail("");
        }}
        onSave={() => {
          if (!shareTarget || !shareEmail.trim()) return;
          shareMutation.mutate(
            { id: shareTarget, body: { emails: [shareEmail.trim()] } },
            {
              onSuccess: () => {
                setShareTarget(null);
                setShareEmail("");
                Alert.alert("Shared", "Report sent.");
              },
              onError: (err) => Alert.alert("Could not share", extractApiErrorMessage(err)),
            },
          );
        }}
        primaryButtonDisabled={shareMutation.isPending}
        primaryButtonLabel="Send"
      >
        <InputField
          label="Recipient email"
          value={shareEmail}
          onChangeText={setShareEmail}
          autoCapitalize="none"
          keyboardType="email-address"
 />
      </FormModal>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: 12 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  actionsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  historyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
