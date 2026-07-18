import { useEffect, useMemo, useState, type ComponentProps } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';

import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import {
  AppCard,
  Button,
  ConfirmActionModal,
  ListTableCard,
  MetricCard,
  SearchBar,
  StatusChip,
  TablePagination,
  Typography,
} from '@/components/ui';
import type { WebsiteAssignmentScopeItem } from '@/api/types/website-assignments.types';
import { WebsiteAssignmentScopeFilterPanel } from '@/features/website-assignments/components/WebsiteAssignmentScopeFilterPanel';
import { useWebsiteAssignmentScopeFilters } from '@/features/website-assignments/hooks/useWebsiteAssignmentScopeFilters';
import { clearAllDepartmentRosters } from '@/features/website-assignments/utils/clear-website-roster';
import {
  groupWebsitesByParentChild,
  sitesListHref,
} from '@/features/website-assignments/utils/group-websites-by-org';
import {
  ASSIGNED_FILTER_OPTIONS,
  ROSTER_FILTER_OPTIONS,
  parseAssignedFilter,
  parseRosterFilter,
} from '@/features/website-assignments/utils/list-filter-params';
import { extractApiErrorMessage } from '@/lib/api/errors';
import {
  buildWebsitesInScopeParams,
  useWebsiteAssignmentsWebsitesQuery,
} from '@/lib/hooks/query/website-assignments';
import { websiteAssignmentsKeys } from '@/lib/hooks/query/website-assignments/keys';
import { useWebsiteAssignmentGates } from '@/lib/permissions/use-website-assignment-gates';
import { glassUi } from '@/lib/theme/glass-ui';
import { useAppTheme } from '@/theme';

const PAGE_LIMIT = 50;

function websiteLabel(item: WebsiteAssignmentScopeItem): string {
  return (item.name ?? '').trim() || (item.url ?? '').trim() || item.websiteId.slice(0, 8);
}

export type WebsiteAssignmentsListPageProps = {
  lockedParentCompanyId?: string;
  lockedChildCompanyId?: string;
};

