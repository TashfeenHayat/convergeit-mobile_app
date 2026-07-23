import { useEffect, useMemo, useState } from 'react';
import {
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
  DataCardGrid,
  EntityListCard,
  FiltersSearchBar,
  ListTableCard,
  MetricCard,
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
  const name = (item.name ?? '').trim();
  const url = (item.url ?? '').trim();
  return name || url || item.websiteId.slice(0, 8);
}

function websiteHost(item: WebsiteAssignmentScopeItem): string {
  const url = (item.url ?? '').trim();
  if (!url) return websiteLabel(item);
  try {
    const host = new URL(url.includes('://') ? url : `https://${url}`).hostname;
    return host || url;
  } catch {
    return url.replace(/^https?:\/\//i, '');
  }
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

  const [searchInput, setSearchInput] = useState('');
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

  const hasActiveFilters = Boolean(
    scope.hasScopeFilters ||
      filterAssigned.trim() ||
      filterRoster.trim() ||
      search.trim(),
  );

  useEffect(() => {
    setPage(1);
  }, [scope.filterResellerId, parentId, childId, search, filterAssigned, filterRoster]);

  const applySearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

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
        } showsVerticalScrollIndicator={false}>
        <DashboardPageIntro
          subtitle={
            isSitesPage
              ? 'Sites under this company — open any row to manage roster and hours.'
              : 'Manage service schedules and agent rosters per website — scoped to your reseller or client.'
          }
        >
          {gates.assign ? (
            <Pressable
              onPress={() => router.push('/website-assigning/assign' as Href)}
              accessibilityRole="button"
              accessibilityLabel="Assign Website"
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
                  Assign Website
                </Typography>
                <Typography variant="small" muted numberOfLines={2}>
                  Pick a site and open its roster workspace
                </Typography>
              </View>
              <View
                style={[
                  styles.addCtaChevron,
                  {
                    backgroundColor: `${accent}22`,
                    borderColor: glassUi.border.subtle,
                  },
                ]}
              >
                <Ionicons name="arrow-forward" size={16} color={accent} />
              </View>
            </Pressable>
          ) : null}

          <FiltersSearchBar
            value={searchInput}
            onChange={setSearchInput}
            onSearch={applySearch}
            placeholder="Search URL, website, company, reseller, or assigned user…"
            filtersOpen={filtersOpen}
            onFilterPress={() => setFiltersOpen((v) => !v)}
            hasActiveFilters={hasActiveFilters}
          >
            {filtersOpen ? (
              <>
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
                {(search.trim() || filterAssigned || filterRoster || scope.hasScopeFilters) && (
                  <Button
                    size="compact"
                    variant="outlined"
                    onPress={() => {
                      setSearchInput('');
                      setSearch('');
                      setFilterAssigned('');
                      setFilterRoster('');
                      scope.clearScopeFilters();
                      setPage(1);
                    }}
                  >
                    Clear all filters
                  </Button>
                )}
              </>
            ) : null}
          </FiltersSearchBar>
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
            title={`Websites (${total})`}
            subtitle="Grouped by parent company"
            icon="globe-outline"
            toolbar={null}
          >
            <DataCardGrid
              columns={1}
              isLoading={listQuery.isLoading && !listQuery.data}
              empty={!listQuery.isLoading && items.length === 0}
              emptyState={{
                title: 'No websites found',
                description: 'Try clearing filters or searching a different company.',
                icon: 'globe-outline',
              }}
              showingLabel={
                items.length > 0
                  ? `Showing ${Math.min((page - 1) * PAGE_LIMIT + 1, total)}-${Math.min(page * PAGE_LIMIT, total)} of ${total} • page ${page} of ${totalPages}`
                  : undefined
              }
              footerRight={
                totalPages > 0 ? (
                  <TablePagination page={page} pageCount={totalPages} onPageChange={setPage} />
                ) : undefined
              }
            >
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
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <Typography variant="medium16" style={{ fontWeight: '800' }} numberOfLines={1}>
                        Parent company: {parent.parentCompanyName}
                      </Typography>
                      <Typography variant="small" muted numberOfLines={1}>
                        Client (reseller): {parent.resellerName}
                      </Typography>
                    </View>
                  </View>

                  <View style={{ gap: 12 }}>
                    {parent.children.map((child) => (
                      <View key={child.childCompanyId || child.childCompanyName} style={{ gap: 10 }}>
                        <View style={styles.childHeader}>
                          <View
                            style={[
                              styles.childPill,
                              {
                                backgroundColor: `${accent}18`,
                                borderColor: glassUi.border.subtle,
                              },
                            ]}
                          >
                            <Typography variant="small" style={{ fontWeight: '700' }} numberOfLines={1}>
                              {child.childCompanyName}
                            </Typography>
                            <Typography variant="small" muted>
                              ({child.websites.length} website
                              {child.websites.length === 1 ? '' : 's'})
                            </Typography>
                          </View>
                          {parent.parentCompanyId && child.childCompanyId ? (
                            <Pressable
                              onPress={() =>
                                router.push(
                                  sitesListHref(
                                    parent.parentCompanyId,
                                    child.childCompanyId,
                                  ) as Href,
                                )
                              }
                              hitSlop={6}
                            >
                              <Typography
                                variant="small"
                                style={{ fontWeight: '700', color: accent }}
                              >
                                All websites (detail)
                              </Typography>
                            </Pressable>
                          ) : null}
                        </View>

                        {child.websites.map((item) => {
                          const filled = item.filledSlots ?? item.assignedCount ?? 0;
                          const expected = item.expectedRosterSlots ?? 0;
                          const members = item.uniqueMemberCount ?? filled;
                          const hoursReady = Boolean(
                            item.serviceSchedulingConfigured || item.serviceHoursConfigured,
                          );
                          return (
                            <EntityListCard
                              key={item.websiteId}
                              title={websiteHost(item)}
                              subtitle={item.url?.trim() || undefined}
                              details={[
                                {
                                  label: 'Status',
                                  value: hoursReady ? 'Schedule ready' : 'Please add schedule',
                                },
                                {
                                  label: 'Roster',
                                  value: `${filled} / ${expected} slots`,
                                },
                                {
                                  label: 'Team',
                                  value: `${members} member${members === 1 ? '' : 's'}`,
                                },
                              ]}
                              onPress={() =>
                                router.push(
                                  `/website-assigning/website/${encodeURIComponent(item.websiteId)}` as Href,
                                )
                              }
                              onEditPress={() =>
                                router.push(
                                  `/website-assigning/website/${encodeURIComponent(item.websiteId)}` as Href,
                                )
                              }
                              onDeletePress={
                                gates.assign ? () => setClearTarget(item) : undefined
                              }
                              badge={
                                <Pressable
                                  onPress={() =>
                                    router.push(
                                      `/website-assigning/website/${encodeURIComponent(item.websiteId)}/service-scheduling` as Href,
                                    )
                                  }
                                  hitSlop={8}
                                  style={[
                                    styles.scheduleBtn,
                                    {
                                      borderColor: glassUi.border.subtle,
                                      backgroundColor: `${accent}16`,
                                    },
                                  ]}
                                >
                                  <Ionicons name="time-outline" size={16} color={accent} />
                                </Pressable>
                              }
 />
                          );
                        })}
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </DataCardGrid>
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

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 8 },
  scroll: { paddingBottom: 28 },
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
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  childPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '100%',
    flexShrink: 1,
  },
  scheduleBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
