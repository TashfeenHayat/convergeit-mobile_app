import { useMemo, useState, type ComponentProps } from 'react';
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

import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import {
  AppCard,
  Button,
  ConfirmActionModal,
  FormModal,
  SelectField,
  StatusChip,
  Typography,
} from '@/components/ui';
import type {
  ServiceChannel,
  WebsiteAssignmentTier,
  WebsiteDepartmentRosterRow,
} from '@/api/types/website-assignments.types';
import { extractApiErrorMessage } from '@/lib/api/errors';
import {
  useAssignWebsiteTierMutation,
  useRemoveWebsiteSlotMutation,
  useWebsiteAssignmentDetailQuery,
} from '@/lib/hooks/query/website-assignments';
import { useUsersListQuery } from '@/lib/hooks/query/users';
import { useWebsiteAssignmentGates } from '@/lib/permissions/use-website-assignment-gates';
import { clearAllDepartmentRosters } from '@/features/website-assignments/utils/clear-website-roster';
import { extractUsersRows } from '@/lib/users/user-list-rows';
import { glassUi } from '@/lib/theme/glass-ui';
import { useAppTheme } from '@/theme';
import { useQueryClient } from '@tanstack/react-query';
import { websiteAssignmentsKeys } from '@/lib/hooks/query/website-assignments/keys';

const TIERS: WebsiteAssignmentTier[] = ['Primary', 'Secondary', 'Backup'];

export type WebsiteAssignmentDetailPageProps = {
  websiteId: string;
};

