import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';

import type {
  ServiceChannel,
  WebsiteAssignmentTier,
} from '@/api/types/website-assignments.types';
import { MobileScreen } from '@/components/layout';
import {
  AppCard,
  Button,
  Checkbox,
  SearchBar,
  SelectField,
  Typography,
} from '@/components/ui';
import { useVisitorTopicsQuery } from '@/features/chat-settings/hooks/useServiceScheduling';
import { useQaRosterExclusionsQuery } from '@/features/chat-settings/hooks/useChatSettings';
import { extractApiErrorMessage } from '@/lib/api/errors';
import {
  useDepartmentRosterCoverageQuery,
  usePutDepartmentRosterCoverageMutation,
  usePutDepartmentRosterMutation,
  useWebsiteAssignmentDetailQuery,
} from '@/lib/hooks/query/website-assignments';
import { useUsersListQuery } from '@/lib/hooks/query/users';
import { useWebsiteAssignmentGates } from '@/lib/permissions/use-website-assignment-gates';
import {
  resolveRosterDepartmentId,
  rosterAssignmentUiChannels,
  rosterVisibleTiers,
} from '@/lib/website-assignments/roster-assignment-channels';
import { glassUi } from '@/lib/theme/glass-ui';
import { buildRosterUserOptions } from '@/features/website-assignments/utils/roster-user-options';
import {
  blocksFromCoverage,
  blocksToPutPayload,
  formatCoverageBlockHoursLabel,
  splitServiceHoursIntoBlocks,
  type CoverageBlockDraft,
} from '@/features/website-assignments/utils/coverage-block-draft.utils';
import { draftToChannelBody, slotsFromRoster } from '@/features/website-assignments/utils/roster-draft.utils';
import { emptySlotDraft, type SlotDraft } from '@/features/website-assignments/components/RosterSlotPicker';
import { useAppTheme } from '@/theme';

export type WebsiteAssignmentDetailPageProps = {
  websiteId: string;
};

function operatingModeLabel(mode?: string | null): string {
  switch (mode) {
    case 'internal_only':
      return 'Internal only';
    case 'external_only':
      return 'External only';
    case 'both':
      return 'Internal + External';
    default:
      return mode?.trim() || '—';
  }
}

function formatHoursLabel(hours: {
  startTime?: string;
  endTime?: string;
  timezone?: string;
  daysOfWeekLabels?: string[];
} | null | undefined): string {
  if (!hours) return 'Service hours not configured yet.';
  const days = (hours.daysOfWeekLabels ?? []).join(', ');
  const start = hours.startTime ?? '—';
  const end = hours.endTime ?? '—';
  const tz = hours.timezone ?? '';
  return `${start} – ${end}${tz ? ` (${tz})` : ''}${days ? ` — ${days}` : ''}`;
}

const TIER_BADGE: Record<
  WebsiteAssignmentTier,
  { bg: string; border: string; color: string }
> = {
  Primary: { bg: 'rgba(34,197,94,0.18)', border: 'rgba(34,197,94,0.45)', color: '#4ade80' },
  Secondary: { bg: 'rgba(59,130,246,0.18)', border: 'rgba(59,130,246,0.45)', color: '#60a5fa' },
  Backup: { bg: 'rgba(245,158,11,0.18)', border: 'rgba(245,158,11,0.45)', color: '#fbbf24' },
};

