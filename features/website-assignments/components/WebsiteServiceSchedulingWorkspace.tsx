import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import { MobileScreen } from "@/components/layout";
import {
    AppCard,
    Button,
    Checkbox,
    ConfirmActionModal,
    InputField,
    SelectField,
    Typography,
} from "@/components/ui";
import {
    useDeleteServiceSchedulingMutation,
    useSaveServiceSchedulingMutation,
    useServiceSchedulingQuery,
} from "@/features/chat-settings/hooks/useServiceScheduling";
import {
    CHANNEL_MODE_OPTIONS,
    GAP_POLICY_OPTIONS,
    WEEKDAY_CODES,
    buildScheduleSaveBody,
    bundleToDraft,
    canShowExternalSlots,
    canShowInternalSlots,
    defaultSchedulingDraft,
    emptyScheduleWindow,
    isTwentyFourHourWindow,
    singleServiceWindow,
    twentyFourHourScheduleWindow,
    validateScheduleDraft,
    type ServiceSchedulingDraft,
} from "@/features/website-assignments/utils/service-scheduling-form.utils";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useWebsiteAssignmentDetailQuery } from "@/lib/hooks/query/website-assignments/hooks";
import { useWebsiteAssignmentGates } from "@/lib/permissions/use-website-assignment-gates";
import { glassUi } from "@/lib/theme/glass-ui";
import { buildTimezoneSelectOptions } from "@/lib/utils/core/timezone-options";
import type {
    OperatingChannels,
    ServiceScheduleWindow,
} from "@/services/chat/service-scheduling.types";
import { useAppTheme } from "@/theme";

export type WebsiteServiceSchedulingWorkspaceProps = {
  websiteId: string;
};

