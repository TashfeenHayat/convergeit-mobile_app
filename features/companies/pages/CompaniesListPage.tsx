import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import {
  AppCard,
  Button,
  ListTableCard,
  SearchBar,
  StatusChip,
  TablePagination,
  Typography,
} from '@/components/ui';
import { CompaniesStatsCards } from '@/features/companies/components/CompaniesStatsCards';
import { CompanySetupDraftsModal } from '@/features/companies/components/CompanySetupDraftsModal';
import { CompanySetupWizardModal } from '@/features/companies/components/CompanySetupWizardModal';
import type {
  CompaniesData,
  CompanyListItem,
  PaginatedCompaniesData,
  PaginatedCompaniesTreeData,
} from '@/api/types/companies.types';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import { parseCompanySetupDraftsList } from '@/lib/companies/setup-drafts-list.utils';
import {
  useCompaniesListQuery,
  useCompanySetupDraftsListQuery,
} from '@/lib/hooks/query/companies/hooks';
import { canCompaniesModuleAction } from '@/lib/permissions';
import { glassUi } from '@/lib/theme/glass-ui';
import { useAppTheme } from '@/theme';

const PAGE_SIZE = 20;

type FlatRow = {
  id: string;
  name: string;
  kind: 'parent' | 'child' | 'reseller';
  subtitle: string;
  parentId?: string;
  resellerId?: string;
};

function isTreeData(data: CompaniesData | undefined): data is PaginatedCompaniesTreeData {
  return Boolean(data && 'view' in data && data.view === 'tree');
}

function flattenTree(data: PaginatedCompaniesTreeData | undefined): FlatRow[] {
  if (!data) return [];
  const rows: FlatRow[] = [];
  for (const item of data.items) {
    const resellerName = item.reseller?.name?.trim() || '—';
    const resellerId = item.reseller?.id?.trim();
    for (const parent of item.parentCompanies ?? []) {
      const parentName = parent.name?.trim() || '—';
      const parentId = parent.id?.trim();
      const children = parent.childCompanies ?? [];
      rows.push({
        id: parentId || `${resellerName}::${parentName}`,
        name: parentName,
        kind: 'parent',
        subtitle: resellerName,
        parentId: parentId || undefined,
        resellerId,
      });
      for (const child of children) {
        const childName = child.name?.trim() || '—';
        rows.push({
          id: child.id || `${parentId}::${childName}`,
          name: childName,
          kind: 'child',
          subtitle: parentName,
          parentId: parentId || child.parentCompanyId || undefined,
          resellerId,
        });
      }
    }
  }
  return rows;
}

function flattenFlat(data: PaginatedCompaniesData | undefined): FlatRow[] {
  return (data?.items ?? []).map((item: CompanyListItem) => ({
    id: item.id,
    name: item.name,
    kind: item.companyType === 'parent' ? 'parent' : 'child',
    subtitle: item.parentCompany?.reseller?.name ?? item.email ?? '—',
    parentId: item.companyType === 'parent' ? item.id : item.parentCompanyId ?? undefined,
  }));
}