export function WebsiteAssignmentDetailPage({ websiteId }: WebsiteAssignmentDetailPageProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const gates = useWebsiteAssignmentGates();
  const accent = theme.app.dashboard.accentBlue;
  const id = websiteId.trim();

  const detailQuery = useWebsiteAssignmentDetailQuery(id, {
    enabled: gates.view && id.length > 0,
  });
  const assignMutation = useAssignWebsiteTierMutation();
  const removeMutation = useRemoveWebsiteSlotMutation();
  const usersQuery = useUsersListQuery({ all: true }, { enabled: gates.assign });

  const [assignOpen, setAssignOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [departmentId, setDepartmentId] = useState('');
  const [channel, setChannel] = useState<ServiceChannel>('External');
  const [tier, setTier] = useState<WebsiteAssignmentTier>('Primary');
  const [userId, setUserId] = useState('');
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  const detail = detailQuery.data?.data;
  const title = detail?.name?.trim() || detail?.url?.trim() || id.slice(0, 8);

  const userOptions = useMemo(() => {
    return extractUsersRows(usersQuery.data)
      .filter((u) => u.id)
      .map((u) => ({
        value: u.id,
        label: `${u.user || '—'} — ${u.email || '—'}`,
      }));
  }, [usersQuery.data]);

  const departmentOptions = useMemo(() => {
    return (detail?.departmentRoster ?? []).map((d) => ({
      value: d.departmentId,
      label: d.departmentName || d.departmentId,
    }));
  }, [detail?.departmentRoster]);

  const allowedChannels = detail?.allowedAssignmentChannels?.length
    ? detail.allowedAssignmentChannels
    : (['Internal', 'External'] as ServiceChannel[]);

  const openAssign = (dept?: WebsiteDepartmentRosterRow, ch?: ServiceChannel, t?: WebsiteAssignmentTier) => {
    setDepartmentId(dept?.departmentId ?? departmentOptions[0]?.value ?? '');
    setChannel(ch ?? allowedChannels[0] ?? 'External');
    setTier(t ?? 'Primary');
    setUserId('');
    setAssignOpen(true);
  };

  const saveAssign = async () => {
    if (!departmentId.trim() || !userId.trim()) {
      Alert.alert('Validation', 'Select department and user.');
      return;
    }
    try {
      await assignMutation.mutateAsync({
        websiteId: id,
        departmentId: departmentId.trim(),
        serviceChannel: channel,
        userId: userId.trim(),
        assignmentType: tier,
      });
      setAssignOpen(false);
      Alert.alert('Saved', 'Agent assigned to roster slot.');
    } catch (err) {
      Alert.alert('Assign failed', extractApiErrorMessage(err));
    }
  };

  const removeSlot = async (
    deptId: string,
    serviceChannel: ServiceChannel,
    assignmentType: WebsiteAssignmentTier,
  ) => {
    const key = `${deptId}:${serviceChannel}:${assignmentType}`;
    setRemovingKey(key);
    try {
      await removeMutation.mutateAsync({
        websiteId: id,
        departmentId: deptId,
        serviceChannel,
        assignmentType,
      });
    } catch (err) {
      Alert.alert('Remove failed', extractApiErrorMessage(err));
    } finally {
      setRemovingKey(null);
    }
  };

  const clearAll = async () => {
    try {
      await clearAllDepartmentRosters(id);
      void queryClient.invalidateQueries({ queryKey: websiteAssignmentsKeys.website(id) });
      void queryClient.invalidateQueries({ queryKey: websiteAssignmentsKeys.all });
      setClearOpen(false);
      Alert.alert('Cleared', 'All agent slots cleared.');
    } catch (err) {
      Alert.alert('Clear failed', extractApiErrorMessage(err));
    }
  };

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

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        refreshControl={
          <RefreshControl
            refreshing={detailQuery.isRefetching && !detailQuery.isLoading}
            onRefresh={() => void detailQuery.refetch()}
            tintColor={accent}
          />
        }
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
            Assignments
          </Typography>
        </Pressable>

        <DashboardPageIntro subtitle="Roster, service hours, and inquire topics for this site.">
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
          ) : detail ? (
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
              <View style={styles.heroTop}>
                <View
                  style={[
                    styles.heroAvatar,
                    { backgroundColor: accent, borderColor: `${accent}66` },
                  ]}
                >
                  <Ionicons name="globe-outline" size={22} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                  <Typography variant="medium16" style={{ fontWeight: '800' }} numberOfLines={2}>
                    {title}
                  </Typography>
                  {detail.url ? (
                    <Typography variant="small" muted numberOfLines={1}>
                      {detail.url}
                    </Typography>
                  ) : null}
                  <Typography variant="small" muted numberOfLines={1}>
                    {[detail.childCompanyName, detail.parentCompanyName, detail.resellerName]
                      .filter(Boolean)
                      .join(' · ')}
                  </Typography>
                </View>
              </View>

              <View style={styles.chipRow}>
                <StatusChip
                  label={
                    detail.serviceSchedulingConfigured || detail.serviceHoursConfigured
                      ? 'Hours set'
                      : 'Hours needed'
                  }
                  tone={
                    detail.serviceSchedulingConfigured || detail.serviceHoursConfigured
                      ? 'success'
                      : 'warning'
                  }
                />
                <StatusChip
                  label={detail.visitorTopicsConfigured ? 'Topics set' : 'Topics needed'}
                  tone={detail.visitorTopicsConfigured ? 'success' : 'warning'}
                />
                <StatusChip
                  label={
                    detail.isFullyAssigned ? 'Fully assigned' : `${detail.filledSlots ?? 0} filled`
                  }
                  tone={detail.isFullyAssigned ? 'success' : 'info'}
                />
              </View>

              <View style={styles.tileRow}>
                <LinkTile
                  icon="time-outline"
                  title="Service hours"
                  subtitle="Operating windows"
                  onPress={() =>
                    router.push(
                      `/website-assigning/website/${encodeURIComponent(id)}/service-scheduling` as Href,
                    )
                  }
                />
                <LinkTile
                  icon="chatbubbles-outline"
                  title="Inquire topics"
                  subtitle="Visitor routing"
                  onPress={() =>
                    router.push(
                      `/website-assigning/website/${encodeURIComponent(id)}/inquire-topics` as Href,
                    )
                  }
                />
              </View>

              {gates.assign ? (
                <View style={styles.actionRow}>
                  <Button size="compact" onPress={() => openAssign()}>
                    Assign agent
                  </Button>
                  <Button size="compact" variant="ghost" onPress={() => setClearOpen(true)}>
                    Clear roster
                  </Button>
                </View>
              ) : null}
            </View>
          ) : null}
        </DashboardPageIntro>

        {(detail?.departmentRoster ?? []).map((dept) => (
          <View
            key={dept.departmentId}
            style={[
              styles.deptCard,
              {
                borderColor: theme.app.dashboard.cardBorder,
                backgroundColor: theme.app.dashboard.overlayLight,
              },
            ]}
          >
            <View style={styles.deptHeader}>
              <View
                style={[
                  styles.deptIcon,
                  { backgroundColor: `${accent}22`, borderColor: glassUi.border.subtle },
                ]}
              >
                <Ionicons name="layers-outline" size={16} color={accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Typography variant="medium16" style={{ fontWeight: '700' }} numberOfLines={1}>
                  {dept.departmentName}
                </Typography>
                <Typography variant="small" muted>
                  {dept.departmentType}
                </Typography>
              </View>
            </View>
            {allowedChannels.map((ch) => {
              const roster = ch === 'Internal' ? dept.roster.internal : dept.roster.external;
              return (
                <View key={ch} style={{ gap: 8 }}>
                  <Typography
                    variant="small"
                    style={{ fontWeight: '800', letterSpacing: 0.4 }}
                    muted
                  >
                    {ch.toUpperCase()}
                  </Typography>
                  {TIERS.map((t) => {
                    const key = t.toLowerCase() as 'primary' | 'secondary' | 'backup';
                    const users = roster[key] ?? [];
                    const removeKey = `${dept.departmentId}:${ch}:${t}`;
                    const filled = users.length > 0;
                    return (
                      <View
                        key={t}
                        style={[
                          styles.tierRow,
                          {
                            borderColor: filled
                              ? 'rgba(34, 197, 94, 0.28)'
                              : theme.app.dashboard.cardBorder,
                            backgroundColor: filled
                              ? 'rgba(34, 197, 94, 0.08)'
                              : 'rgba(255,255,255,0.03)',
                          },
                        ]}
                      >
                        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                          <Typography variant="small" style={{ fontWeight: '700' }}>
                            {t}
                          </Typography>
                          {filled ? (
                            users.map((u) => (
                              <Typography key={u.userId} variant="small" numberOfLines={1}>
                                {u.name || u.email || u.userId}
                              </Typography>
                            ))
                          ) : (
                            <Typography variant="small" muted>
                              Empty slot
                            </Typography>
                          )}
                        </View>
                        {gates.assign ? (
                          <View style={styles.tierActions}>
                            <Pressable
                              onPress={() => openAssign(dept, ch, t)}
                              style={[
                                styles.miniBtn,
                                {
                                  backgroundColor: `${accent}18`,
                                  borderColor: glassUi.border.subtle,
                                },
                              ]}
                            >
                              <Ionicons name="person-add-outline" size={14} color={accent} />
                            </Pressable>
                            {filled ? (
                              <Pressable
                                disabled={removingKey === removeKey}
                                onPress={() => void removeSlot(dept.departmentId, ch, t)}
                                style={[
                                  styles.miniBtn,
                                  {
                                    backgroundColor: 'rgba(239,68,68,0.12)',
                                    borderColor: 'rgba(239,68,68,0.28)',
                                    opacity: removingKey === removeKey ? 0.5 : 1,
                                  },
                                ]}
                              >
                                <Ionicons name="trash-outline" size={14} color={theme.app.danger} />
                              </Pressable>
                            ) : null}
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        ))}

        {detail && (detail.departmentRoster?.length ?? 0) === 0 ? (
          <View
            style={[
              styles.emptyRoster,
              {
                borderColor: theme.app.dashboard.cardBorder,
                backgroundColor: theme.app.dashboard.overlayLight,
              },
            ]}
          >
            <Ionicons name="people-outline" size={28} color={accent} />
            <Typography variant="medium16" style={{ fontWeight: '700', textAlign: 'center' }}>
              No department rosters yet
            </Typography>
            <Typography variant="small" muted style={{ textAlign: 'center' }}>
              Configure inquire topics first, then assign agents to Primary / Secondary / Backup.
            </Typography>
          </View>
        ) : null}
      </ScrollView>

      <FormModal
        open={assignOpen}
        title="Assign agent"
        description="Place a user into a Primary / Secondary / Backup slot."
        onClose={() => setAssignOpen(false)}
        onSave={() => void saveAssign()}
        primaryButtonLabel={assignMutation.isPending ? 'Saving…' : 'Assign'}
        primaryButtonDisabled={assignMutation.isPending || !userId.trim() || !departmentId.trim()}
      >
        <SelectField
          label="Department"
          value={departmentId}
          onChange={setDepartmentId}
          options={departmentOptions}
        />
        <SelectField
          label="Channel"
          value={channel}
          onChange={(v) => setChannel(v as ServiceChannel)}
          options={allowedChannels.map((c) => ({ value: c, label: c }))}
          searchable={false}
        />
        <SelectField
          label="Tier"
          value={tier}
          onChange={(v) => setTier(v as WebsiteAssignmentTier)}
          options={TIERS.map((t) => ({ value: t, label: t }))}
          searchable={false}
        />
        <SelectField
          label="User"
          value={userId}
          onChange={setUserId}
          options={userOptions}
          placeholder="Search users…"
        />
      </FormModal>

      <ConfirmActionModal
        open={clearOpen}
        title="Clear entire roster?"
        description="Removes every agent slot on this website."
        confirmLabel="Clear"
        confirmButtonVariant="danger"
        onDismiss={() => setClearOpen(false)}
        onConfirm={() => void clearAll()}
      />
    </MobileScreen>
  );
}

function LinkTile({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.linkTile,
        {
          borderColor: theme.app.dashboard.cardBorder,
          backgroundColor: 'rgba(255,255,255,0.04)',
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.linkIcon,
          { backgroundColor: `${accent}22`, borderColor: glassUi.border.subtle },
        ]}
      >
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography variant="small" style={{ fontWeight: '700' }} numberOfLines={1}>
          {title}
        </Typography>
        <Typography variant="small" muted numberOfLines={1}>
          {subtitle}
        </Typography>
      </View>
      <Ionicons name="chevron-forward" size={14} color={theme.app.text.secondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 36 },
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
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tileRow: { gap: 8 },
  linkTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  deptCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  deptHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deptIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  tierActions: { flexDirection: 'row', gap: 6 },
  miniBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  emptyRoster: {
    alignItems: 'center',
    gap: 10,
    padding: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