export function WebsiteAssignmentDetailPage({ websiteId }: WebsiteAssignmentDetailPageProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const gates = useWebsiteAssignmentGates();
  const accent = theme.app.dashboard.accentBlue;
  const id = websiteId.trim();

  const [channel, setChannel] = useState<ServiceChannel>('Internal');
  const [departmentId, setDepartmentId] = useState('');
  const [assignMode, setAssignMode] = useState<'same_day' | 'by_time'>('same_day');
  const [dutyBlocks, setDutyBlocks] = useState<CoverageBlockDraft[] | null>(null);
  const [activeBlockIndex, setActiveBlockIndex] = useState(0);
  const [userFilter, setUserFilter] = useState<'all' | 'Internal' | 'External'>('all');
  const [search, setSearch] = useState('');
  const [slots, setSlots] = useState<SlotDraft>(() => emptySlotDraft());

  const detailQuery = useWebsiteAssignmentDetailQuery(id, {
    enabled: gates.view && id.length > 0,
  });
  const topicsQuery = useVisitorTopicsQuery(id, gates.view && id.length > 0);
  const exclusionsQuery = useQaRosterExclusionsQuery(id, gates.view && id.length > 0);

  const detail = detailQuery.data?.data;
  const departments = detail?.departmentRoster ?? [];
  const operatingChannels = detail?.operatingChannels ?? 'internal_only';
  const visibleTiers = useMemo(
    () => rosterVisibleTiers(operatingChannels),
    [operatingChannels],
  );
  const showSecondary = visibleTiers.includes('Secondary');

  useEffect(() => {
    const channels = detail?.allowedAssignmentChannels?.length
      ? detail.allowedAssignmentChannels
      : rosterAssignmentUiChannels(operatingChannels);
    if (channels.length && !channels.includes(channel)) {
      setChannel(channels[0]);
    }
  }, [detail?.allowedAssignmentChannels, operatingChannels, channel]);

  useEffect(() => {
    if (!detail) return;
    const resolved = resolveRosterDepartmentId(channel, departmentId, departments);
    if (resolved && resolved !== departmentId) setDepartmentId(resolved);
  }, [detail, channel, departmentId, departments]);

  const coverageQuery = useDepartmentRosterCoverageQuery(id, departmentId, channel, {
    enabled: gates.view && id.length > 0 && departmentId.trim().length > 0,
  });

  const internalUsersQuery = useUsersListQuery(
    { all: true, userType: 'Internal' },
    { enabled: gates.view && id.length > 0 },
  );
  const externalUsersQuery = useUsersListQuery(
    { all: true, userType: 'External' },
    { enabled: gates.view && id.length > 0 },
  );

  const putRoster = usePutDepartmentRosterMutation(id);
  const putCoverage = usePutDepartmentRosterCoverageMutation(id, departmentId, channel);

  useEffect(() => {
    const coverage = coverageQuery.data;
    if (!coverage) return;
    if (coverage.mode === 'blocks' && coverage.blocks.length > 0) {
      const blocks = blocksFromCoverage(coverage);
      setDutyBlocks(blocks);
      setAssignMode('by_time');
      setActiveBlockIndex(0);
      setSlots(blocks[0]?.roster ?? emptySlotDraft());
      return;
    }
    setDutyBlocks(null);
    setSlots(slotsFromRoster(coverage.legacyRoster));
  }, [coverageQuery.dataUpdatedAt, departmentId, channel]);

  const departmentOptions = useMemo(() => {
    if (departments.length === 0) {
      return [{ value: '', label: 'No departments — using website default' }];
    }
    return departments.map((d) => ({
      value: d.departmentId,
      label: d.departmentName || d.departmentId,
    }));
  }, [departments]);

  const channelOptions = useMemo(() => {
    const allowed = detail?.allowedAssignmentChannels?.length
      ? detail.allowedAssignmentChannels
      : rosterAssignmentUiChannels(operatingChannels);
    return allowed.map((c) => ({ value: c, label: c }));
  }, [detail?.allowedAssignmentChannels, operatingChannels]);

  const excludedIds = useMemo(() => {
    const ex = exclusionsQuery.data;
    if (!ex) return new Set<string>();
    return new Set([...ex.chatAgentUserIds, ...ex.qaReviewerUserIds]);
  }, [exclusionsQuery.data]);

  const userOptions = useMemo(() => {
    const dept = departmentId.trim() || departments[0]?.departmentId || '';
    const internal = buildRosterUserOptions(internalUsersQuery.data, dept, 'Internal');
    const external = buildRosterUserOptions(externalUsersQuery.data, dept, 'External');
    return [...internal, ...external].map((u) => {
      if (!excludedIds.has(u.id)) return u;
      return {
        ...u,
        disabled: true,
        disabledReason: u.disabledReason ?? 'Excluded from this website roster',
      };
    });
  }, [
    internalUsersQuery.data,
    externalUsersQuery.data,
    departmentId,
    departments,
    excludedIds,
  ]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return userOptions.filter((u) => {
      if (userFilter !== 'all' && u.userType !== userFilter) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.department ?? '').toLowerCase().includes(q) ||
        (u.pool ?? '').toLowerCase().includes(q)
      );
    });
  }, [userOptions, userFilter, search]);

  const selectedAgents = useMemo(() => {
    const byId = new Map(userOptions.map((u) => [u.id, u]));
    const rows: {
      id: string;
      name: string;
      email?: string;
      userType: 'Internal' | 'External';
      department?: string;
      pool?: string;
      tier: WebsiteAssignmentTier;
    }[] = [];
    const pushTier = (tier: WebsiteAssignmentTier, ids: string[]) => {
      for (const id of ids) {
        const u = byId.get(id);
        rows.push({
          id: `${tier}-${id}`,
          name: u?.name ?? id.slice(0, 8),
          email: u?.email,
          userType: u?.userType ?? 'Internal',
          department: u?.department,
          pool: u?.pool,
          tier,
        });
      }
    };
    pushTier('Primary', slots.Primary);
    if (showSecondary) pushTier('Secondary', slots.Secondary);
    pushTier('Backup', slots.Backup);
    return rows;
  }, [userOptions, slots, showSecondary]);

  const applySlots = (next: SlotDraft) => {
    setSlots(next);
    if (assignMode === 'by_time' && dutyBlocks) {
      setDutyBlocks((prev) => {
        if (!prev) return prev;
        return prev.map((b, i) => (i === activeBlockIndex ? { ...b, roster: next } : b));
      });
    }
  };

  const toggleTier = (userId: string, tier: WebsiteAssignmentTier) => {
    applySlots(
      (() => {
        const next = {
          ...slots,
          Primary: [...slots.Primary],
          Secondary: [...slots.Secondary],
          Backup: [...slots.Backup],
        };
        const list = next[tier];
        const idx = list.indexOf(userId);
        if (idx >= 0) list.splice(idx, 1);
        else list.push(userId);
        return next;
      })(),
    );
  };

  const hasSelection =
    slots.Primary.length > 0 || slots.Secondary.length > 0 || slots.Backup.length > 0;

  const setupDutyPeriods = () => {
    const coverage = coverageQuery.data;
    if (!coverage?.chatServiceHours) {
      Alert.alert('Service hours', 'Configure service scheduling hours before duty periods.');
      return;
    }
    const existing =
      coverage.mode === 'blocks' && coverage.blocks.length > 0
        ? blocksFromCoverage(coverage)
        : splitServiceHoursIntoBlocks(
            coverage.chatServiceHours,
            slotsFromRoster(coverage.legacyRoster),
          );
    setDutyBlocks(existing);
    setActiveBlockIndex(0);
    setSlots(existing[0]?.roster ?? emptySlotDraft());
    setAssignMode('by_time');
  };

  const saveTeam = async () => {
    if (!departmentId.trim()) {
      Alert.alert('Validation', 'Select a department first.');
      return;
    }
    try {
      if (assignMode === 'by_time' && dutyBlocks && dutyBlocks.length > 0) {
        await putCoverage.mutateAsync(blocksToPutPayload(dutyBlocks));
      } else {
        const body =
          channel === 'Internal'
            ? { internal: draftToChannelBody(slots) }
            : { external: draftToChannelBody(slots) };
        await putRoster.mutateAsync({ departmentId: departmentId.trim(), body });
      }
      router.replace('/website-assigning' as Href);
    } catch (err) {
      Alert.alert('Save failed', extractApiErrorMessage(err));
    }
  };

  const FLOW_STEPS = [
    { key: 'website', title: 'Website', subtitle: 'Organization & site', done: true },
    { key: 'scheduling', title: 'Scheduling', subtitle: 'Service hours', done: true },
    { key: 'roster', title: 'Agent roster', subtitle: 'Primary / Backup', active: true },
    { key: 'complete', title: 'Complete', subtitle: 'Ready for chat' },
  ] as const;

  if (!gates.view) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" muted>
            You do not have permission to view website assignments.
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  const hoursLabel = formatHoursLabel(coverageQuery.data?.chatServiceHours);
  const modeLabel = operatingModeLabel(detail?.operatingChannels);
  const topicsCount = topicsQuery.data?.topics?.length ?? 0;
  const exclusionsCount =
    (exclusionsQuery.data?.chatAgentUserIds.length ?? 0) +
    (exclusionsQuery.data?.qaReviewerUserIds.length ?? 0);
  const saving = putRoster.isPending || putCoverage.isPending;
  const deptLabel =
    departmentOptions.find((d) => d.value === departmentId)?.label || 'website default';

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={detailQuery.isRefetching && !detailQuery.isLoading}
            onRefresh={() => {
              void detailQuery.refetch();
              void coverageQuery.refetch();
              void topicsQuery.refetch();
              void internalUsersQuery.refetch();
              void externalUsersQuery.refetch();
              void exclusionsQuery.refetch();
            }}
            tintColor={accent}
          />
        } showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.push('/website-assigning' as Href)}
            style={({ pressed }) => [
              styles.backBtn,
              {
                borderColor: theme.app.dashboard.cardBorder,
                backgroundColor: theme.app.dashboard.overlayLight,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <Typography variant="small" style={{ fontWeight: '600' }}>
              ← All websites
            </Typography>
          </Pressable>
          <Button
            size="compact"
            variant="outlined"
            onPress={() =>
              router.push(
                `/website-assigning/website/${encodeURIComponent(id)}/service-scheduling` as Href,
              )
            }
          >
            Service scheduling
          </Button>
        </View>

        <View style={{ gap: 4 }}>
          <Typography variant="boldLarge">Agent roster</Typography>
          <Typography variant="medium" muted>
            Assign Primary, Secondary, and Backup agents by channel and visitor topic.
          </Typography>
        </View>

        <View style={styles.stepRow}>
          {FLOW_STEPS.map((step, index) => {
            const active = 'active' in step && step.active;
            const done = 'done' in step && step.done;
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
                  <Typography variant="small" muted style={{ fontWeight: '700' }}>
                    {index + 1}
                  </Typography>
                  {done ? (
                    <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  ) : null}
                </View>
                <Typography variant="medium" style={{ fontWeight: '700' }} numberOfLines={1}>
                  {step.title}
                </Typography>
                <Typography variant="small" muted numberOfLines={2}>
                  {step.subtitle}
                </Typography>
              </View>
            );
          })}
        </View>

        {detailQuery.isLoading && !detail ? (
          <ActivityIndicator color={accent} />
        ) : detailQuery.isError ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(detailQuery.error, 'Could not load website.')}
            </Typography>
            <Button size="compact" variant="outlined" onPress={() => void detailQuery.refetch()}>
              Retry
            </Button>
          </AppCard>
        ) : (
          <>
            <View
              style={[
                styles.siteCard,
                {
                  borderColor: theme.app.dashboard.cardBorder,
                  backgroundColor: theme.app.dashboard.overlayLight,
                },
              ]}
            >
              <View
                style={[
                  styles.siteIcon,
                  { backgroundColor: `${accent}22`, borderColor: glassUi.border.subtle },
                ]}
              >
                <Ionicons name="people-outline" size={18} color={accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                <Typography variant="medium16" style={{ fontWeight: '700' }} numberOfLines={2}>
                  {detail?.url?.trim() || detail?.name || id.slice(0, 8)}
                </Typography>
                <View style={styles.chipRow}>
                  <View
                    style={[
                      styles.chip,
                      { backgroundColor: `${accent}22`, borderColor: `${accent}55` },
                    ]}
                  >
                    <Typography variant="small" style={{ fontWeight: '700', color: accent }}>
                      {modeLabel}
                    </Typography>
                  </View>
                  <View
                    style={[
                      styles.chip,
                      { backgroundColor: `${accent}22`, borderColor: `${accent}55` },
                    ]}
                  >
                    <Typography variant="small" style={{ fontWeight: '700', color: accent }}>
                      {channel}
                    </Typography>
                  </View>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.teamShell,
                {
                  borderColor: theme.app.dashboard.cardBorder,
                  backgroundColor: theme.app.dashboard.overlayLight,
                },
              ]}
            >
              <Typography variant="medium16" style={{ fontWeight: '800' }}>
                Team assignments
              </Typography>
              <Typography variant="small" muted>
                Choose channel, optional department, then assign agents for Primary / Secondary /
                Backup.
              </Typography>

              <View
                style={[
                  styles.infoBanner,
                  { borderColor: `${accent}44`, backgroundColor: `${accent}12` },
                ]}
              >
                <Typography variant="small" muted style={{ flex: 1 }}>
                  Service scheduling mode ({modeLabel}) controls which assignment channels you can
                  use here. Visitor topics: {topicsCount}. Roster exclusions: {exclusionsCount}.
                </Typography>
              </View>

              <View style={styles.sectionTabs}>
                {['1. Channel', '2. Department (optional)', '3. Team'].map((label) => (
                  <View
                    key={label}
                    style={[
                      styles.sectionTab,
                      { borderColor: accent, backgroundColor: `${accent}22` },
                    ]}
                  >
                    <Typography variant="small" style={{ fontWeight: '700', color: accent }}>
                      {label}
                    </Typography>
                  </View>
                ))}
              </View>

              <SelectField
                label="Assignment channel"
                value={channel}
                onChange={(v) => setChannel(v as ServiceChannel)}
                options={channelOptions}
                searchable={false}
 />
              <SelectField
                label="Department (optional)"
                value={departmentId}
                onChange={setDepartmentId}
                options={departmentOptions}
                searchable={false}
 />

              <View
                style={[
                  styles.hoursBox,
                  {
                    borderColor: theme.app.dashboard.cardBorder,
                    backgroundColor: 'rgba(255,255,255,0.04)',
                  },
                ]}
              >
                <Typography variant="small" muted style={{ fontWeight: '700' }}>
                  Chat service hours
                </Typography>
                <Typography variant="small">
                  {coverageQuery.isLoading ? 'Loading hours…' : hoursLabel}
                </Typography>
              </View>

              <Typography variant="medium" style={{ fontWeight: '700' }}>
                How do you want to assign agents?
              </Typography>
              <Pressable
                onPress={() => {
                  setAssignMode('same_day');
                  setDutyBlocks(null);
                  if (coverageQuery.data?.legacyRoster) {
                    setSlots(slotsFromRoster(coverageQuery.data.legacyRoster));
                  }
                }}
                style={[
                  styles.choiceCard,
                  {
                    borderColor:
                      assignMode === 'same_day' ? accent : theme.app.dashboard.cardBorder,
                    backgroundColor:
                      assignMode === 'same_day' ? `${accent}14` : 'rgba(255,255,255,0.03)',
                  },
                ]}
              >
                <Typography variant="small" style={{ fontWeight: '800' }}>
                  Option A — Same team all day
                </Typography>
                <Typography variant="small" muted>
                  Recommended for small teams. Same Primary / Secondary for the full service window.
                </Typography>
              </Pressable>
              <Pressable
                onPress={() => setAssignMode('by_time')}
                style={[
                  styles.choiceCard,
                  {
                    borderColor:
                      assignMode === 'by_time' ? accent : theme.app.dashboard.cardBorder,
                    backgroundColor:
                      assignMode === 'by_time' ? `${accent}14` : 'rgba(255,255,255,0.03)',
                  },
                ]}
              >
                <Typography variant="small" style={{ fontWeight: '800' }}>
                  Option B — Different teams by time
                </Typography>
                <Typography variant="small" muted>
                  Split the day into duty periods with different agent sets.
                </Typography>
                {assignMode === 'by_time' && !dutyBlocks ? (
                  <Button size="compact" variant="outlined" onPress={setupDutyPeriods}>
                    Set up duty periods →
                  </Button>
                ) : null}
              </Pressable>

              {assignMode === 'by_time' && dutyBlocks ? (
                <View style={{ gap: 8 }}>
                  <Typography variant="small" muted>
                    Select a duty period, then assign agents below.
                  </Typography>
                  {dutyBlocks.map((block, index) => {
                    const selected = index === activeBlockIndex;
                    return (
                      <Pressable
                        key={`${block.label}-${index}`}
                        onPress={() => {
                          setActiveBlockIndex(index);
                          setSlots(block.roster);
                        }}
                        style={[
                          styles.choiceCard,
                          {
                            borderColor: selected ? accent : theme.app.dashboard.cardBorder,
                            backgroundColor: selected
                              ? `${accent}14`
                              : 'rgba(255,255,255,0.03)',
                          },
                        ]}
                      >
                        <Typography variant="small" style={{ fontWeight: '800' }}>
                          {block.label || `Period ${index + 1}`}
                        </Typography>
                        <Typography variant="small" muted>
                          {formatCoverageBlockHoursLabel(block)}
                        </Typography>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              {assignMode === 'same_day' || dutyBlocks ? (
                <>
                  <View style={styles.chipRow}>
                    <View style={[styles.metaChip, { borderColor: glassUi.border.subtle }]}>
                      <Typography variant="small">{channel}</Typography>
                    </View>
                    <View style={[styles.metaChip, { borderColor: glassUi.border.subtle }]}>
                      <Typography variant="small">Dept: {deptLabel}</Typography>
                    </View>
                    {operatingChannels === 'both' ? (
                      <View style={[styles.metaChip, { borderColor: glassUi.border.subtle }]}>
                        <Typography variant="small">External allowed for Backup</Typography>
                      </View>
                    ) : null}
                    <View style={[styles.metaChip, { borderColor: glassUi.border.subtle }]}>
                      <Typography variant="small">
                        {filteredUsers.length} eligible users
                      </Typography>
                    </View>
                  </View>

                  <View style={styles.filterRow}>
                    {(['all', 'Internal', 'External'] as const).map((f) => {
                      const selected = userFilter === f;
                      return (
                        <Pressable
                          key={f}
                          onPress={() => setUserFilter(f)}
                          style={[
                            styles.filterChip,
                            {
                              borderColor: selected ? accent : theme.app.dashboard.cardBorder,
                              backgroundColor: selected ? `${accent}22` : 'transparent',
                            },
                          ]}
                        >
                          <Typography
                            variant="small"
                            style={{ fontWeight: selected ? '700' : '500' }}
                            color={selected ? accent : theme.app.text.secondary}
                          >
                            {f === 'all' ? 'All users' : f}
                          </Typography>
                        </Pressable>
                      );
                    })}
                  </View>
                  <SearchBar
                    value={search}
                    onChange={setSearch}
                    placeholder="Search users…"
 />

                  <View style={{ gap: 8 }}>
                    {filteredUsers.length === 0 ? (
                      <Typography variant="small" muted>
                        No users match this filter.
                      </Typography>
                    ) : (
                      filteredUsers.map((u) => {
                        const primary = slots.Primary.includes(u.id);
                        const secondary = slots.Secondary.includes(u.id);
                        const backup = slots.Backup.includes(u.id);
                        return (
                          <View
                            key={u.id}
                            style={[
                              styles.userRow,
                              {
                                borderColor: theme.app.dashboard.cardBorder,
                                backgroundColor: 'rgba(255,255,255,0.03)',
                                opacity: u.disabled ? 0.55 : 1,
                              },
                            ]}
                          >
                            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                              <Typography
                                variant="medium"
                                style={{ fontWeight: '700' }}
                                numberOfLines={1}
                              >
                                {u.name}
                              </Typography>
                              <Typography variant="small" muted numberOfLines={1}>
                                {u.email || '—'}
                              </Typography>
                              <Typography variant="small" muted numberOfLines={2}>
                                {[
                                  `Type: ${u.userType}`,
                                  `Department: ${u.department || '—'}`,
                                  `Pool: ${u.pool || '—'}`,
                                ].join(' · ')}
                              </Typography>
                              {u.disabledReason ? (
                                <Typography variant="small" color={theme.app.danger}>
                                  {u.disabledReason}
                                </Typography>
                              ) : null}
                            </View>
                            <View style={styles.tierChecks}>
                              <Checkbox
                                checked={primary}
                                disabled={!gates.assign || u.disabled}
                                label="P"
                                onChange={() => toggleTier(u.id, 'Primary')}
 />
                              {showSecondary ? (
                                <Checkbox
                                  checked={secondary}
                                  disabled={!gates.assign || u.disabled}
                                  label="S"
                                  onChange={() => toggleTier(u.id, 'Secondary')}
 />
                              ) : null}
                              <Checkbox
                                checked={backup}
                                disabled={!gates.assign || u.disabled}
                                label="B"
                                onChange={() => toggleTier(u.id, 'Backup')}
 />
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>

                  {selectedAgents.length > 0 ? (
                    <View style={{ gap: 10 }}>
                      <Typography variant="medium" style={{ fontWeight: '800' }}>
                        Selected agents ({selectedAgents.length})
                      </Typography>
                      {selectedAgents.map((row) => {
                        const badge = TIER_BADGE[row.tier];
                        return (
                          <View
                            key={row.id}
                            style={[
                              styles.selectedRow,
                              {
                                borderColor: theme.app.dashboard.cardBorder,
                                backgroundColor: 'rgba(255,255,255,0.03)',
                              },
                            ]}
                          >
                            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                              <Typography
                                variant="medium"
                                style={{ fontWeight: '700' }}
                                numberOfLines={1}
                              >
                                {row.name}
                              </Typography>
                              <Typography variant="small" muted numberOfLines={1}>
                                {row.email || '—'}
                              </Typography>
                              <View style={styles.chipRow}>
                                <View
                                  style={[
                                    styles.typeChip,
                                    {
                                      backgroundColor: `${accent}22`,
                                      borderColor: `${accent}55`,
                                    },
                                  ]}
                                >
                                  <Typography
                                    variant="small"
                                    style={{ fontWeight: '700', color: accent }}
                                  >
                                    {row.userType}
                                  </Typography>
                                </View>
                                <Typography variant="small" muted numberOfLines={1}>
                                  {[row.department || '—', row.pool || '—'].join(' · ')}
                                </Typography>
                              </View>
                            </View>
                            <View
                              style={[
                                styles.tierBadge,
                                {
                                  backgroundColor: badge.bg,
                                  borderColor: badge.border,
                                },
                              ]}
                            >
                              <Typography
                                variant="small"
                                style={{ fontWeight: '800', color: badge.color }}
                              >
                                {row.tier}
                              </Typography>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}

                  {gates.assign ? (
                    <Button
                      onPress={() => void saveTeam()}
                      disabled={!hasSelection || saving || !departmentId.trim()}
                    >
                      {saving
                        ? 'Saving…'
                        : assignMode === 'by_time'
                          ? 'Save duty periods'
                          : 'Save team (full day)'}
                    </Button>
                  ) : null}
                </>
              ) : (
                <Typography variant="small" muted>
                  Tap “Set up duty periods →” to split the service window into blocks.
                </Typography>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 8 },
  scroll: { paddingTop: 4, paddingBottom: 40 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  stepRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stepCard: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 140,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    gap: 2,
  },
  stepCardActive: { borderWidth: 2 },
  stepCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  siteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  siteIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  teamShell: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  infoBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  sectionTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sectionTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  hoursBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  choiceCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    gap: 4,
  },
  metaChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  tierChecks: { gap: 4, alignItems: 'flex-start' },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
});
