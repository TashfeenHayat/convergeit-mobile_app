import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';

import type { WebsiteDirectoryItem } from '@/api/types/companies.types';
import { MobileScreen } from '@/components/layout';
import {
  AppCard,
  Button,
  MetricCard,
  SearchBar,
  TablePagination,
  Typography,
} from '@/components/ui';
import { apiClient } from '@/api/http/axios-instance';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import { canViewWebsiteDirectory } from '@/lib/permissions';
import { useWebsiteDirectoryQuery } from '@/lib/hooks/query/companies/hooks';
import { useAppTheme } from '@/theme';
import { WebsiteAssignmentScopeFilterPanel } from '@/features/website-assignments/components/WebsiteAssignmentScopeFilterPanel';
import { useWebsiteAssignmentScopeFilters } from '@/features/website-assignments/hooks/useWebsiteAssignmentScopeFilters';
import { ApiResourceScreen } from '@/features/shared';
import { WebsiteScopeListScreen } from './WebsiteScopeListScreen';

const PAGE_SIZE = 20;

function unwrapDirectory(payload: unknown): {
  items: WebsiteDirectoryItem[];
  total: number;
  totalPages: number;
} {
  const root = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
  const data =
    root?.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>) : root;
  const items = Array.isArray(data?.items) ? (data.items as WebsiteDirectoryItem[]) : [];
  const total = Number(data?.total ?? items.length) || 0;
  const limit = Number(data?.limit ?? PAGE_SIZE) || PAGE_SIZE;
  const totalPages = Math.max(1, Number(data?.totalPages ?? (Math.ceil(total / limit) || 1)));
  return { items, total, totalPages };
}