function SectionCard({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  return (
    <View
      style={[
        styles.section,
        {
          borderColor: theme.app.dashboard.cardBorder,
          backgroundColor: theme.app.dashboard.overlayLight,
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.stepBadge,
            {
              backgroundColor: `${accent}22`,
              borderColor: glassUi.border.subtle,
            },
          ]}
        >
          <Typography
            variant="small"
            style={{ fontWeight: "800", color: accent }}
          >
            {step}
          </Typography>
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Typography variant="medium16" style={{ fontWeight: "800" }}>
            {title}
          </Typography>
          <Typography variant="small" muted>
            {subtitle}
          </Typography>
        </View>
      </View>
      <View style={{ gap: 12 }}>{children}</View>
    </View>
  );
}

function ChoiceCard({
  selected,
  disabled,
  title,
  description,
  onPress,
}: {
  selected: boolean;
  disabled?: boolean;
  title: string;
  description: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choiceCard,
        {
          borderColor: selected
            ? `${accent}99`
            : theme.app.dashboard.cardBorder,
          backgroundColor: selected ? `${accent}14` : "rgba(255,255,255,0.03)",
          opacity: disabled ? 0.55 : pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.choiceTop}>
        <Typography variant="small" style={{ fontWeight: "800", flex: 1 }}>
          {title}
        </Typography>
        <View
          style={[
            styles.radio,
            {
              borderColor: selected ? accent : theme.app.dashboard.cardBorder,
              backgroundColor: selected ? accent : "transparent",
            },
          ]}
        >
          {selected ? (
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          ) : null}
        </View>
      </View>
      <Typography variant="small" muted>
        {description}
      </Typography>
    </Pressable>
  );
}

function WindowEditor({
  title,
  window,
  canEdit,
  onChange,
  allowTwentyFourHours = true,
}: {
  title: string;
  window: ServiceScheduleWindow;
  canEdit: boolean;
  onChange: (next: ServiceScheduleWindow) => void;
  allowTwentyFourHours?: boolean;
}) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const days = window.daysOfWeek ?? [];
  const is24Hours = isTwentyFourHourWindow(window);

  const toggleDay = (day: string) => {
    if (!canEdit || is24Hours) return;
    const set = new Set(days);
    if (set.has(day)) set.delete(day);
    else set.add(day);
    onChange({
      ...window,
      daysOfWeek: WEEKDAY_CODES.filter((d) => set.has(d)),
    });
  };

  const setTwentyFourHours = (enabled: boolean) => {
    if (!canEdit) return;
    onChange(enabled ? twentyFourHourScheduleWindow() : emptyScheduleWindow());
  };

  return (
    <View style={{ gap: 12 }}>
      {title ? (
        <Typography variant="medium16" style={{ fontWeight: "700" }}>
          {title}
        </Typography>
      ) : null}

      {allowTwentyFourHours ? (
        <Pressable
          disabled={!canEdit}
          onPress={() => setTwentyFourHours(!is24Hours)}
          style={({ pressed }) => [
            styles.hours24Card,
            {
              borderColor: is24Hours
                ? `${accent}99`
                : theme.app.dashboard.cardBorder,
              backgroundColor: is24Hours
                ? `${accent}14`
                : "rgba(255,255,255,0.03)",
              opacity: canEdit ? (pressed ? 0.92 : 1) : 0.6,
            },
          ]}
        >
          <View
            style={[
              styles.hours24Icon,
              {
                backgroundColor: `${accent}22`,
                borderColor: glassUi.border.subtle,
              },
            ]}
          >
            <Ionicons name="time-outline" size={18} color={accent} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Typography variant="small" style={{ fontWeight: "800" }}>
              24 hours
            </Typography>
            <Typography variant="small" muted>
              Site accepts chats all week, around the clock.
            </Typography>
          </View>
          <Checkbox
            checked={is24Hours}
            disabled={!canEdit}
            onChange={(next) => setTwentyFourHours(next)}
 />
        </Pressable>
      ) : null}

      {allowTwentyFourHours && is24Hours ? (
        <View
          style={[
            styles.infoBanner,
            {
              borderColor: `${accent}44`,
              backgroundColor: `${accent}12`,
            },
          ]}
        >
          <Ionicons name="sunny-outline" size={18} color={accent} />
          <Typography variant="small" muted style={{ flex: 1 }}>
            Service is open 24/7 (Sun–Sat). Save when you are done.
          </Typography>
        </View>
      ) : (
        <View
          style={[
            styles.windowCard,
            {
              borderColor: theme.app.dashboard.cardBorder,
              backgroundColor: "rgba(255,255,255,0.03)",
            },
          ]}
        >
          <Typography variant="small" muted style={{ fontWeight: "600" }}>
            Days of week
          </Typography>
          <View style={styles.dayRow}>
            {WEEKDAY_CODES.map((day) => {
              const selected = days.includes(day);
              return (
                <Pressable
                  key={day}
                  disabled={!canEdit}
                  onPress={() => toggleDay(day)}
                  style={[
                    styles.dayChip,
                    {
                      borderColor: selected
                        ? `${accent}99`
                        : theme.app.dashboard.cardBorder,
                      backgroundColor: selected
                        ? `${accent}22`
                        : theme.app.dashboard.overlayLight,
                      opacity: canEdit ? 1 : 0.6,
                    },
                  ]}
                >
                  <Typography
                    variant="small"
                    style={{ fontWeight: selected ? "700" : "500" }}
                    color={selected ? accent : theme.app.text.secondary}
                  >
                    {day}
                  </Typography>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}>
              <InputField
                label="Start time"
                value={window.startTime}
                onChangeText={(v) => onChange({ ...window, startTime: v })}
                editable={canEdit}
                placeholder="09:00"
 />
            </View>
            <View style={{ flex: 1 }}>
              <InputField
                label="End time"
                value={window.endTime}
                onChangeText={(v) => onChange({ ...window, endTime: v })}
                editable={canEdit}
                placeholder="18:00"
 />
            </View>
          </View>
          <Checkbox
            checked={Boolean(window.crossesMidnight)}
            disabled={!canEdit}
            label="Crosses midnight"
            onChange={(next) => onChange({ ...window, crossesMidnight: next })}
 />
        </View>
      )}
    </View>
  );
}

/** Per-website service hours — create / edit / clear. */
export function WebsiteServiceSchedulingWorkspace({
  websiteId,
}: WebsiteServiceSchedulingWorkspaceProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const gates = useWebsiteAssignmentGates();
  const canEdit = gates.assign;
  const accent = theme.app.dashboard.accentBlue;
  const id = websiteId.trim();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draft, setDraft] = useState<ServiceSchedulingDraft>(
    defaultSchedulingDraft,
  );

  const detailQuery = useWebsiteAssignmentDetailQuery(id, {
    enabled: gates.view && id.length > 0,
  });
  const schedulingQuery = useServiceSchedulingQuery(
    id,
    gates.view && id.length > 0,
  );
  const saveMutation = useSaveServiceSchedulingMutation(id);
  const deleteMutation = useDeleteServiceSchedulingMutation(id);

  const detail = detailQuery.data?.data;
  const title = useMemo(
    () => detail?.name?.trim() || detail?.url?.trim() || id.slice(0, 8),
    [detail, id],
  );

  const allowExternalTwentyFourHours = draft.operatingChannels !== "both";
  const timezoneOptions = useMemo(
    () =>
      buildTimezoneSelectOptions(
        draft.internalTimezone || draft.externalTimezone,
      ),
    [draft.internalTimezone, draft.externalTimezone],
  );

  useEffect(() => {
    if (schedulingQuery.data) {
      setDraft(bundleToDraft(schedulingQuery.data));
      return;
    }
    if (!schedulingQuery.isLoading && !schedulingQuery.isError) {
      setDraft(defaultSchedulingDraft());
    }
  }, [
    schedulingQuery.data,
    schedulingQuery.isLoading,
    schedulingQuery.isError,
  ]);

  /** When both channels: external cannot stay on 24/7 — reset to duty hours. */
  useEffect(() => {
    if (allowExternalTwentyFourHours) return;
    const ext = draft.externalWindows[0];
    if (!ext || !isTwentyFourHourWindow(ext)) return;
    setDraft((p) => ({
      ...p,
      externalWindows: singleServiceWindow([emptyScheduleWindow()]),
    }));
  }, [allowExternalTwentyFourHours, draft.externalWindows]);

  const onSave = async () => {
    const err = validateScheduleDraft(draft);
    if (err) {
      Alert.alert("Validation", err);
      return;
    }
    try {
      await saveMutation.mutateAsync(buildScheduleSaveBody(draft));
      router.replace(
        `/website-assigning/website/${encodeURIComponent(id)}` as Href,
      );
    } catch (e) {
      Alert.alert("Save failed", extractApiErrorMessage(e));
    }
  };

  const onDelete = async () => {
    try {
      await deleteMutation.mutateAsync();
      setDeleteOpen(false);
      setDraft(defaultSchedulingDraft());
      Alert.alert("Removed", "Service scheduling cleared.");
    } catch (err) {
      Alert.alert("Delete failed", extractApiErrorMessage(err));
    }
  };

  if (!gates.view) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" muted>
            You do not have permission to manage service scheduling.
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  const loading = detailQuery.isLoading || schedulingQuery.isLoading;
  const showOfflineCloseHint = draft.gapPolicy === "offline_message";
  const hoursReady = Boolean(
    detail?.serviceSchedulingConfigured || detail?.serviceHoursConfigured,
  );
  const shortId = id.slice(0, 8);

  const FLOW_STEPS = [
    { key: "website", title: "Website", subtitle: "Organization & site", done: true },
    { key: "scheduling", title: "Scheduling", subtitle: "Service hours", active: true },
    { key: "roster", title: "Agent roster", subtitle: "Primary / Backup" },
    { key: "complete", title: "Complete", subtitle: "Ready for chat" },
  ] as const;

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
       showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.push("/website-assigning" as Href)}
            style={({ pressed }) => [
              styles.backBtn,
              {
                borderColor: theme.app.dashboard.cardBorder,
                backgroundColor: theme.app.dashboard.overlayLight,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <Typography variant="small" style={{ fontWeight: "600" }}>
              ← All schedules
            </Typography>
          </Pressable>
          <View style={styles.topActions}>
            <Button
              size="compact"
              variant="outlined"
              onPress={() =>
                router.push(
                  `/website-assigning/website/${encodeURIComponent(id)}/inquire-topics` as Href,
                )
              }
            >
              Inquire topics
            </Button>
            {canEdit && schedulingQuery.data ? (
              <Button
                size="compact"
                variant="outlined"
                onPress={() => setDeleteOpen(true)}
              >
                Delete schedule
              </Button>
            ) : null}
          </View>
        </View>

        <Typography variant="boldLarge">Service scheduling</Typography>

        <View style={styles.stepRow}>
          {FLOW_STEPS.map((step, index) => {
            const active = "active" in step && step.active;
            const done = "done" in step && step.done;
            return (
              <View
                key={step.key}
                style={[
                  styles.stepCard,
                  {
                    borderColor: active ? accent : theme.app.dashboard.cardBorder,
                    backgroundColor: theme.app.dashboard.overlayLight,
                    opacity: active || done ? 1 : 0.55,
                  },
                  active ? styles.stepCardActive : null,
                ]}
              >
                <View style={styles.stepCardTop}>
                  <Typography variant="small" muted style={{ fontWeight: "700" }}>
                    {index + 1}
                  </Typography>
                  {done ? (
                    <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  ) : null}
                </View>
                <Typography variant="medium" style={{ fontWeight: "700" }} numberOfLines={1}>
                  {step.title}
                </Typography>
                <Typography variant="small" muted numberOfLines={2}>
                  {step.subtitle}
                </Typography>
              </View>
            );
          })}
        </View>

        <View
          style={[
            styles.siteCard,
            {
              borderColor: theme.app.dashboard.cardBorder,
              backgroundColor: theme.app.dashboard.overlayLight,
            },
          ]}
        >
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Typography variant="small" muted style={{ fontWeight: "700" }}>
              {shortId}
            </Typography>
            <Typography variant="medium16" style={{ fontWeight: "700" }} numberOfLines={2}>
              {detail?.url?.trim() || title}
            </Typography>
          </View>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: hoursReady
                  ? "rgba(34, 197, 94, 0.16)"
                  : "rgba(251, 146, 60, 0.16)",
                borderColor: hoursReady
                  ? "rgba(34, 197, 94, 0.4)"
                  : "rgba(251, 146, 60, 0.4)",
              },
            ]}
          >
            <Typography
              variant="small"
              style={{
                fontWeight: "700",
                color: hoursReady ? "#4ade80" : "#fb923c",
              }}
            >
              {hoursReady ? "Schedule ready" : "Please add schedule"}
            </Typography>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={accent} />
        ) : schedulingQuery.isError ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(
                schedulingQuery.error,
                "Could not load service scheduling.",
              )}
            </Typography>
            <Button
              size="compact"
              variant="outlined"
              onPress={() => void schedulingQuery.refetch()}
            >
              Retry
            </Button>
          </AppCard>
        ) : (
          <>
            <View
              style={[
                styles.formShell,
                {
                  borderColor: theme.app.dashboard.cardBorder,
                  backgroundColor: theme.app.dashboard.overlayLight,
                },
              ]}
            >
              <Typography variant="small" muted>
                Set operating mode and service hours for this website.
              </Typography>
              <View style={styles.sectionTabs}>
                <View
                  style={[
                    styles.sectionTab,
                    { borderColor: accent, backgroundColor: `${accent}22` },
                  ]}
                >
                  <Typography variant="small" style={{ fontWeight: "700", color: accent }}>
                    1. Mode & policy
                  </Typography>
                </View>
                <View
                  style={[
                    styles.sectionTab,
                    { borderColor: accent, backgroundColor: `${accent}22` },
                  ]}
                >
                  <Typography variant="small" style={{ fontWeight: "700", color: accent }}>
                    2. Service hours
                  </Typography>
                </View>
              </View>

              <SectionCard
                step={1}
                title="Operating mode"
                subtitle="Channel mode and what happens outside service hours."
              >
                <SelectField
                  label="Operating mode"
                  value={draft.operatingChannels}
                  onChange={(v) =>
                    setDraft((p) => ({
                      ...p,
                      operatingChannels: v as OperatingChannels,
                    }))
                  }
                  options={CHANNEL_MODE_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                  disabled={!canEdit}
 />

                {draft.operatingChannels === "both" ? (
                  <View
                    style={[
                      styles.infoBanner,
                      {
                        borderColor: theme.app.dashboard.cardBorder,
                        backgroundColor: "rgba(255,255,255,0.04)",
                      },
                    ]}
                  >
                    <Ionicons name="information-circle-outline" size={18} color={accent} />
                    <Typography variant="small" muted style={{ flex: 1 }}>
                      Internal can run 24/7 while external uses fixed duty hours.
                    </Typography>
                  </View>
                ) : null}

                <Typography variant="small" style={{ fontWeight: "800" }}>
                  Outside service hours
                </Typography>
                <View style={{ gap: 8 }}>
                  {GAP_POLICY_OPTIONS.map((opt) => (
                    <ChoiceCard
                      key={opt.value}
                      selected={draft.gapPolicy === opt.value}
                      disabled={!canEdit}
                      title={opt.label}
                      description={opt.description}
                      onPress={() =>
                        setDraft((p) => ({ ...p, gapPolicy: opt.value }))
                      }
 />
                  ))}
                </View>

                {showOfflineCloseHint ? (
                  <View
                    style={[
                      styles.offlinePanel,
                      {
                        borderColor: "rgba(251, 146, 60, 0.45)",
                        backgroundColor: "rgba(251, 146, 60, 0.10)",
                      },
                    ]}
                  >
                    <Typography variant="small" style={{ fontWeight: "800" }}>
                      Offline / close form
                    </Typography>
                    <Typography variant="small" muted>
                      Configure offline message under Chat settings → Close policy.
                    </Typography>
                    <Button
                      size="compact"
                      variant="outlined"
                      onPress={() =>
                        router.push("/chat-settings/close-policy" as Href)
                      }
                    >
                      Open close policy
                    </Button>
                  </View>
                ) : null}
              </SectionCard>

              {canShowInternalSlots(draft.operatingChannels) ? (
                <SectionCard
                  step={2}
                  title="Internal service hours"
                  subtitle="Wall-clock hours for internal agents in this site's timezone."
                >
                  <SelectField
                    label="Internal timezone (IANA)"
                    value={draft.internalTimezone}
                    onChange={(tz) =>
                      setDraft((p) => ({
                        ...p,
                        internalTimezone: tz,
                        timezone: tz,
                      }))
                    }
                    options={timezoneOptions}
                    disabled={!canEdit}
                    searchable
 />
                  <WindowEditor
                    title=""
                    window={
                      draft.internalWindows[0] ?? {
                        daysOfWeek: [],
                        startTime: "09:00",
                        endTime: "18:00",
                      }
                    }
                    canEdit={canEdit}
                    allowTwentyFourHours
                    onChange={(w) =>
                      setDraft((p) => ({
                        ...p,
                        internalWindows: singleServiceWindow([w]),
                      }))
                    }
 />
                </SectionCard>
              ) : null}

              {canShowExternalSlots(draft.operatingChannels) ? (
                <SectionCard
                  step={2}
                  title="External service hours"
                  subtitle="When external agents are on duty for this website."
                >
                  <SelectField
                    label="External timezone (IANA)"
                    value={draft.externalTimezone}
                    onChange={(tz) =>
                      setDraft((p) => ({ ...p, externalTimezone: tz }))
                    }
                    options={timezoneOptions}
                    disabled={!canEdit}
                    searchable
 />
                  <WindowEditor
                    title=""
                    window={
                      draft.externalWindows[0] ?? {
                        daysOfWeek: [],
                        startTime: "09:00",
                        endTime: "18:00",
                      }
                    }
                    canEdit={canEdit}
                    allowTwentyFourHours={allowExternalTwentyFourHours}
                    onChange={(w) =>
                      setDraft((p) => ({
                        ...p,
                        externalWindows: singleServiceWindow([w]),
                      }))
                    }
 />
                </SectionCard>
              ) : null}
            </View>

            {canEdit ? (
              <View
                style={[
                  styles.saveBar,
                  {
                    borderColor: theme.app.dashboard.cardBorder,
                    backgroundColor: theme.app.dashboard.overlayLight,
                  },
                ]}
              >
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Typography variant="small" style={{ fontWeight: "800" }}>
                    Save schedule
                  </Typography>
                  <Typography variant="small" muted>
                    Only saves mode and service hours (not inquire topics).
                  </Typography>
                </View>
                <Button
                  onPress={() => void onSave()}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? "Saving…" : "Save schedule"}
                </Button>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <ConfirmActionModal
        open={deleteOpen}
        title="Clear service scheduling?"
        description="Removes hours for this website."
        confirmLabel="Clear"
        confirmButtonVariant="danger"
        isLoading={deleteMutation.isPending}
        onDismiss={() => setDeleteOpen(false)}
        onConfirm={() => void onDelete()}
 />
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 8 },
  scroll: { paddingTop: 4, paddingBottom: 40 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  topActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  backBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  stepRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  stepCard: {
    flexGrow: 1,
    flexBasis: "45%",
    minWidth: 140,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    gap: 2,
  },
  stepCardActive: { borderWidth: 2 },
  stepCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  siteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  formShell: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  sectionTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sectionTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  section: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  choiceCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  choiceTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  hours24Card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  hours24Icon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  windowCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  dayRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  timeRow: { flexDirection: "row", gap: 10 },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  offlinePanel: {
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  saveBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
});
