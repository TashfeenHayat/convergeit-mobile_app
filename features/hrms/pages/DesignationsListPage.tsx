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
import { AddDesignationModal } from '@/features/hrms/components/AddDesignationModal';
import { extractApiErrorMessage } from '@/lib/api/errors';
import {
  sessionMayPickInternalUserScope,
  useAuth,
  type SessionScopeUser,
} from '@/lib/auth';
import {
  pickItemsArray,
  toIdNameOption,
} from '@/lib/companies/scope-tree-options';
import { useCompaniesSetupResellersQuery } from '@/lib/hooks/query/companies';
import { useDepartmentsListQuery } from '@/lib/hooks/query/hrms/departments';
import {
  useDesignationsListQuery,
  useSoftDeleteDesignationMutation,
} from '@/lib/hooks/query/hrms/designations';
import { canDesignationAction } from '@/lib/permissions';
import { glassUi } from '@/lib/theme/glass-ui';
import { pickApiItems, pickApiTotal } from '@/lib/utils/admin-list';
import { isRecord, pickStr } from '@/lib/utils/core';
import { useAppTheme } from '@/theme';

/** Web parity: GET /hrms/designations?page=1&limit=20 */
const PAGE_SIZE = 20;

const TYPE_FILTER_OPTIONS = [
  { label: 'All types', value: '' },
  { label: 'Internal', value: 'Internal' },
  { label: 'External', value: 'External' },
];

type DesignationRow = {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
};

function parseRows(data: unknown): DesignationRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r) => {
      const id = pickStr(r, ['id']);
      if (!id) return null;
      const dept = isRecord(r.department) ? r.department : null;
      return {
        id,
        name: pickStr(r, ['name']) || '—',
        departmentId: pickStr(r, ['departmentId']) || pickStr(dept, ['id']),
        departmentName:
          pickStr(r, ['departmentName']) || pickStr(dept, ['name']) || '—',
      };
    })
    .filter((x): x is DesignationRow => x !== null);
}

