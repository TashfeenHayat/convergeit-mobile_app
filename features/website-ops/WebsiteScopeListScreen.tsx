import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';

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
  StatusChip,
  TablePagination,
  Typography,
} from '@/components/ui';
import type { WebsiteAssignmentScopeItem } from '@/api/types/website-assignments.types';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useCompaniesSetupResellersQuery } from '@/lib/hooks/query/companies';
import { useWebsiteAssignmentGates } from '@/lib/permissions/use-website-assignment-gates';
import { websiteAssignmentsKeys } from '@/lib/hooks/query/website-assignments/keys';
import { useWebsiteAssignmentsWebsitesQuery } from '@/lib/hooks/query/website-assignments/hooks';
import { deleteServiceScheduling } from '@/services/chat/service-scheduling.api';
import { glassUi } from '@/lib/theme/glass-ui';
import { useAppTheme } from '@/theme';
import { WebsiteAssignmentScopeFilterPanel } from '@/features/website-assignments/components/WebsiteAssignmentScopeFilterPanel';
import { useWebsiteAssignmentScopeFilters } from '@/features/website-assignments/hooks/useWebsiteAssignmentScopeFilters';
import {
  SCHEDULING_FILTER_OPTIONS,
  TOPICS_FILTER_OPTIONS,
  parseSchedulingFilter,
  parseTopicsFilter,
} from '@/features/website-assignments/utils/list-filter-params';

const PAGE_SIZE = 50;

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

