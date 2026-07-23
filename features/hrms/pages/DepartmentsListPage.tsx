import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

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
  SelectField,
  TablePagination,
  Typography,
} from '@/components/ui';
import {
  AddDepartmentModal,
  type DepartmentRow,
} from '@/features/hrms/components/AddDepartmentModal';
import { extractApiErrorMessage } from '@/lib/api/errors';
import {
  sessionMayPickInternalUserScope,
  useAuth,
  type SessionScopeUser,
} from '@/lib/auth';
import {
  extractParentCompaniesFromByResellerTree,
  pickItemsArray,
  toIdNameOption,
} from '@/lib/companies/scope-tree-options';
import {
  useCompaniesByResellerQuery,
  useCompaniesSetupResellersQuery,
} from '@/lib/hooks/query/companies';
import {
  useDepartmentsListQuery,
  useSoftDeleteDepartmentMutation,
} from '@/lib/hooks/query/hrms/departments';
import { canDepartmentAction } from '@/lib/permissions';
import { glassUi } from '@/lib/theme/glass-ui';
import { pickApiItems, pickApiTotal } from '@/lib/utils/admin-list';
import { isRecord, pickStr } from '@/lib/utils/core';
import { useAppTheme } from '@/theme';

/** Web parity: GET /hrms/departments?page=1&limit=20 */
const PAGE_SIZE = 20;

const TYPE_FILTER_OPTIONS = [
  { label: 'All types', value: '' },
  { label: 'Internal', value: 'Internal' },
  { label: 'External', value: 'External' },
];

function parseRows(data: unknown): DepartmentRow[] {
  const rows: DepartmentRow[] = [];
  for (const r of pickApiItems(data).filter(isRecord)) {
    const id = pickStr(r, ['id']);
    if (!id) continue;
    const typeRaw = pickStr(r, ['type']) || 'Internal';
    const type: DepartmentRow['type'] =
      typeRaw === 'External' ? 'External' : 'Internal';
    const row: DepartmentRow = { id, name: pickStr(r, ['name']) || '—', type };
    const resellerId = pickStr(r, ['resellerId']);
    const parentCompanyId = pickStr(r, ['parentCompanyId']);
    if (resellerId) row.resellerId = resellerId;
    if (parentCompanyId) row.parentCompanyId = parentCompanyId;
    rows.push(row);
  }
  return rows;
}

