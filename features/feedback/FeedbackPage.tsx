import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";

import { MobileScreen } from "@/components/layout";
import {
  AppCard,
  Button,
  InputField,
  SegmentedControl,
  SelectField,
  TablePagination,
  Typography,
} from "@/components/ui";
import type { PlatformAgentFeedbackSettingsBody } from "@/api/types/email.types";
import { useAuth } from "@/lib/auth";
import { OP } from "@/lib/permissions/operational-keys";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useAppTheme } from "@/theme";
import {
  useDistributionFeedbackSubmissionsQuery,
  usePlatformAgentFeedbackQuery,
  useUpdatePlatformAgentFeedbackMutation,
} from "@/features/email/hooks/usePlatformAgentFeedback";

type FeedbackTab = "submissions" | "form";

function parseReasonOptionsText(text: string): string[] {
  return text
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatReasonOptions(options: string[] | undefined): string {
  return (options ?? []).join("\n");
}

function feedbackDetail(row: {
  feedbackType: string;
  reasonKeys: string[];
  comment: string | null;
}): string {
  if (row.feedbackType === "note") return row.comment?.trim() || "—";
  if (row.reasonKeys.length > 0) return row.reasonKeys.join(", ");
  return row.comment?.trim() || "—";
}

/** Mobile agent feedback — submissions list + global form settings. */
export function FeedbackPage() {
  const theme = useAppTheme();
  const { hasOperational } = useAuth();
  const canView = hasOperational(OP.agentFeedback.view);
  const canUpdate = hasOperational(OP.agentFeedback.update);

  const [tab, setTab] = useState<FeedbackTab>("submissions");
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [websiteFilter, setWebsiteFilter] = useState("");

  const settingsQuery = usePlatformAgentFeedbackQuery({ enabled: canView && tab === "form" });
  const updateMutation = useUpdatePlatformAgentFeedbackMutation();
  const submissionsQuery = useDistributionFeedbackSubmissionsQuery(
    submissionsPage,
    25,
    websiteFilter || undefined,
    { enabled: canView && tab === "submissions" },
  );

  const [form, setForm] = useState<PlatformAgentFeedbackSettingsBody>({});
  const [poorReasonsText, setPoorReasonsText] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!settingsQuery.data) return;
    setForm({
      ratingEnabled: settingsQuery.data.ratingEnabled,
      goodLabel: settingsQuery.data.goodLabel,
      poorLabel: settingsQuery.data.poorLabel,
      ratingRequired: settingsQuery.data.ratingRequired,
      notesEnabled: settingsQuery.data.notesEnabled,
      notesPlaceholder: settingsQuery.data.notesPlaceholder,
      notesSubmitLabel: settingsQuery.data.notesSubmitLabel,
      notesRequired: settingsQuery.data.notesRequired,
      poorFormTitle: settingsQuery.data.poorFormTitle,
      poorFormPrompt: settingsQuery.data.poorFormPrompt,
      poorSubmitLabel: settingsQuery.data.poorSubmitLabel,
      goodThankYouMessage: settingsQuery.data.goodThankYouMessage,
    });
    setPoorReasonsText(formatReasonOptions(settingsQuery.data.poorReasonOptions));
    setDirty(false);
  }, [settingsQuery.data]);

  const patch = useCallback((partial: PlatformAgentFeedbackSettingsBody) => {
    setForm((prev) => ({ ...prev, ...partial }));
    setDirty(true);
  }, []);

  const preview = useMemo(
    () => ({
      ratingEnabled: form.ratingEnabled ?? true,
      goodLabel: form.goodLabel?.trim() || "Good",
      poorLabel: form.poorLabel?.trim() || "Poor",
      notesEnabled: form.notesEnabled ?? true,
      notesPlaceholder:
        form.notesPlaceholder?.trim() ||
        "Add wrap-up notes for the next agent or supervisor…",
      notesSubmitLabel: form.notesSubmitLabel?.trim() || "Submit note",
      poorFormTitle: form.poorFormTitle?.trim() || "Feedback",
      poorFormPrompt: form.poorFormPrompt?.trim() || "Tell us what can be improved?",
      poorSubmitLabel: form.poorSubmitLabel?.trim() || "Submit",
      goodThankYouMessage: form.goodThankYouMessage?.trim() || "Thank you for your feedback.",
      poorReasonOptions: parseReasonOptionsText(poorReasonsText),
    }),
    [form, poorReasonsText],
  );

  const handleSave = async () => {
    if (!canUpdate) return;
    try {
      await updateMutation.mutateAsync({
        ...form,
        poorReasonOptions: parseReasonOptionsText(poorReasonsText),
      });
      setDirty(false);
      Alert.alert("Saved", "Feedback form saved.");
    } catch (err) {
      Alert.alert("Save failed", extractApiErrorMessage(err));
    }
  };

  if (!canView) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" muted>
            You do not have permission to view feedback.
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen scroll={tab === "form"} contentStyle={styles.screen}>
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Typography variant="boldLarge">Feedback</Typography>
        <Typography variant="medium" muted>
          Distribution email ratings and wrap-up notes.
        </Typography>
        <SegmentedControl
          options={[
            { label: "Submissions", value: "submissions" },
            { label: "Form settings", value: "form" },
          ]}
          value={tab}
          onChange={(v) => setTab(v as FeedbackTab)}
 />
      </View>

      {tab === "submissions" ? (
        <>
          <SelectField
            label="Website"
            value={websiteFilter}
            onChange={(v) => {
              setWebsiteFilter(v);
              setSubmissionsPage(1);
            }}
            options={[
              { label: "All websites", value: "" },
              ...(submissionsQuery.data?.websiteOptions ?? []).map((w) => ({
                label: w.name,
                value: w.id,
              })),
            ]}
            searchable={false}
 />
          {submissionsQuery.isLoading ? (
            <ActivityIndicator color={theme.app.dashboard.accentBlue} style={{ marginTop: 24 }} />
          ) : submissionsQuery.isError ? (
            <AppCard>
              <Typography variant="medium" color={theme.app.danger}>
                Could not load submissions.
              </Typography>
            </AppCard>
          ) : (
            <FlatList
              data={submissionsQuery.data?.items ?? []}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={{ gap: theme.spacing.sm }}
              ListEmptyComponent={
                <AppCard>
                  <Typography variant="medium" muted>
                    No feedback submissions yet.
                  </Typography>
                </AppCard>
              }
              renderItem={({ item }) => (
                <AppCard style={{ gap: 4 }}>
                  <Typography variant="medium16">
                    {item.rating ?? item.feedbackType} · {item.send.websiteName}
                  </Typography>
                  <Typography variant="small" muted>
                    {new Date(item.submittedAt).toLocaleString()} · {item.send.recipientEmail}
                  </Typography>
                  <Typography variant="small">{feedbackDetail(item)}</Typography>
                  {item.send.conversation ? (
                    <Typography variant="small" muted>
                      Chat #{item.send.conversation.shortId}
                    </Typography>
                  ) : null}
                </AppCard>
              )}
              ListFooterComponent={
                (submissionsQuery.data?.totalPages ?? 1) > 1 ? (
                  <TablePagination
                    page={submissionsPage}
                    pageCount={submissionsQuery.data?.totalPages ?? 1}
                    onPageChange={setSubmissionsPage}
 />
                ) : null
              }
  showsVerticalScrollIndicator={false}/>
          )}
        </>
      ) : (
        <ScrollView contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {settingsQuery.isLoading ? (
            <ActivityIndicator color={theme.app.dashboard.accentBlue} />
          ) : (
            <>
              <AppCard style={{ gap: theme.spacing.sm }}>
                <Typography variant="medium16">Rating in email</Typography>
                <View style={styles.switchRow}>
                  <Typography variant="medium">Show rating links</Typography>
                  <Switch
                    value={preview.ratingEnabled}
                    onValueChange={(v) => patch({ ratingEnabled: v })}
                    disabled={!canUpdate}
 />
                </View>
                <InputField
                  label="Good label"
                  value={preview.goodLabel}
                  onChangeText={(v) => patch({ goodLabel: v })}
                  editable={canUpdate && preview.ratingEnabled}
 />
                <InputField
                  label="Poor label"
                  value={preview.poorLabel}
                  onChangeText={(v) => patch({ poorLabel: v })}
                  editable={canUpdate && preview.ratingEnabled}
 />
              </AppCard>

              <AppCard style={{ gap: theme.spacing.sm }}>
                <Typography variant="medium16">Poor rating form</Typography>
                <InputField
                  label="Form title"
                  value={preview.poorFormTitle}
                  onChangeText={(v) => patch({ poorFormTitle: v })}
                  editable={canUpdate}
 />
                <InputField
                  label="Prompt"
                  value={preview.poorFormPrompt}
                  onChangeText={(v) => patch({ poorFormPrompt: v })}
                  editable={canUpdate}
 />
                <InputField
                  label="Reason chips (one per line)"
                  value={poorReasonsText}
                  onChangeText={(v) => {
                    setPoorReasonsText(v);
                    setDirty(true);
                  }}
                  editable={canUpdate}
                  multiline
 />
                <InputField
                  label="Submit button"
                  value={preview.poorSubmitLabel}
                  onChangeText={(v) => patch({ poorSubmitLabel: v })}
                  editable={canUpdate}
 />
              </AppCard>

              <AppCard style={{ gap: theme.spacing.sm }}>
                <Typography variant="medium16">Additional note</Typography>
                <View style={styles.switchRow}>
                  <Typography variant="medium">Show note link</Typography>
                  <Switch
                    value={preview.notesEnabled}
                    onValueChange={(v) => patch({ notesEnabled: v })}
                    disabled={!canUpdate}
 />
                </View>
                <InputField
                  label="Placeholder"
                  value={preview.notesPlaceholder}
                  onChangeText={(v) => patch({ notesPlaceholder: v })}
                  editable={canUpdate && preview.notesEnabled}
                  multiline
 />
              </AppCard>

              {canUpdate ? (
                <Button onPress={() => void handleSave()} disabled={!dirty || updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving…" : "Save form"}
                </Button>
              ) : null}
            </>
          )}
        </ScrollView>
      )}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