export function WebsiteAssignmentsListPage({
  lockedParentCompanyId,
  lockedChildCompanyId,
}: WebsiteAssignmentsListPageProps = {}) {
  const theme = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const gates = useWebsiteAssignmentGates();
  const scope = useWebsiteAssignmentScopeFilters();
  const accent = theme.app.dashboard.accentBlue;

  const [search, setSearch] = useState('');
  const [filterAssigned, setFilterAssigned] = useState('');
  const [filterRoster, setFilterRoster] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [clearTarget, setClearTarget] = useState<WebsiteAssignmentScopeItem | null>(null);
  const [clearing, setClearing] = useState(false);

  const assignedParam = useMemo(() => parseAssignedFilter(filterAssigned), [filterAssigned]);
  const rosterParams = useMemo(() => parseRosterFilter(filterRoster), [filterRoster]);

  const parentId = lockedParentCompanyId?.trim() || scope.filterParentCompanyId;
  const childId = lockedChildCompanyId?.trim() || scope.filterChildCompanyId;
  const isSitesPage = Boolean(lockedParentCompanyId || lockedChildCompanyId);

  useEffect(() => {
    setPage(1);
  }, [scope.filterResellerId, parentId, childId, search, filterAssigned, filterRoster]);

  const listParams = useMemo(
    () =>
      buildWebsitesInScopeParams({
        canFilterByResellerId: scope.canFilterByResellerId,
        page,
        limit: PAGE_LIMIT,
        search,
        assigned: rosterParams.assigned ?? assignedParam,
        resellerId: scope.filterResellerId,
        parentCompanyId: parentId,
        childCompanyId: childId,
        serviceSchedulingConfigured: rosterParams.serviceSchedulingConfigured,
        fullyAssigned: rosterParams.fullyAssigned,
      }),
    [
      scope.canFilterByResellerId,
      scope.filterResellerId,
      parentId,
      childId,
      page,
      search,
      assignedParam,
      rosterParams,
    ],
  );

  const listQuery = useWebsiteAssignmentsWebsitesQuery(listParams, {
    allowResellerIdFilter: scope.canFilterByResellerId,
    enabled: gates.view,
  });

  const items = listQuery.data?.data?.items ?? [];
  const total = listQuery.data?.data?.total ?? items.length;
  const totalPages = Math.max(1, listQuery.data?.data?.totalPages ?? 1);
  const hierarchy = useMemo(() => groupWebsitesByParentChild(items), [items]);

  const configuredHours = useMemo(
    () =>
      items.filter((i) => i.serviceSchedulingConfigured || i.serviceHoursConfigured).length,
    [items],
  );
  const fullyAssignedCount = useMemo(
    () => items.filter((i) => i.isFullyAssigned).length,
    [items],
  );

  const handleClear = async () => {
    if (!clearTarget || !gates.assign) return;
    setClearing(true);
    try {
      await clearAllDepartmentRosters(clearTarget.websiteId);
      void queryClient.invalidateQueries({ queryKey: websiteAssignmentsKeys.all });
      setClearTarget(null);
      Alert.alert('Cleared', 'All agent slots cleared for this website.');
    } catch (err) {
      Alert.alert('Clear failed', extractApiErrorMessage(err));
    } finally {
      setClearing(false);
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
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={listQuery.isRefetching && !listQuery.isLoading}
            onRefresh={() => void listQuery.refetch()}
            tintColor={accent}
          />
        }
      >
        <DashboardPageIntro
          subtitle={
            isSitesPage
              ? 'Sites under this company — open any row to manage roster and hours.'
              : 'Organize agents by company tree. Open a site for roster, hours, and topics.'
          }
        >
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search website, company, URL…"
          />

          <View style={styles.filterRow}>
            <Pressable
              onPress={() => setFiltersOpen((v) => !v)}
              style={({ pressed }) => [
                styles.filterToggle,
                {
                  borderColor: filtersOpen ? `${accent}88` : theme.app.dashboard.cardBorder,
                  backgroundColor: filtersOpen ? `${accent}18` : theme.app.dashboard.overlayLight,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <Ionicons
                name="options-outline"
                size={16}
                color={filtersOpen ? accent : theme.app.text.secondary}
              />
              <Typography
                variant="small"
                style={{ fontWeight: '700' }}
                color={filtersOpen ? accent : theme.app.text.secondary}
              >
                Filters
              </Typography>
            </Pressable>
            {ASSIGNED_FILTER_OPTIONS.filter((o) => o.value).slice(0, 2).map((opt) => {
              const selected = filterAssigned === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    setFilterAssigned(selected ? '' : opt.value);
                    setPage(1);
                  }}
                  style={[
                    styles.quickChip,
                    {
                      borderColor: selected ? `${accent}99` : theme.app.dashboard.cardBorder,
                      backgroundColor: selected ? `${accent}22` : theme.app.dashboard.overlayLight,
                    },
                  ]}
                >
                  <Typography
                    variant="small"
                    style={{ fontWeight: selected ? '700' : '500' }}
                    color={selected ? accent : theme.app.text.secondary}
                  >
                    {opt.label}
                  </Typography>
                </Pressable>
              );
            })}
          </View>

          {filtersOpen ? (
            <View
              style={[
                styles.filterSheet,
                {
                  borderColor: theme.app.dashboard.cardBorder,
                  backgroundColor: theme.app.dashboard.overlayLight,
                },
              ]}
            >
              {!isSitesPage ? (
                <WebsiteAssignmentScopeFilterPanel
                  canFilterByResellerId={scope.canFilterByResellerId}
                  filterResellerId={scope.filterResellerId}
                  setFilterResellerId={scope.setFilterResellerId}
                  filterParentCompanyId={scope.filterParentCompanyId}
                  setFilterParentCompanyId={scope.setFilterParentCompanyId}
                  filterChildCompanyId={scope.filterChildCompanyId}
                  setFilterChildCompanyId={scope.setFilterChildCompanyId}
                  resellerFilterOptions={scope.resellerFilterOptions}
                  parentCompanyFilterOptions={scope.parentCompanyFilterOptions}
                  childCompanyFilterOptions={scope.childCompanyFilterOptions}
                  hasScopeFilters={scope.hasScopeFilters}
                  onClearAll={scope.clearScopeFilters}
                  onClose={() => setFiltersOpen(false)}
                />
              ) : null}
              <FilterChips
                label="Agents"
                options={ASSIGNED_FILTER_OPTIONS}
                value={filterAssigned}
                onChange={(v) => {
                  setFilterAssigned(v);
                  setPage(1);
                }}
              />
              <FilterChips
                label="Roster state"
                options={ROSTER_FILTER_OPTIONS}
                value={filterRoster}
                onChange={(v) => {
                  setFilterRoster(v);
                  setPage(1);
                }}
              />
            </View>
          ) : null}

          {gates.assign ? (
            <Pressable
              onPress={() => router.push('/website-assigning/assign' as Href)}
              style={({ pressed }) => [
                styles.addCta,
                {
                  borderColor: theme.app.dashboard.cardBorder,
                  backgroundColor: theme.app.dashboard.overlayLight,
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                },
              ]}
            >
              <View style={[styles.addCtaGlow, { backgroundColor: `${accent}18` }]} />
              <View
                style={[
                  styles.addCtaIcon,
                  { backgroundColor: accent, borderColor: `${accent}66` },
                ]}
              >
                <Ionicons name="git-branch-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.addCtaCopy}>
                <Typography variant="medium16" style={{ fontWeight: '700' }}>
                  Assign website
                </Typography>
                <Typography variant="small" muted numberOfLines={2}>
                  Pick a site and open its roster workspace
                </Typography>
              </View>
              <View
                style={[
                  styles.addCtaChevron,
                  { backgroundColor: `${accent}22`, borderColor: glassUi.border.subtle },
                ]}
              >
                <Ionicons name="arrow-forward" size={16} color={accent} />
              </View>
            </Pressable>
          ) : null}
        </DashboardPageIntro>

        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <MetricCard
              title="In view"
              value={String(total)}
              subtitle="Websites"
              showTrendArrow={false}
              valueColor={accent}
              iconBgColor={`${accent}28`}
              icon={<Ionicons name="globe-outline" size={20} color={accent} />}
            />
          </View>
          <View style={styles.statCell}>
            <MetricCard
              title="Hours ready"
              value={String(configuredHours)}
              subtitle="This page"
              showTrendArrow={false}
              valueColor={accent}
              iconBgColor={`${accent}28`}
              icon={<Ionicons name="time-outline" size={20} color={accent} />}
            />
          </View>
          <View style={styles.statCell}>
            <MetricCard
              title="Fully staffed"
              value={String(fullyAssignedCount)}
              subtitle="This page"
              showTrendArrow={false}
              valueColor={accent}
              iconBgColor={`${accent}28`}
              icon={<Ionicons name="people-outline" size={20} color={accent} />}
            />
          </View>
        </View>

        {listQuery.isError ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(listQuery.error, 'Could not load websites.')}
            </Typography>
            <Button size="compact" variant="outlined" onPress={() => void listQuery.refetch()}>
              Retry
            </Button>
          </AppCard>
        ) : (
          <ListTableCard
            title="Directory"
            subtitle={`${total} site${total === 1 ? '' : 's'}`}
            icon="globe-outline"
            footer={
              totalPages > 1 ? (
                <TablePagination page={page} pageCount={totalPages} onPageChange={setPage} />
              ) : undefined
            }
          >
            {listQuery.isLoading && !listQuery.data ? (
              <View style={styles.centered}>
                <ActivityIndicator color={accent} />
                <Typography variant="small" muted>
                  Loading websites…
                </Typography>
              </View>
            ) : items.length === 0 ? (
              <View style={styles.empty}>
                <View
                  style={[
                    styles.emptyIcon,
                    { backgroundColor: `${accent}22`, borderColor: glassUi.border.subtle },
                  ]}
                >
                  <Ionicons name="globe-outline" size={28} color={accent} />
                </View>
                <Typography variant="medium16" style={{ fontWeight: '700' }}>
                  No websites found
                </Typography>
                <Typography variant="small" muted style={{ textAlign: 'center' }}>
                  Try clearing filters or searching a different company.
                </Typography>
              </View>
            ) : (
              <View style={{ gap: 14 }}>
                {hierarchy.map((parent) => (
                  <View
                    key={parent.parentCompanyId || parent.parentCompanyName}
                    style={[
                      styles.parentCard,
                      {
                        borderColor: theme.app.dashboard.cardBorder,
                        backgroundColor: theme.app.dashboard.overlayLight,
                      },
                    ]}
                  >
                    <View style={styles.parentHeader}>
                      <View
                        style={[
                          styles.parentIcon,
                          { backgroundColor: `${accent}22`, borderColor: glassUi.border.subtle },
                        ]}
                      >
                        <Ionicons name="business-outline" size={18} color={accent} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="medium16" style={{ fontWeight: '800' }} numberOfLines={1}>
                          {parent.parentCompanyName}
                        </Typography>
                        <Typography variant="small" muted numberOfLines={1}>
                          {parent.resellerName}
                        </Typography>
                      </View>
                    </View>

                    <View style={{ gap: 10 }}>
                      {parent.children.map((child) => (
                        <View key={child.childCompanyId || child.childCompanyName} style={{ gap: 8 }}>
                          <Pressable
                            onPress={() => {
                              if (!parent.parentCompanyId || !child.childCompanyId) return;
                              router.push(
                                sitesListHref(parent.parentCompanyId, child.childCompanyId) as Href,
                              );
                            }}
                            style={styles.childHeader}
                          >
                            <Typography
                              variant="small"
                              style={{ fontWeight: '700', flex: 1, letterSpacing: 0.2 }}
                              numberOfLines={1}
                            >
                              {child.childCompanyName}
                            </Typography>
                            <View
                              style={[
                                styles.countPill,
                                {
                                  backgroundColor: `${accent}18`,
                                  borderColor: glassUi.border.subtle,
                                },
                              ]}
                            >
                              <Typography variant="small" style={{ fontWeight: '700', color: accent }}>
                                {child.websites.length}
                              </Typography>
                            </View>
                          </Pressable>

                          {child.websites.map((item) => (
                            <WebsiteAssignmentRow
                              key={item.websiteId}
                              item={item}
                              canAssign={gates.assign}
                              onOpen={() =>
                                router.push(
                                  `/website-assigning/website/${encodeURIComponent(item.websiteId)}` as Href,
                                )
                              }
                              onSchedule={() =>
                                router.push(
                                  `/website-assigning/website/${encodeURIComponent(item.websiteId)}/service-scheduling` as Href,
                                )
                              }
                              onTopics={() =>
                                router.push(
                                  `/website-assigning/website/${encodeURIComponent(item.websiteId)}/inquire-topics` as Href,
                                )
                              }
                              onClear={() => setClearTarget(item)}
                            />
                          ))}
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ListTableCard>
        )}
      </ScrollView>

      <ConfirmActionModal
        open={Boolean(clearTarget)}
        title="Clear all agents?"
        description={`Removes every roster slot for ${clearTarget ? websiteLabel(clearTarget) : 'this website'}.`}
        confirmLabel="Clear roster"
        confirmButtonVariant="danger"
        isLoading={clearing}
        onDismiss={() => setClearTarget(null)}
        onConfirm={() => void handleClear()}
      />
    </MobileScreen>
  );
}

function FilterChips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  return (
    <View style={{ gap: 8 }}>
      <Typography variant="small" muted style={{ fontWeight: '600' }}>
        {label}
      </Typography>
      <View style={styles.chipRow}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <Pressable
              key={opt.value || 'all'}
              onPress={() => onChange(opt.value)}
              style={[
                styles.chip,
                {
                  borderColor: selected ? `${accent}99` : theme.app.dashboard.cardBorder,
                  backgroundColor: selected ? `${accent}22` : 'rgba(255,255,255,0.04)',
                },
              ]}
            >
              <Typography
                variant="small"
                style={{ fontWeight: selected ? '700' : '500' }}
                color={selected ? accent : theme.app.text.secondary}
              >
                {opt.label}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function WebsiteAssignmentRow({
  item,
  canAssign,
  onOpen,
  onSchedule,
  onTopics,
  onClear,
}: {
  item: WebsiteAssignmentScopeItem;
  canAssign: boolean;
  onOpen: () => void;
  onSchedule: () => void;
  onTopics: () => void;
  onClear: () => void;
}) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const filled = item.filledSlots ?? item.assignedCount ?? 0;
  const expected = item.expectedRosterSlots ?? 0;
  const hoursReady = Boolean(item.serviceSchedulingConfigured || item.serviceHoursConfigured);

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [
        styles.siteRow,
        {
          borderColor: theme.app.dashboard.cardBorder,
          backgroundColor: 'rgba(255,255,255,0.04)',
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.siteIcon,
          { backgroundColor: `${accent}22`, borderColor: glassUi.border.subtle },
        ]}
      >
        <Ionicons name="globe-outline" size={18} color={accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <Typography variant="medium16" style={{ fontWeight: '700' }} numberOfLines={1}>
          {websiteLabel(item)}
        </Typography>
        {item.url ? (
          <Typography variant="small" muted numberOfLines={1}>
            {item.url}
          </Typography>
        ) : null}
        <View style={styles.chipRow}>
          <StatusChip
            label={`${filled}${expected ? `/${expected}` : ''} agents`}
            tone={item.isFullyAssigned ? 'success' : filled > 0 ? 'info' : 'neutral'}
          />
          <StatusChip label={hoursReady ? 'Hours' : 'No hours'} tone={hoursReady ? 'success' : 'warning'} />
          <StatusChip
            label={item.visitorTopicsConfigured ? 'Topics' : 'No topics'}
            tone={item.visitorTopicsConfigured ? 'success' : 'warning'}
          />
        </View>
        <View style={styles.iconActions}>
          <IconAction icon="time-outline" label="Hours" onPress={onSchedule} />
          <IconAction icon="chatbubbles-outline" label="Topics" onPress={onTopics} />
          {canAssign && filled > 0 ? (
            <IconAction icon="trash-outline" label="Clear" danger onPress={onClear} />
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.app.text.secondary} />
    </Pressable>
  );
}

function IconAction({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const theme = useAppTheme();
  const color = danger ? theme.app.danger : theme.app.dashboard.accentBlue;
  return (
    <Pressable
      onPress={(e) => {
        e.stopPropagation?.();
        onPress();
      }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconAction,
        {
          borderColor: danger ? 'rgba(239,68,68,0.28)' : glassUi.border.subtle,
          backgroundColor: danger ? 'rgba(239,68,68,0.12)' : `${theme.app.dashboard.accentBlue}16`,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={14} color={color} />
      <Typography variant="small" style={{ fontWeight: '600', color }}>
        {label}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 28 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterSheet: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 14,
  },
  addCta: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  addCtaGlow: {
    position: 'absolute',
    top: -24,
    right: -16,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  addCtaIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  addCtaCopy: { flex: 1, minWidth: 0, gap: 2 },
  addCtaChevron: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCell: { flexGrow: 1, flexBasis: '30%', minWidth: 140 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  centered: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  empty: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  parentCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 12,
  },
  parentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  parentIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  countPill: {
    minWidth: 26,
    height: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  siteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  siteIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  iconAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
});