function statusForMode(item: WebsiteAssignmentScopeItem, mode: WebsiteScopeListMode) {
  if (mode === 'scheduling') {
    const ready = Boolean(item.serviceHoursConfigured || item.serviceSchedulingConfigured);
    return { label: ready ? 'Hours configured' : 'Please add schedule', ready };
  }
  const count = item.activeTopicCount ?? item.topicLabels?.length ?? 0;
  const ready = Boolean(item.visitorTopicsConfigured || count > 0);
  return {
    label: ready
      ? count > 0
        ? `${count} topic${count === 1 ? '' : 's'}`
        : 'Topics configured'
      : 'Please add topics',
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
  const queryClient = useQueryClient();
  const gates = useWebsiteAssignmentGates();
  const scope = useWebsiteAssignmentScopeFilters();
  const accent = theme.app.dashboard.accentBlue;

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WebsiteAssignmentScopeItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const schedulingFilter = parseSchedulingFilter(filterStatus);
  const topicsFilter = parseTopicsFilter(filterStatus);

  /** Web parity on Service Scheduling / Inquire Topics open: GET /companies/setup/resellers */
  useCompaniesSetupResellersQuery({ enabled: gates.view });

  useEffect(() => {
    setPage(1);
  }, [
    scope.filterResellerId,
    scope.filterParentCompanyId,
    scope.filterChildCompanyId,
    search,
    filterStatus,
  ]);

  /** Web parity: GET /website-assignments/websites?page=1&limit=50 */
  const listQuery = useWebsiteAssignmentsWebsitesQuery(
    {
      page,
      limit: PAGE_SIZE,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(scope.filterResellerId.trim()
        ? { resellerId: scope.filterResellerId.trim() }
        : {}),
      ...(scope.filterParentCompanyId.trim()
        ? { parentCompanyId: scope.filterParentCompanyId.trim() }
        : {}),
      ...(scope.filterChildCompanyId.trim()
        ? { childCompanyId: scope.filterChildCompanyId.trim() }
        : {}),
      ...(mode === 'scheduling' && schedulingFilter !== undefined
        ? { serviceHoursConfigured: schedulingFilter }
        : {}),
      ...(mode === 'topics' && topicsFilter !== undefined
        ? { visitorTopicsConfigured: topicsFilter }
        : {}),
    },
    { enabled: gates.view, allowResellerIdFilter: scope.canFilterByResellerId },
  );

  const payload = listQuery.data?.data;
  const items = payload?.items ?? [];
  const total = payload?.total ?? items.length;
  const totalPages = Math.max(1, payload?.totalPages ?? (Math.ceil(total / PAGE_SIZE) || 1));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

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

  const handleDelete = async () => {
    if (!deleteTarget || !gates.assign) return;
    setDeleting(true);
    try {
      await deleteServiceScheduling(deleteTarget.websiteId);
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: websiteAssignmentsKeys.all });
      void listQuery.refetch();
      void statsQuery.refetch();
      Alert.alert(
        'Removed',
        mode === 'scheduling'
          ? 'Service schedule cleared for this website.'
          : 'Schedule and topics cleared for this website.',
      );
    } catch (err) {
      Alert.alert('Delete failed', extractApiErrorMessage(err));
    } finally {
      setDeleting(false);
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
        <DashboardPageIntro subtitle={description}>
          {addRoute ? (
            <Pressable
              onPress={() => router.push(addRoute as Href)}
              accessibilityRole="button"
              accessibilityLabel={
                mode === 'scheduling' ? 'Add schedule' : 'Add topics'
              }
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
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </View>
              <View style={styles.addCtaCopy}>
                <Typography variant="medium16" style={{ fontWeight: '700' }}>
                  Add {mode === 'scheduling' ? 'schedule' : 'topics'}
                </Typography>
                <Typography variant="small" muted numberOfLines={2}>
                  Pick a website and configure
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
            onSearch={() => {
              setSearch(searchInput.trim());
              setPage(1);
            }}
            placeholder="Search website, URL, company, reseller…"
            filtersOpen={filtersOpen}
            onFilterPress={() => setFiltersOpen((v) => !v)}
            hasActiveFilters={Boolean(
              scope.hasScopeFilters || search.trim() || filterStatus.trim(),
            )}
          >
            {filtersOpen ? (
              <>
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
                            borderColor: selected
                              ? `${accent}99`
                              : theme.app.dashboard.cardBorder,
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
              </>
            ) : null}
          </FiltersSearchBar>
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

        {listQuery.isError ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(listQuery.error, `Could not load ${title.toLowerCase()}.`)}
            </Typography>
            <Button size="compact" variant="outlined" onPress={() => void listQuery.refetch()}>
              Retry
            </Button>
          </AppCard>
        ) : (
          <ListTableCard
            title={`Websites (${total})`}
            subtitle={title}
            icon={icon}
            toolbar={null}
          >
            <DataCardGrid
              columns={1}
              isLoading={listQuery.isLoading && !listQuery.data}
              empty={!listQuery.isLoading && items.length === 0}
              emptyState={{
                title: 'No websites match',
                description: 'Try a different filter or search.',
                icon,
              }}
              showingLabel={
                items.length > 0
                  ? `Showing data ${from} to ${to} of ${total} entries`
                  : undefined
              }
              footerRight={
                <TablePagination page={page} pageCount={totalPages} onPageChange={setPage} />
              }
            >
              {items.map((item) => {
                const status = statusForMode(item, mode);
                const org =
                  [item.parentCompanyName, item.childCompanyName].filter(Boolean).join(' · ') ||
                  '—';
                return (
                  <EntityListCard
                    key={item.websiteId}
                    title={websiteHost(item)}
                    subtitle={(item.url ?? '').trim() || undefined}
                    details={[{ label: 'Organization', value: org }]}
                    onPress={() => router.push(detailRoute(item.websiteId) as Href)}
                    onEditPress={() => router.push(detailRoute(item.websiteId) as Href)}
                    onDeletePress={
                      gates.assign && mode === 'scheduling'
                        ? () => setDeleteTarget(item)
                        : undefined
                    }
                    badge={
                      <StatusChip
                        label={status.label}
                        tone={status.ready ? 'success' : 'warning'}
 />
                    }
 />
                );
              })}
            </DataCardGrid>
          </ListTableCard>
        )}
      </ScrollView>

      <ConfirmActionModal
        open={Boolean(deleteTarget)}
        title={mode === 'scheduling' ? 'Delete schedule?' : 'Clear website schedule?'}
        description={
          mode === 'scheduling'
            ? `Removes service hours for ${deleteTarget ? websiteHost(deleteTarget) : 'this website'}.`
            : `Clears schedule data for ${deleteTarget ? websiteHost(deleteTarget) : 'this website'}.`
        }
        confirmLabel="Delete"
        confirmButtonVariant="danger"
        isLoading={deleting}
        onDismiss={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
 />
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
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
  metricRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: { flexGrow: 1, flexBasis: '45%', minWidth: 140 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
});
