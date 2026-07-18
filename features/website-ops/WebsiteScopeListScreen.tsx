import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import {
  AppCard,
  MetricCard,
  SearchBar,
  StatusChip,
  TablePagination,
  Typography,
} from '@/components/ui';
import type { WebsiteAssignmentScopeItem } from '@/api/types/website-assignments.types';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useWebsiteAssignmentGates } from '@/lib/permissions/use-website-assignment-gates';
import { useWebsiteAssignmentsWebsitesQuery } from '@/lib/hooks/query/website-assignments/hooks';
import { useAppTheme } from '@/theme';
import { WebsiteAssignmentScopeFilterPanel } from '@/features/website-assignments/components/WebsiteAssignmentScopeFilterPanel';
import { useWebsiteAssignmentScopeFilters } from '@/features/website-assignments/hooks/useWebsiteAssignmentScopeFilters';
import {
  SCHEDULING_FILTER_OPTIONS,
  TOPICS_FILTER_OPTIONS,
  parseSchedulingFilter,
  parseTopicsFilter,
} from '@/features/website-assignments/utils/list-filter-params';
import { glassUi } from '@/lib/theme/glass-ui';

const PAGE_SIZE = 25;

type IconName = ComponentProps<typeof Ionicons>['name'];

export type WebsiteScopeListMode = 'scheduling' | 'topics';

export type WebsiteScopeListScreenProps = {
  title: string;
  description: string;
  icon?: IconName;
  mode: WebsiteScopeListMode;
  detailRoute: (websiteId: string) => string;
  addRoute?: string;
};

function websiteLabel(item: WebsiteAssignmentScopeItem): string {
  const name = (item.name ?? '').trim();
  const url = (item.url ?? '').trim();
  return name || url || item.websiteId.slice(0, 8);
}

function statusForMode(item: WebsiteAssignmentScopeItem, mode: WebsiteScopeListMode) {
  if (mode === 'scheduling') {
    const ready = Boolean(item.serviceHoursConfigured || item.serviceSchedulingConfigured);
    return { label: ready ? 'Hours configured' : 'Schedule needed', ready };
  }
  const count = item.activeTopicCount ?? item.topicLabels?.length ?? 0;
  const ready = Boolean(item.visitorTopicsConfigured || count > 0);
  return {
    label: ready ? (count > 0 ? `${count} topic${count === 1 ? '' : 's'}` : 'Topics configured') : 'Topics needed',
    ready,
  };
}