export function DepartmentsListPage() {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const { hasOperational, isPlatformAdmin, user } = useAuth();
  const mayPickInternalTypeFilter = useMemo(
    () =>
      sessionMayPickInternalUserScope(
        isPlatformAdmin,
        user as SessionScopeUser | null,
      ),
    [isPlatformAdmin, user],
  );
  const canCreate = canDepartmentAction(hasOperational, 'create');
  const canUpdate = canDepartmentAction(hasOperational, 'update');
  const canDelete = canDepartmentAction(hasOperational, 'delete');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'' | 'Internal' | 'External'>('');
  const [filterResellerId, setFilterResellerId] = useState('');
  const [filterParentCompanyId, setFilterParentCompanyId] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<DepartmentRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  /** Web parity: GET /companies/setup/resellers */
  const resellersQuery = useCompaniesSetupResellersQuery({ enabled: true });
  const companiesByResellerQuery = useCompaniesByResellerQuery(
    filterResellerId,
    { view: 'tree', sortBy: 'name', sortOrder: 'asc', all: true },
    { enabled: filterResellerId.trim().length > 0 },
  );

  const resellerOptions = useMemo(
    () =>
      pickItemsArray(resellersQuery.data)
        .map((row) => toIdNameOption(row))
        .filter((o): o is { value: string; label: string } => o !== null),
    [resellersQuery.data],
  );

  const resellerFilterOptions = useMemo(() => {
    const all = { value: '', label: 'All resellers' };
    if (resellerOptions.length > 0) return [all, ...resellerOptions];
    return [
      {
        value: '',
        label: resellersQuery.isLoading
          ? 'Loading resellers…'
          : 'No resellers available',
      },
    ];
  }, [resellerOptions, resellersQuery.isLoading]);

  const parentCompanyFilterOptions = useMemo(() => {
    if (!filterResellerId.trim()) {
      return [{ value: '', label: 'All parent companies' }];
    }
    if (companiesByResellerQuery.isLoading) {
      return [{ value: '', label: 'Loading companies…' }];
    }
    const extracted = extractParentCompaniesFromByResellerTree(
      companiesByResellerQuery.data,
    );
    const all = { value: '', label: 'All parent companies' };
    if (extracted.length > 0) return [all, ...extracted];
    return [{ value: '', label: 'No companies for this reseller' }];
  }, [
    filterResellerId,
    companiesByResellerQuery.isLoading,
    companiesByResellerQuery.data,
  ]);

  const typeForListQuery = mayPickInternalTypeFilter ? filterType : 'External';

  const listParams = useMemo(() => {
    const params: Record<string, string | number> = {
      page,
      limit: PAGE_SIZE,
    };
    const q = search.trim();
    if (q) params.search = q;
    if (typeForListQuery) params.type = typeForListQuery;
    const rid = filterResellerId.trim();
    if (rid) {
      params.resellerId = rid;
      const pid = filterParentCompanyId.trim();
      if (pid) params.parentCompanyId = pid;
    }
    return params;
  }, [page, search, typeForListQuery, filterResellerId, filterParentCompanyId]);

  const query = useDepartmentsListQuery(listParams, { scope: 'departments-page' });
  const deleteMutation = useSoftDeleteDepartmentMutation();

  const rows = useMemo(() => parseRows(query.data), [query.data]);
  const total = pickApiTotal(query.data, rows.length);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(filterResellerId.trim()) ||
    Boolean(filterParentCompanyId.trim()) ||
    (mayPickInternalTypeFilter && Boolean(filterType));

  useEffect(() => {
    if (searchInput.trim().length > 0) return;
    if (!search.trim()) return;
    setSearch('');
    setPage(1);
  }, [searchInput, search]);

  useEffect(() => {
    setPage(1);
  }, [search, typeForListQuery, filterResellerId, filterParentCompanyId]);

  const openCreate = () => {
    setEditRow(null);
    setModalOpen(true);
  };

  const clearFilters = () => {
    setFilterType('');
    setFilterResellerId('');
    setFilterParentCompanyId('');
    setPage(1);
  };

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isLoading}
            onRefresh={() => {
              void resellersQuery.refetch();
              void query.refetch();
            }}
            tintColor={accent}
          />
        } showsVerticalScrollIndicator={false}>
        <DashboardPageIntro subtitle="Organize teams by department type.">
          {canCreate ? (
            <Pressable
              onPress={openCreate}
              accessibilityRole="button"
              accessibilityLabel="Add Department"
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
                  Add Department
                </Typography>
                <Typography variant="small" muted numberOfLines={2}>
                  Create Internal or External departments
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
            placeholder="Search department, reseller, or company…"
            filtersOpen={filtersOpen}
            onFilterPress={() => setFiltersOpen((v) => !v)}
            hasActiveFilters={hasActiveFilters}
          >
            {filtersOpen ? (
              <View style={{ gap: 12 }}>
                {mayPickInternalTypeFilter ? (
                  <SelectField
                    label="Type"
                    value={filterType}
                    onChange={(v) =>
                      setFilterType(
                        v === 'Internal' || v === 'External' ? v : '',
                      )
                    }
                    options={TYPE_FILTER_OPTIONS}
                    placeholder="All types"
 />
                ) : null}
                <SelectField
                  label="Reseller"
                  value={filterResellerId}
                  onChange={(v) => {
                    setFilterResellerId(v);
                    setFilterParentCompanyId('');
                  }}
                  options={resellerFilterOptions}
                  placeholder="All resellers"
 />
                <SelectField
                  label="Parent company"
                  value={filterParentCompanyId}
                  onChange={setFilterParentCompanyId}
                  options={parentCompanyFilterOptions}
                  placeholder="All parent companies"
                  disabled={!filterResellerId.trim()}
 />
                {hasActiveFilters ? (
                  <Button size="compact" variant="outlined" onPress={clearFilters}>
                    Clear filters
                  </Button>
                ) : null}
              </View>
            ) : null}
          </FiltersSearchBar>
        </DashboardPageIntro>

        {query.isError ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(query.error, 'Could not load departments.')}
            </Typography>
            <Button size="compact" variant="outlined" onPress={() => void query.refetch()}>
              Retry
            </Button>
          </AppCard>
        ) : (
          <ListTableCard
            title="Departments"
            subtitle={`${total} total`}
            icon="business-outline"
            toolbar={null}
          >
            <DataCardGrid
              columns={1}
              isLoading={query.isLoading && !query.data}
              empty={!query.isLoading && rows.length === 0}
              emptyState={{
                title: 'No departments',
                description: 'Create a department to organize your teams.',
                icon: 'business-outline',
                action: canCreate ? (
                  <Button size="compact" onPress={openCreate}>
                    Add Department
                  </Button>
                ) : undefined,
              }}
              showingLabel={
                rows.length > 0
                  ? `Showing data ${from} to ${to} of ${total} entries`
                  : undefined
              }
              footerRight={
                <TablePagination page={page} pageCount={pageCount} onPageChange={setPage} />
              }
            >
              {rows.map((row) => (
                <EntityListCard
                  key={row.id}
                  title={row.name}
                  details={[
                    {
                      label: 'Type',
                      value: row.type,
                    },
                  ]}
                  onEditPress={canUpdate ? () => {
                    setEditRow(row);
                    setModalOpen(true);
                  } : undefined}
                  onDeletePress={canDelete ? () => setDeleteId(row.id) : undefined}
 />
              ))}
            </DataCardGrid>
          </ListTableCard>
        )}
      </ScrollView>

      <AddDepartmentModal
        open={modalOpen}
        editDepartment={editRow}
        onClose={() => setModalOpen(false)}
        onSaved={() => void query.refetch()}
 />

      <ConfirmActionModal
        open={Boolean(deleteId)}
        title="Delete department?"
        description="This soft-deletes the department. You can restore it from the API if needed."
        confirmLabel="Delete"
        confirmButtonVariant="danger"
        isLoading={deleteMutation.isPending}
        onDismiss={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deleteMutation.mutateAsync(deleteId);
            setDeleteId(null);
          } catch (err) {
            Alert.alert('Delete failed', extractApiErrorMessage(err));
          }
        }}
 />
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12, paddingHorizontal: 8 },
  scroll: { paddingBottom: 32 },
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
});