export function DesignationsListPage() {
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
  const canCreate = canDesignationAction(hasOperational, 'create');
  const canUpdate = canDesignationAction(hasOperational, 'update');
  const canDelete = canDesignationAction(hasOperational, 'delete');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'' | 'Internal' | 'External'>('');
  const [filterResellerId, setFilterResellerId] = useState('');
  const [filterDepartmentId, setFilterDepartmentId] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<DesignationRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  /** Web parity: GET /companies/setup/resellers */
  const resellersQuery = useCompaniesSetupResellersQuery({ enabled: true });
  /** Web parity: GET /hrms/departments?all=true */
  const deptsQuery = useDepartmentsListQuery(
    { all: true },
    { scope: 'designations-page' },
  );

  const listParams = useMemo(() => {
    const params: Record<string, string | number> = {
      page,
      limit: PAGE_SIZE,
    };
    const q = search.trim();
    if (q) params.search = q;
    if (filterResellerId.trim()) params.resellerId = filterResellerId.trim();
    if (filterDepartmentId.trim()) params.departmentId = filterDepartmentId.trim();
    return params;
  }, [page, search, filterResellerId, filterDepartmentId]);

  const query = useDesignationsListQuery(listParams, { scope: 'designations-page' });
  const deleteMutation = useSoftDeleteDesignationMutation();

  const rows = useMemo(() => parseRows(query.data), [query.data]);
  const total = pickApiTotal(query.data, rows.length);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const departmentRecords = useMemo(
    () => pickApiItems(deptsQuery.data).filter(isRecord),
    [deptsQuery.data],
  );

  const departmentFilterOptions = useMemo(() => {
    const typeScope = mayPickInternalTypeFilter ? filterType : 'External';
    const filtered = departmentRecords.filter((r) => {
      if (!typeScope) return true;
      const t = pickStr(r, ['type']) || 'Internal';
      return t === typeScope;
    });
    const options = filtered
      .map((r) => toIdNameOption(r))
      .filter((o): o is { value: string; label: string } => o !== null);
    const all = { value: '', label: 'All departments' };
    if (options.length > 0) return [all, ...options];
    return [
      {
        value: '',
        label: deptsQuery.isLoading ? 'Loading departments…' : 'No departments available',
      },
    ];
  }, [
    departmentRecords,
    mayPickInternalTypeFilter,
    filterType,
    deptsQuery.isLoading,
  ]);

  const resellerFilterOptions = useMemo(() => {
    const options = pickItemsArray(resellersQuery.data)
      .map((row) => toIdNameOption(row))
      .filter((o): o is { value: string; label: string } => o !== null);
    const all = { value: '', label: 'All resellers' };
    if (options.length > 0) return [all, ...options];
    return [
      {
        value: '',
        label: resellersQuery.isLoading
          ? 'Loading resellers…'
          : 'No resellers available',
      },
    ];
  }, [resellersQuery.data, resellersQuery.isLoading]);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(filterResellerId.trim()) ||
    Boolean(filterDepartmentId.trim()) ||
    (mayPickInternalTypeFilter && Boolean(filterType));

  useEffect(() => {
    if (searchInput.trim().length > 0) return;
    if (!search.trim()) return;
    setSearch('');
    setPage(1);
  }, [searchInput, search]);

  useEffect(() => {
    setPage(1);
  }, [search, filterResellerId, filterDepartmentId, filterType]);

  const openCreate = () => {
    setEditRow(null);
    setModalOpen(true);
  };

  const openEdit = (row: DesignationRow) => {
    setEditRow(row);
    setModalOpen(true);
  };

  const clearFilters = () => {
    setFilterType('');
    setFilterResellerId('');
    setFilterDepartmentId('');
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
              void deptsQuery.refetch();
              void query.refetch();
            }}
            tintColor={accent}
          />
        } showsVerticalScrollIndicator={false}>
        <DashboardPageIntro subtitle="Job titles within departments.">
          {canCreate ? (
            <Pressable
              onPress={openCreate}
              accessibilityRole="button"
              accessibilityLabel="Add New Designation"
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
                  Add New Designation
                </Typography>
                <Typography variant="small" muted numberOfLines={2}>
                  Create a designation linked to a department
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
            placeholder="Search designation, department…"
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
                    onChange={(v) => {
                      setFilterType(
                        v === 'Internal' || v === 'External' ? v : '',
                      );
                      setFilterDepartmentId('');
                    }}
                    options={TYPE_FILTER_OPTIONS}
                    placeholder="All types"
 />
                ) : null}
                <SelectField
                  label="Reseller"
                  value={filterResellerId}
                  onChange={(v) => {
                    setFilterResellerId(v);
                    setFilterDepartmentId('');
                  }}
                  options={resellerFilterOptions}
                  placeholder="All resellers"
 />
                <SelectField
                  label="Department"
                  value={filterDepartmentId}
                  onChange={setFilterDepartmentId}
                  options={departmentFilterOptions}
                  placeholder="All departments"
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
              {extractApiErrorMessage(query.error, 'Could not load designations.')}
            </Typography>
            <Button size="compact" variant="outlined" onPress={() => void query.refetch()}>
              Retry
            </Button>
          </AppCard>
        ) : (
          <ListTableCard
            title="Designations"
            subtitle={`${total} total`}
            icon="ribbon-outline"
            toolbar={null}
          >
            <DataCardGrid
              columns={1}
              isLoading={query.isLoading && !query.data}
              empty={!query.isLoading && rows.length === 0}
              emptyState={{
                title: 'No designations',
                description: 'Create a designation linked to a department.',
                icon: 'ribbon-outline',
                action: canCreate ? (
                  <Button size="compact" onPress={openCreate}>
                    Add New Designation
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
                      label: 'Department',
                      value: row.departmentName,
                    },
                  ]}
                  onEditPress={canUpdate ? () => openEdit(row) : undefined}
                  onDeletePress={canDelete ? () => setDeleteId(row.id) : undefined}
 />
              ))}
            </DataCardGrid>
          </ListTableCard>
        )}
      </ScrollView>

      <AddDesignationModal
        open={modalOpen}
        editDesignation={
          editRow
            ? {
                id: editRow.id,
                name: editRow.name,
                departmentId: editRow.departmentId,
              }
            : null
        }
        onClose={() => setModalOpen(false)}
        onSaved={() => void query.refetch()}
 />

      <ConfirmActionModal
        open={Boolean(deleteId)}
        title="Delete designation?"
        description="This soft-deletes the designation."
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