/** Website directory — GET /companies/website-directory (web parity). */
export function WebsitesDirectoryPage() {
  const theme = useAppTheme();
  const { hasPage, hasOperational } = useAuth();
  const canView = canViewWebsiteDirectory(hasPage, hasOperational);
  const scope = useWebsiteAssignmentScopeFilters();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const scopeFilters = useMemo(
    () => ({
      ...(scope.canFilterByResellerId && scope.filterResellerId.trim()
        ? { resellerId: scope.filterResellerId.trim() }
        : {}),
      ...(scope.filterParentCompanyId.trim()
        ? { parentCompanyId: scope.filterParentCompanyId.trim() }
        : {}),
      ...(scope.filterChildCompanyId.trim()
        ? { childCompanyId: scope.filterChildCompanyId.trim() }
        : {}),
    }),
    [
      scope.canFilterByResellerId,
      scope.filterResellerId,
      scope.filterParentCompanyId,
      scope.filterChildCompanyId,
    ],
  );

  useEffect(() => {
    setPage(1);
  }, [scope.filterResellerId, scope.filterParentCompanyId, scope.filterChildCompanyId, search]);

  const listQuery = useWebsiteDirectoryQuery(
    { page, limit: PAGE_SIZE, search: search.trim() || undefined, ...scopeFilters },
    { enabled: canView },
  );

  const statsQuery = useWebsiteDirectoryQuery(
    { all: true, search: search.trim() || undefined, ...scopeFilters },
    { enabled: canView },
  );

  const payload = useMemo(() => unwrapDirectory(listQuery.data), [listQuery.data]);
  const statsPayload = useMemo(() => unwrapDirectory(statsQuery.data), [statsQuery.data]);
  const statsItems = statsPayload.items;

  const uniqueResellers = useMemo(
    () => new Set(statsItems.map((r) => r.resellerId)).size,
    [statsItems],
  );
  const uniqueParents = useMemo(
    () => new Set(statsItems.map((r) => r.parentCompanyId)).size,
    [statsItems],
  );

  if (!canView) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" muted>
            You do not have permission to view the website directory.
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <FlatList
        data={payload.items}
        keyExtractor={(item) => item.websiteId}
        contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 28 }}
        refreshControl={
          <RefreshControl
            refreshing={listQuery.isRefetching && !listQuery.isLoading}
            onRefresh={() => void listQuery.refetch()}
            tintColor={theme.app.dashboard.accentBlue}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: theme.spacing.md, marginBottom: theme.spacing.sm }}>
            <View>
              <Typography variant="boldLarge">Website directory</Typography>
              <Typography variant="medium" muted style={{ marginTop: 4 }}>
                Reseller, companies, POC, and creator for each website.
              </Typography>
            </View>

            <View style={styles.metricRow}>
              <MetricCard
                title="Websites"
                value={statsQuery.isLoading ? '…' : String(statsPayload.total)}
                subtitle="In scope"
                showTrendArrow={false}
                valueColor={theme.app.dashboard.accentBlue}
                iconBgColor="rgba(0, 132, 255, 0.2)"
                icon={<Ionicons name="globe-outline" size={18} color={theme.app.dashboard.accentBlue} />}
                style={styles.metric}
              />
              <MetricCard
                title="Resellers"
                value={String(uniqueResellers)}
                subtitle="Unique"
                showTrendArrow={false}
                valueColor={theme.app.dashboard.accentBlue}
                iconBgColor="rgba(88, 101, 242, 0.18)"
                icon={<Ionicons name="business-outline" size={18} color={theme.app.dashboard.accentBlue} />}
                style={styles.metric}
              />
              <MetricCard
                title="Parents"
                value={String(uniqueParents)}
                subtitle="Companies"
                showTrendArrow={false}
                valueColor={theme.app.dashboard.accentGreen}
                iconBgColor="rgba(34, 197, 94, 0.18)"
                icon={<Ionicons name="layers-outline" size={18} color={theme.app.dashboard.accentGreen} />}
                style={styles.metric}
              />
            </View>

            <View style={styles.searchRow}>
              <View style={{ flex: 1 }}>
                <SearchBar
                  value={searchInput}
                  onChange={setSearchInput}
                  placeholder="Search URL, company, POC…"
                />
              </View>
              <Button
                size="compact"
                variant="secondary"
                onPress={() => {
                  setSearch(searchInput.trim());
                  setPage(1);
                }}
              >
                Search
              </Button>
            </View>

            <Button variant="outlined" size="compact" onPress={() => setFiltersOpen((v) => !v)}>
              {filtersOpen ? 'Hide scope filters' : 'Scope filters'}
            </Button>

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
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          listQuery.isLoading ? (
            <ActivityIndicator color={theme.app.dashboard.accentBlue} />
          ) : listQuery.isError ? (
            <AppCard>
              <Typography variant="medium" color={theme.app.danger}>
                {extractApiErrorMessage(listQuery.error, 'Could not load websites.')}
              </Typography>
            </AppCard>
          ) : (
            <AppCard>
              <Typography variant="medium" muted>
                No websites match your filters.
              </Typography>
            </AppCard>
          )
        }
        renderItem={({ item }) => (
          <AppCard style={{ gap: 6 }}>
            <Typography variant="medium16">{item.name !== '—' ? item.name : item.url}</Typography>
            <Typography variant="small" muted numberOfLines={2}>
              {item.url}
            </Typography>
            <Typography variant="small" muted>
              {item.resellerName} · {item.parentCompanyName} · {item.childCompanyName}
            </Typography>
            {item.pocs?.length ? (
              <Typography variant="small" muted>
                POC: {item.pocs.map((p: { name: string }) => p.name).join(', ')}
              </Typography>
            ) : null}
            <Typography variant="small" muted>
              Created by {item.createdByName}
              {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString()}` : ''}
            </Typography>
          </AppCard>
        )}
        ListFooterComponent={
          payload.totalPages > 1 ? (
            <TablePagination page={page} pageCount={payload.totalPages} onPageChange={setPage} />
          ) : null
        }
      />
    </MobileScreen>
  );
}

export function ServiceSchedulesListPage() {
  return (
    <WebsiteScopeListScreen
      title="Service schedules"
      description="Websites with service hours for chat routing."
      icon="time-outline"
      mode="scheduling"
      detailRoute={(id) => `/website-assigning/website/${id}/service-scheduling`}
      addRoute="/website-assigning/service-schedules/add"
    />
  );
}

export function InquireTopicsListPage() {
  return (
    <WebsiteScopeListScreen
      title="Inquire topics"
      description="Visitor inquiry topics for routing and roster."
      icon="list-outline"
      mode="topics"
      detailRoute={(id) => `/website-assigning/website/${id}/inquire-topics`}
      addRoute="/website-assigning/inquire-topics/add"
    />
  );
}

export function PhoneNumberSetupListPage() {
  return (
    <ApiResourceScreen
      title="Text Us / phone setup"
      description="SMS and phone channel numbers per website."
      icon="call-outline"
      queryKey={['website-sms-configs']}
      queryFn={async (params) => {
        const { data } = await (await import('@/api/http/axios-instance')).apiClient.get(
          '/website-sms-configs',
          { params },
        );
        return data;
      }}
      columnIds={['websiteName', 'phoneNumber', 'status']}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
  metricRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: { flexBasis: '30%', flexGrow: 1, minWidth: 100 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