/** Scoped website list for service schedules or inquire topics. */
export function WebsiteScopeListScreen({
  title,
  description,
  icon = 'globe-outline',
  mode,
  detailRoute,
  addRoute,
}: WebsiteScopeListScreenProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const gates = useWebsiteAssignmentGates();
  const scope = useWebsiteAssignmentScopeFilters();
  const accent = theme.app.dashboard.accentBlue;

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const schedulingFilter = parseSchedulingFilter(filterStatus);
  const topicsFilter = parseTopicsFilter(filterStatus);

  useEffect(() => {
    setPage(1);
  }, [
    scope.filterResellerId,
    scope.filterParentCompanyId,
    scope.filterChildCompanyId,
    search,
    filterStatus,
  ]);

  const listQuery = useWebsiteAssignmentsWebsitesQuery(
    {
      page,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
      resellerId: scope.filterResellerId.trim() || undefined,
      parentCompanyId: scope.filterParentCompanyId.trim() || undefined,
      childCompanyId: scope.filterChildCompanyId.trim() || undefined,
      ...(mode === 'scheduling'
        ? { serviceHoursConfigured: schedulingFilter }
        : { visitorTopicsConfigured: topicsFilter }),
    },
    { enabled: gates.view },
  );

  const payload = listQuery.data?.data;
  const items = payload?.items ?? [];
  const total = payload?.total ?? items.length;
  const totalPages = Math.max(1, payload?.totalPages ?? (Math.ceil(total / PAGE_SIZE) || 1));

  const statsQuery = useWebsiteAssignmentsWebsitesQuery(
    {
      all: true,
      search: search.trim() || undefined,
      resellerId: scope.filterResellerId.trim() || undefined,
      parentCompanyId: scope.filterParentCompanyId.trim() || undefined,
      childCompanyId: scope.filterChildCompanyId.trim() || undefined,
    },
    { enabled: gates.view },
  );

  const statsItems = statsQuery.data?.data?.items ?? [];
  const configuredCount = useMemo(() => {
    if (mode === 'scheduling') {
      return statsItems.filter((i) => i.serviceHoursConfigured || i.serviceSchedulingConfigured)
        .length;
    }
    return statsItems.filter((i) => i.visitorTopicsConfigured).length;
  }, [mode, statsItems]);

  const filterOptions = mode === 'scheduling' ? SCHEDULING_FILTER_OPTIONS : TOPICS_FILTER_OPTIONS;

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
      <FlatList
        data={items}
        keyExtractor={(item) => item.websiteId}
        contentContainerStyle={{ gap: 10, paddingBottom: 28 }}
        refreshControl={
          <RefreshControl
            refreshing={listQuery.isRefetching && !listQuery.isLoading}
            onRefresh={() => void listQuery.refetch()}
            tintColor={accent}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: theme.spacing.md, marginBottom: theme.spacing.sm }}>
            <DashboardPageIntro subtitle={description}>
              <SearchBar
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
                placeholder="Search website, company, URL…"
              />

              <View style={styles.chipRow}>
                {filterOptions.map((opt) => {
                  const selected = filterStatus === opt.value;
                  return (
                    <Pressable
                      key={opt.value || 'all'}
                      onPress={() => setFilterStatus(opt.value)}
                      style={[
                        styles.chip,
                        {
                          borderColor: selected ? `${accent}99` : theme.app.dashboard.cardBorder,
                          backgroundColor: selected
                            ? `${accent}22`
                            : theme.app.dashboard.overlayLight,
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

              <Pressable
                onPress={() => setFiltersOpen((v) => !v)}
                style={({ pressed }) => [
                  styles.filterToggle,
                  {
                    borderColor: filtersOpen ? `${accent}88` : theme.app.dashboard.cardBorder,
                    backgroundColor: filtersOpen
                      ? `${accent}18`
                      : theme.app.dashboard.overlayLight,
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
                  {filtersOpen ? 'Hide company scope' : 'Company scope'}
                </Typography>
              </Pressable>

              {filtersOpen ? (
                <WebsiteAssignmentScopeFilterPanel
                  filterResellerId={scope.filterResellerId}
                  filterParentCompanyId={scope.filterParentCompanyId}
                  filterChildCompanyId={scope.filterChildCompanyId}
                  setFilterResellerId={scope.setFilterResellerId}
                  setFilterParentCompanyId={scope.setFilterParentCompanyId}
                  setFilterChildCompanyId={scope.setFilterChildCompanyId}
                  resellerFilterOptions={scope.resellerFilterOptions}
                  parentCompanyFilterOptions={scope.parentCompanyFilterOptions}
                  childCompanyFilterOptions={scope.childCompanyFilterOptions}
                  canFilterByResellerId={scope.canFilterByResellerId}
                  hasScopeFilters={scope.hasScopeFilters}
                  onClearAll={scope.clearScopeFilters}
                  onClose={() => setFiltersOpen(false)}
                />
              ) : null}

              {addRoute ? (
                <Pressable
                  onPress={() => router.push(addRoute as Href)}
                  style={({ pressed }) => [
                    styles.addCta,
                    {
                      borderColor: theme.app.dashboard.cardBorder,
                      backgroundColor: theme.app.dashboard.overlayLight,
                      opacity: pressed ? 0.9 : 1,
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
                    <Ionicons name="add" size={22} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="medium16" style={{ fontWeight: '700' }}>
                      Add {mode === 'scheduling' ? 'schedule' : 'topics'}
                    </Typography>
                    <Typography variant="small" muted>
                      Pick a website and configure
                    </Typography>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color={accent} />
                </Pressable>
              ) : null}
            </DashboardPageIntro>

            <View style={styles.metricRow}>
              <View style={styles.metric}>
                <MetricCard
                  title="In scope"
                  value={String(statsItems.length)}
                  subtitle="Websites"
                  showTrendArrow={false}
                  icon={<Ionicons name={icon} size={18} color={accent} />}
                  iconBgColor={`${accent}28`}
                  valueColor={accent}
                />
              </View>
              <View style={styles.metric}>
                <MetricCard
                  title="Configured"
                  value={String(configuredCount)}
                  subtitle={mode === 'scheduling' ? 'With hours' : 'With topics'}
                  showTrendArrow={false}
                  icon={
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color={theme.app.dashboard.accentGreen}
                    />
                  }
                  iconBgColor="rgba(34, 197, 94, 0.18)"
                  valueColor={theme.app.dashboard.accentGreen}
                />
              </View>
            </View>

            <Typography variant="small" muted>
              {title} · {total} result{total === 1 ? '' : 's'}
            </Typography>
          </View>
        }
        ListEmptyComponent={
          listQuery.isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={accent} />
            </View>
          ) : listQuery.isError ? (
            <AppCard>
              <Typography variant="medium" color={theme.app.danger}>
                {extractApiErrorMessage(listQuery.error, `Could not load ${title.toLowerCase()}.`)}
              </Typography>
            </AppCard>
          ) : (
            <View
              style={[
                styles.empty,
                {
                  borderColor: theme.app.dashboard.cardBorder,
                  backgroundColor: theme.app.dashboard.overlayLight,
                },
              ]}
            >
              <Ionicons name={icon} size={28} color={accent} />
              <Typography variant="medium16" style={{ fontWeight: '700' }}>
                No websites match
              </Typography>
              <Typography variant="small" muted style={{ textAlign: 'center' }}>
                Try a different filter or search.
              </Typography>
            </View>
          )
        }
        renderItem={({ item }) => {
          const status = statusForMode(item, mode);
          return (
            <Pressable
              onPress={() => router.push(detailRoute(item.websiteId) as Href)}
              style={({ pressed }) => [
                styles.row,
                {
                  borderColor: theme.app.dashboard.cardBorder,
                  backgroundColor: theme.app.dashboard.overlayLight,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.rowIcon,
                  { backgroundColor: `${accent}22`, borderColor: glassUi.border.subtle },
                ]}
              >
                <Ionicons name={icon} size={18} color={accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <Typography variant="medium16" style={{ fontWeight: '700' }} numberOfLines={1}>
                  {websiteLabel(item)}
                </Typography>
                {(item.url ?? '').trim() ? (
                  <Typography variant="small" muted numberOfLines={1}>
                    {item.url}
                  </Typography>
                ) : null}
                <Typography variant="small" muted numberOfLines={1}>
                  {item.parentCompanyName} · {item.childCompanyName}
                </Typography>
                <StatusChip
                  label={status.label}
                  tone={status.ready ? 'success' : 'warning'}
                />
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.app.text.secondary} />
            </Pressable>
          );
        }}
        ListFooterComponent={
          totalPages > 1 ? (
            <TablePagination page={page} pageCount={totalPages} onPageChange={setPage} />
          ) : null
        }
      />
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  metricRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: { flexGrow: 1, flexBasis: '45%', minWidth: 140 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterToggle: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  addCta: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
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
  centered: { minHeight: 100, alignItems: 'center', justifyContent: 'center' },
  empty: {
    alignItems: 'center',
    gap: 8,
    padding: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