export function CompaniesListPage() {
  const theme = useAppTheme();
  const router = useRouter();
  const { hasPage, hasOperational } = useAuth();

  const canCreate = canCompaniesModuleAction(hasPage, hasOperational, 'create');
  const canUpdate = canCompaniesModuleAction(hasPage, hasOperational, 'update');
  const canViewDetail = canCompaniesModuleAction(hasPage, hasOperational, 'detail');
  const canOpenDrafts = canCreate || canUpdate;

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [setupDraftId, setSetupDraftId] = useState<string | null>(null);
  const [draftsModalOpen, setDraftsModalOpen] = useState(false);

  const draftsListQuery = useCompanySetupDraftsListQuery({
    enabled: canOpenDrafts,
  });
  const draftCount = useMemo(
    () => parseCompanySetupDraftsList(draftsListQuery.data).length,
    [draftsListQuery.data],
  );

  const params = useMemo(
    () => ({
      view: 'tree' as const,
      page,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
    }),
    [page, search],
  );

  const query = useCompaniesListQuery(params);
  const data = query.data?.data as CompaniesData | undefined;
  const tree = isTreeData(data) ? data : undefined;
  const flat = !isTreeData(data) ? (data as PaginatedCompaniesData | undefined) : undefined;

  const rows = useMemo(
    () => (tree ? flattenTree(tree) : flattenFlat(flat)),
    [flat, tree],
  );

  const total = data?.total ?? rows.length;
  const pageCount = Math.max(1, data?.totalPages ?? Math.ceil(total / PAGE_SIZE));

  const meta = tree?.meta ?? {
    resellerCount: 0,
    parentCompanyCount: 0,
    childCompanyCount: 0,
  };

  const openRow = (row: FlatRow) => {
    if (!canViewDetail && row.kind !== 'reseller') {
      Alert.alert('Companies', 'You do not have permission to open company details.');
      return;
    }
    if (row.kind === 'reseller' && row.resellerId) {
      router.push(`/companies/reseller/${row.resellerId}/detail` as never);
      return;
    }
    if (row.parentId) {
      router.push(`/companies/parent/${row.parentId}/detail` as never);
      return;
    }
    Alert.alert('Company', row.name);
  };

  if (query.isLoading && !data) {
    return (
      <MobileScreen>
        <AppCard style={{ alignItems: 'center', gap: 12, paddingVertical: 28 }}>
          <Typography variant="medium" muted>
            Loading companies…
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
            refreshing={query.isRefetching && !query.isLoading}
            onRefresh={() => void query.refetch()}
            tintColor={theme.app.dashboard.accentBlue}
          />
        }
      >
        <DashboardPageIntro subtitle="Resellers, parent companies, and client sites.">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search companies…"
          />
          {canOpenDrafts || canCreate ? (
            <View style={styles.actionRow}>
              {canOpenDrafts ? (
                <Pressable
                  onPress={() => setDraftsModalOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Open drafts"
                  style={({ pressed }) => [
                    styles.draftCta,
                    {
                      borderColor: theme.app.dashboard.cardBorder,
                      backgroundColor: theme.app.dashboard.overlayLight,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.draftCtaIcon,
                      {
                        backgroundColor: `${theme.app.dashboard.accentBlue}22`,
                        borderColor: glassUi.border.subtle,
                      },
                    ]}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color={theme.app.dashboard.accentBlue}
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="medium" style={{ fontWeight: '700' }}>
                      Draft{draftCount > 0 ? ` (${draftCount})` : ''}
                    </Typography>
                    <Typography variant="small" muted numberOfLines={1}>
                      Resume in-progress setups
                    </Typography>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.app.text.secondary} />
                </Pressable>
              ) : null}

              {canCreate ? (
                <Pressable
                  onPress={() => {
                    setSetupDraftId(null);
                    setWizardOpen(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Add company"
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
                  <View
                    style={[
                      styles.addCtaGlow,
                      { backgroundColor: `${theme.app.dashboard.accentBlue}18` },
                    ]}
                  />
                  <View
                    style={[
                      styles.addCtaIcon,
                      {
                        backgroundColor: theme.app.dashboard.accentBlue,
                        borderColor: `${theme.app.dashboard.accentBlue}66`,
                      },
                    ]}
                  >
                    <Ionicons name="add" size={22} color="#FFFFFF" />
                  </View>
                  <View style={styles.addCtaCopy}>
                    <Typography variant="medium16" style={{ fontWeight: '700' }}>
                      Add company
                    </Typography>
                    <Typography variant="small" muted numberOfLines={2}>
                      Set up reseller, parent, child site & POC
                    </Typography>
                  </View>
                  <View
                    style={[
                      styles.addCtaChevron,
                      {
                        backgroundColor: `${theme.app.dashboard.accentBlue}22`,
                        borderColor: glassUi.border.subtle,
                      },
                    ]}
                  >
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={theme.app.dashboard.accentBlue}
                    />
                  </View>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {draftCount > 0 ? (
            <Typography variant="small" muted>
              In-progress setups are in Draft — use Resume there. Add company always starts a new setup.
            </Typography>
          ) : null}
        </DashboardPageIntro>

        <CompaniesStatsCards
          resellerCount={meta.resellerCount}
          parentCompanyCount={meta.parentCompanyCount}
          childCompanyCount={meta.childCompanyCount}
        />

        {query.isError ? (
          <AppCard>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(query.error, 'Could not load companies.')}
            </Typography>
            <Button size="compact" variant="outlined" onPress={() => void query.refetch()}>
              Retry
            </Button>
          </AppCard>
        ) : (
          <ListTableCard
            title="All companies"
            subtitle={`${total} result${total === 1 ? '' : 's'}`}
            icon="business-outline"
            toolbar={null}
            footer={
              pageCount > 1 ? (
                <TablePagination page={page} pageCount={pageCount} onPageChange={setPage} />
              ) : undefined
            }
          >
            {rows.length === 0 ? (
              <View style={styles.empty}>
                <View
                  style={[
                    styles.emptyIcon,
                    {
                      backgroundColor: `${theme.app.dashboard.accentBlue}22`,
                      borderColor: glassUi.border.subtle,
                    },
                  ]}
                >
                  <Ionicons
                    name="business-outline"
                    size={28}
                    color={theme.app.dashboard.accentBlue}
                  />
                </View>
                <Typography variant="medium16" style={{ fontWeight: '700' }}>
                  No companies found
                </Typography>
                <Typography variant="small" muted style={{ textAlign: 'center' }}>
                  {search.trim()
                    ? 'Try a different search, or add a new company.'
                    : 'Create your first reseller, parent, and child setup.'}
                </Typography>
                {canCreate ? (
                  <Button size="compact" onPress={() => {
                    setSetupDraftId(null);
                    setWizardOpen(true);
                  }}>
                    Add company
                  </Button>
                ) : null}
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {rows.map((row) => (
                  <Pressable
                    key={row.id}
                    onPress={() => openRow(row)}
                    style={({ pressed }) => [
                      styles.rowCard,
                      {
                        backgroundColor: theme.app.dashboard.overlayLight,
                        borderColor: theme.app.dashboard.cardBorder,
                      },
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${row.name}`}
                  >
                    <View
                      style={[
                        styles.rowIcon,
                        {
                          backgroundColor: `${theme.app.dashboard.accentBlue}22`,
                          borderColor: glassUi.border.subtle,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          row.kind === 'parent'
                            ? 'business-outline'
                            : row.kind === 'child'
                              ? 'globe-outline'
                              : 'briefcase-outline'
                        }
                        size={18}
                        color={theme.app.dashboard.accentBlue}
                      />
                    </View>
                    <View style={styles.rowBody}>
                      <View style={styles.rowTitleLine}>
                        <Typography variant="medium16" style={styles.rowTitle} numberOfLines={1}>
                          {row.name}
                        </Typography>
                        <StatusChip
                          label={row.kind === 'parent' ? 'Parent' : row.kind === 'child' ? 'Child' : 'Reseller'}
                          tone={row.kind === 'parent' ? 'info' : row.kind === 'child' ? 'success' : 'neutral'}
                        />
                      </View>
                      <Typography variant="small" muted numberOfLines={1}>
                        {row.subtitle}
                      </Typography>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={theme.app.text.secondary}
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </ListTableCard>
        )}
      </ScrollView>

      <CompanySetupDraftsModal
        open={draftsModalOpen}
        onClose={() => setDraftsModalOpen(false)}
        onResume={(id) => {
          setSetupDraftId(id);
          setWizardOpen(true);
          setDraftsModalOpen(false);
        }}
        onStartNew={() => {
          setDraftsModalOpen(false);
          setSetupDraftId(null);
          setWizardOpen(true);
        }}
      />

      <CompanySetupWizardModal
        key={setupDraftId ?? 'company-setup-new'}
        open={wizardOpen}
        draftId={setupDraftId}
        onClose={(reason) => {
          setWizardOpen(false);
          setSetupDraftId(null);
          if (reason === 'completed' || reason === 'dismissed') {
            void draftsListQuery.refetch();
            if (reason === 'completed') void query.refetch();
          }
        }}
      />
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 28 },
  actionRow: { gap: 10 },
  draftCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  draftCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
  addCtaCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  addCtaChevron: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  empty: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
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
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowTitle: {
    flex: 1,
    minWidth: 0,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
  },
});
