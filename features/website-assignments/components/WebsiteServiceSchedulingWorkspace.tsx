import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';

import { MobileScreen } from '@/components/layout';
import {
  AppCard,
  Button,
  ConfirmActionModal,
  Checkbox,
  InputField,
  SelectField,
  Typography,
} from '@/components/ui';
import {
  useDeleteServiceSchedulingMutation,
  useSaveServiceSchedulingMutation,
  useServiceSchedulingQuery,
} from '@/features/chat-settings/hooks/useServiceScheduling';
import { useWebsiteAssignmentDetailQuery } from '@/lib/hooks/query/website-assignments/hooks';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useWebsiteAssignmentGates } from '@/lib/permissions/use-website-assignment-gates';
import {
  CHANNEL_MODE_OPTIONS,
  GAP_POLICY_OPTIONS,
  WEEKDAY_CODES,
  bundleToDraft,
  buildScheduleSaveBody,
  canShowExternalSlots,
  canShowInternalSlots,
  defaultSchedulingDraft,
  emptyScheduleWindow,
  isTwentyFourHourWindow,
  singleServiceWindow,
  twentyFourHourScheduleWindow,
  type ServiceSchedulingDraft,
  validateScheduleDraft,
} from '@/features/website-assignments/utils/service-scheduling-form.utils';
import type { OperatingChannels, ServiceScheduleWindow } from '@/services/chat/service-scheduling.types';
import { buildTimezoneSelectOptions } from '@/lib/utils/core/timezone-options';
import { glassUi } from '@/lib/theme/glass-ui';
import { useAppTheme } from '@/theme';

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
            { backgroundColor: `${accent}22`, borderColor: glassUi.border.subtle },
          ]}
        >
          <Typography variant="small" style={{ fontWeight: '800', color: accent }}>
            {step}
          </Typography>
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Typography variant="medium16" style={{ fontWeight: '800' }}>
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
          borderColor: selected ? `${accent}99` : theme.app.dashboard.cardBorder,
          backgroundColor: selected ? `${accent}14` : 'rgba(255,255,255,0.03)',
          opacity: disabled ? 0.55 : pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.choiceTop}>
        <Typography variant="small" style={{ fontWeight: '800', flex: 1 }}>
          {title}
        </Typography>
        <View
          style={[
            styles.radio,
            {
              borderColor: selected ? accent : theme.app.dashboard.cardBorder,
              backgroundColor: selected ? accent : 'transparent',
            },
          ]}
        >
          {selected ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
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
    onChange({ ...window, daysOfWeek: WEEKDAY_CODES.filter((d) => set.has(d)) });
  };

  const setTwentyFourHours = (enabled: boolean) => {
    if (!canEdit) return;
    onChange(enabled ? twentyFourHourScheduleWindow() : emptyScheduleWindow());
  };

  return (
    <View style={{ gap: 12 }}>
      {title ? (
        <Typography variant="medium16" style={{ fontWeight: '700' }}>
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
              borderColor: is24Hours ? `${accent}99` : theme.app.dashboard.cardBorder,
              backgroundColor: is24Hours ? `${accent}14` : 'rgba(255,255,255,0.03)',
              opacity: canEdit ? (pressed ? 0.92 : 1) : 0.6,
            },
          ]}
        >
          <View
            style={[
              styles.hours24Icon,
              { backgroundColor: `${accent}22`, borderColor: glassUi.border.subtle },
            ]}
          >
            <Ionicons name="time-outline" size={18} color={accent} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Typography variant="small" style={{ fontWeight: '800' }}>
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
              backgroundColor: 'rgba(255,255,255,0.03)',
            },
          ]}
        >
          <Typography variant="small" muted style={{ fontWeight: '600' }}>
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
                      borderColor: selected ? `${accent}99` : theme.app.dashboard.cardBorder,
                      backgroundColor: selected ? `${accent}22` : theme.app.dashboard.overlayLight,
                      opacity: canEdit ? 1 : 0.6,
                    },
                  ]}
                >
                  <Typography
                    variant="small"
                    style={{ fontWeight: selected ? '700' : '500' }}
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
                label="Start (HH:mm)"
                value={window.startTime}
                onChangeText={(v) => onChange({ ...window, startTime: v })}
                editable={canEdit}
                placeholder="09:00"
              />
            </View>
            <View style={{ flex: 1 }}>
              <InputField
                label="End (HH:mm)"
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
  const [draft, setDraft] = useState<ServiceSchedulingDraft>(defaultSchedulingDraft);

  const detailQuery = useWebsiteAssignmentDetailQuery(id, { enabled: gates.view && id.length > 0 });
  const schedulingQuery = useServiceSchedulingQuery(id, gates.view && id.length > 0);
  const saveMutation = useSaveServiceSchedulingMutation(id);
  const deleteMutation = useDeleteServiceSchedulingMutation(id);

  const detail = detailQuery.data?.data;
  const title = useMemo(
    () => detail?.name?.trim() || detail?.url?.trim() || id.slice(0, 8),
    [detail, id],
  );

  const allowExternalTwentyFourHours = draft.operatingChannels !== 'both';
  const timezoneOptions = useMemo(
    () => buildTimezoneSelectOptions(draft.internalTimezone || draft.externalTimezone),
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
  }, [schedulingQuery.data, schedulingQuery.isLoading, schedulingQuery.isError]);

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
      Alert.alert('Validation', err);
      return;
    }
    try {
      await saveMutation.mutateAsync(buildScheduleSaveBody(draft));
      Alert.alert('Saved', 'Service scheduling updated.');
    } catch (e) {
      Alert.alert('Save failed', extractApiErrorMessage(e));
    }
  };

  const onDelete = async () => {
    try {
      await deleteMutation.mutateAsync();
      setDeleteOpen(false);
      setDraft(defaultSchedulingDraft());
      Alert.alert('Removed', 'Service scheduling cleared.');
    } catch (err) {
      Alert.alert('Delete failed', extractApiErrorMessage(err));
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
  const showOfflineCloseHint = draft.gapPolicy === 'offline_message';

  return (
    <MobileScreen>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            {
              borderColor: theme.app.dashboard.cardBorder,
              backgroundColor: theme.app.dashboard.overlayLight,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Ionicons name="chevron-back" size={18} color={accent} />
          <Typography variant="small" style={{ fontWeight: '600', color: accent }}>
            Schedules
          </Typography>
        </Pressable>

        <View
          style={[
            styles.hero,
            {
              borderColor: theme.app.dashboard.cardBorder,
              backgroundColor: theme.app.dashboard.overlayLight,
            },
          ]}
        >
          <View style={[styles.heroGlow, { backgroundColor: `${accent}16` }]} />
          <View
            style={[
              styles.heroIcon,
              { backgroundColor: accent, borderColor: `${accent}66` },
            ]}
          >
            <Ionicons name="time-outline" size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Typography variant="medium16" style={{ fontWeight: '800' }} numberOfLines={2}>
              {title}
            </Typography>
            {detail?.url ? (
              <Typography variant="small" muted numberOfLines={1}>
                {detail.url}
              </Typography>
            ) : null}
            <Typography variant="small" muted>
              Operating mode, outside-hours policy, and service windows.
            </Typography>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={accent} />
        ) : schedulingQuery.isError ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(schedulingQuery.error, 'Could not load service scheduling.')}
            </Typography>
            <Button size="compact" variant="outlined" onPress={() => void schedulingQuery.refetch()}>
              Retry
            </Button>
          </AppCard>
        ) : (
          <>
            <SectionCard
              step={1}
              title="Operating mode"
              subtitle="Controls internal, external, or both channels for this website."
            >
              <View style={{ gap: 8 }}>
                {CHANNEL_MODE_OPTIONS.map((opt) => (
                  <ChoiceCard
                    key={opt.value}
                    selected={draft.operatingChannels === opt.value}
                    disabled={!canEdit}
                    title={opt.label}
                    description={opt.description}
                    onPress={() =>
                      setDraft((p) => ({ ...p, operatingChannels: opt.value as OperatingChannels }))
                    }
                  />
                ))}
              </View>

              {draft.operatingChannels === 'both' ? (
                <View
                  style={[
                    styles.infoBanner,
                    { borderColor: theme.app.dashboard.cardBorder, backgroundColor: 'rgba(255,255,255,0.04)' },
                  ]}
                >
                  <Ionicons name="information-circle-outline" size={18} color={accent} />
                  <Typography variant="small" muted style={{ flex: 1 }}>
                    Internal can run 24/7 while external uses fixed duty hours. During external hours,
                    chats go to external agents first; if busy or offline, internal primary agents
                    receive the chat.
                  </Typography>
                </View>
              ) : null}

              <Typography variant="small" style={{ fontWeight: '800', marginTop: 4 }}>
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
                    onPress={() => setDraft((p) => ({ ...p, gapPolicy: opt.value }))}
                  />
                ))}
              </View>

              {showOfflineCloseHint ? (
                <View
                  style={[
                    styles.offlinePanel,
                    {
                      borderColor: 'rgba(251, 146, 60, 0.45)',
                      backgroundColor: 'rgba(251, 146, 60, 0.10)',
                    },
                  ]}
                >
                  <View style={styles.offlineHeader}>
                    <View
                      style={[
                        styles.offlineIcon,
                        {
                          backgroundColor: 'rgba(251, 146, 60, 0.2)',
                          borderColor: 'rgba(251, 146, 60, 0.35)',
                        },
                      ]}
                    >
                      <Ionicons name="moon-outline" size={18} color="#FB923C" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="small" style={{ fontWeight: '800' }}>
                        Offline / close form
                      </Typography>
                      <Typography variant="small" muted>
                        When agents are outside schedule, visitors see your offline message — chats
                        are not queued.
                      </Typography>
                    </View>
                  </View>
                  <Typography variant="small" muted>
                    Configure the exact offline / close-policy copy under Chat settings → Close
                    policy for this website.
                  </Typography>
                  <Button
                    size="compact"
                    variant="outlined"
                    onPress={() => router.push('/chat-settings/close-policy' as Href)}
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
                  label="Internal timezone"
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
                      startTime: '09:00',
                      endTime: '18:00',
                    }
                  }
                  canEdit={canEdit}
                  allowTwentyFourHours
                  onChange={(w) =>
                    setDraft((p) => ({ ...p, internalWindows: singleServiceWindow([w]) }))
                  }
                />
              </SectionCard>
            ) : null}

            {canShowExternalSlots(draft.operatingChannels) ? (
              <SectionCard
                step={2}
                title="External service hours"
                subtitle={
                  canShowInternalSlots(draft.operatingChannels)
                    ? 'When external agents are on duty — separate from internal hours.'
                    : 'When external agents are on duty for this website.'
                }
              >
                <SelectField
                  label="External timezone"
                  value={draft.externalTimezone}
                  onChange={(tz) => setDraft((p) => ({ ...p, externalTimezone: tz }))}
                  options={timezoneOptions}
                  disabled={!canEdit}
                  searchable
                />
                <WindowEditor
                  title=""
                  window={
                    draft.externalWindows[0] ?? {
                      daysOfWeek: [],
                      startTime: '09:00',
                      endTime: '18:00',
                    }
                  }
                  canEdit={canEdit}
                  allowTwentyFourHours={allowExternalTwentyFourHours}
                  onChange={(w) =>
                    setDraft((p) => ({ ...p, externalWindows: singleServiceWindow([w]) }))
                  }
                />
              </SectionCard>
            ) : null}

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
                  <Typography variant="small" style={{ fontWeight: '800' }}>
                    Save schedule
                  </Typography>
                  <Typography variant="small" muted>
                    Operating mode and service hours only.
                  </Typography>
                </View>
                <Button onPress={() => void onSave()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving…' : 'Save'}
                </Button>
              </View>
            ) : null}

            <Button
              variant="outlined"
              onPress={() =>
                router.push(`/website-assigning/website/${id}/inquire-topics` as Href)
              }
            >
              Visitor topics
            </Button>

            {canEdit && schedulingQuery.data ? (
              <Button variant="danger" onPress={() => setDeleteOpen(true)}>
                Clear scheduling
              </Button>
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
  backBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  heroGlow: {
    position: 'absolute',
    top: -36,
    right: -16,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  section: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  choiceCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  choiceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hours24Card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  hours24Icon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  windowCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  timeRow: { flexDirection: 'row', gap: 10 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  offlineHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  offlineIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  saveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
});
