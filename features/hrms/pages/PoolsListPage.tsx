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
  FormModal,
  InputField,
  ListTableCard,
  SearchBar,
  SelectField,
  TablePagination,
  Typography,
} from '@/components/ui';
import { AddPoolModal } from '@/features/hrms/components/AddPoolModal';
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
import { useDepartmentsListQuery } from '@/lib/hooks/query/hrms/departments';
import {
  useDeletePoolMutation,
  usePoolsListQuery,
  useUpdatePoolMutation,
} from '@/lib/hooks/query/hrms/pools';
import { canPoolAction } from '@/lib/permissions';
import { glassUi } from '@/lib/theme/glass-ui';
import { pickApiItems, pickApiTotal } from '@/lib/utils/admin-list';
import { isRecord, pickStr } from '@/lib/utils/core';
import { useAppTheme } from '@/theme';

/** Web parity: GET /hrms/pools?page=1&limit=8&departmentType=Internal */
const PAGE_SIZE = 8;

/** Matches backend `INTERNAL_POOL_CATALOG_DEPARTMENT_NAME`. */
const INTERNAL_POOL_CATALOG_DEPARTMENT_NAME = 'Internal Pools';

type PoolRow = {
  id: string;
  poolName: string;
  departmentName: string;
  departmentId: string;
};

function formatPoolDepartmentLabel(
  departmentName: string | null | undefined,
  departmentType?: string | null,
): string {
  const name = departmentName?.trim() || '';
  if (!name) return '—';
  if (
    departmentType === 'Internal' &&
    name === INTERNAL_POOL_CATALOG_DEPARTMENT_NAME
  ) {
    return '—';
  }
  return name;
}

function parseRows(data: unknown): PoolRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r) => {
      const id = pickStr(r, ['id']);
      if (!id) return null;
      const dept = isRecord(r.department) ? r.department : null;
      const departmentName = pickStr(dept, ['name']) || '—';
      const departmentType = pickStr(dept, ['type']) || '';
      return {
        id,
        poolName: pickStr(r, ['name', 'poolName']) || '—',
        departmentName: formatPoolDepartmentLabel(departmentName, departmentType),
        departmentId:
          pickStr(dept, ['id']) ||
          pickStr(r, ['departmentId', 'department_id']) ||
          '',
      };
    })
    .filter((x): x is PoolRow => x !== null);
}

export function PoolsListPage() {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const { hasOperational, isPlatformAdmin, user } = useAuth();
  const mayPickInternal = useMemo(
    () =>
      sessionMayPickInternalUserScope(
        isPlatformAdmin,
        user as SessionScopeUser | null,
      ),
    [isPlatformAdmin, user],
  );
  const canCreate = canPoolAction(hasOperational, 'create');
  const canUpdate = canPoolAction(hasOperational, 'update');
  const canDelete = canPoolAction(hasOperational, 'delete');

  const [filterDeptKind, setFilterDeptKind] = useState<'Internal' | 'External'>(
    'Internal',
  );
  const effectiveFilterDeptKind: 'Internal' | 'External' = mayPickInternal
    ? filterDeptKind
    : 'External';

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [resellerId, setResellerId] = useState('');
  const [parentCompanyId, setParentCompanyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<PoolRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  /** Internal filter: GET /hrms/departments?type=Internal&all=true */
  const deptsQuery = useDepartmentsListQuery(
    { type: 'Internal', all: true },
    {
      enabled: effectiveFilterDeptKind === 'Internal',
      scope: 'pools-filter-internal-depts',
    },
  );

  /** External filter cascade — resellers → parent → departments */
  const resellersQuery = useCompaniesSetupResellersQuery({
    enabled: effectiveFilterDeptKind === 'External',
  });
  const parentCompaniesQuery = useCompaniesByResellerQuery(
    resellerId.trim(),
    { view: 'tree', sortBy: 'name', sortOrder: 'asc', all: true },
    {
      enabled:
        effectiveFilterDeptKind === 'External' && Boolean(resellerId.trim()),
    },
  );
  const externalDeptsQuery = useDepartmentsListQuery(
    resellerId.trim() && parentCompanyId.trim()
      ? {
          all: true,
          type: 'External',
          resellerId: resellerId.trim(),
          parentCompanyId: parentCompanyId.trim(),
        }
      : undefined,
    {
      enabled:
        effectiveFilterDeptKind === 'External' &&
        Boolean(resellerId.trim()) &&
        Boolean(parentCompanyId.trim()),
      scope: 'pools-filter-external-depts',
    },
  );

  const listParams = useMemo(() => {
    const params: Record<string, string | number> = {
      page,
      limit: PAGE_SIZE,
    };
    if (search.trim()) params.search = search.trim();
    if (effectiveFilterDeptKind === 'Internal') {
      params.departmentType = 'Internal';
      return params;
    }
    if (resellerId.trim()) params.resellerId = resellerId.trim();
    if (parentCompanyId.trim()) params.parentCompanyId = parentCompanyId.trim();
    if (departmentId.trim()) params.departmentId = departmentId.trim();
    return params;
  }, [
    page,
    search,
    effectiveFilterDeptKind,
    resellerId,
    parentCompanyId,
    departmentId,
  ]);

  const query = usePoolsListQuery(listParams, { scope: 'pools-page' });
  const updateMutation = useUpdatePoolMutation();
  const deleteMutation = useDeletePoolMutation();

  const rows = useMemo(() => parseRows(query.data), [query.data]);
  const total = pickApiTotal(query.data, rows.length);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const saving = updateMutation.isPending;

  const deptTypeOptions = useMemo(
    () =>
      mayPickInternal
        ? [
            { value: 'Internal', label: 'Internal' },
            { value: 'External', label: 'External' },
          ]
        : [{ value: 'External', label: 'External' }],
    [mayPickInternal],
  );

  const resellerOptions = useMemo(() => {
    const base = pickItemsArray(resellersQuery.data)
      .map(toIdNameOption)
      .filter((o): o is { value: string; label: string } => o !== null);
    return [
      {
        value: '',
        label: resellersQuery.isLoading
          ? 'Loading resellers…'
          : '— Select reseller —',
      },
      ...base,
    ];
  }, [resellersQuery.data, resellersQuery.isLoading]);

  const parentCompanyOptions = useMemo(() => {
    const base = extractParentCompaniesFromByResellerTree(parentCompaniesQuery.data);
    return [
      {
        value: '',
        label: !resellerId.trim()
          ? 'Select reseller first'
          : parentCompaniesQuery.isLoading
            ? 'Loading parent companies…'
            : '— Select parent company —',
      },
      ...base,
    ];
  }, [parentCompaniesQuery.data, parentCompaniesQuery.isLoading, resellerId]);

  const departmentOptions = useMemo(() => {
    const base = pickItemsArray(externalDeptsQuery.data)
      .map(toIdNameOption)
      .filter((o): o is { value: string; label: string } => o !== null);
    const prompt =
      !parentCompanyId.trim()
        ? 'Select parent company first'
        : externalDeptsQuery.isLoading
          ? 'Loading departments…'
          : '— Select department —';
    return [{ value: '', label: prompt }, ...base];
  }, [externalDeptsQuery.data, externalDeptsQuery.isLoading, parentCompanyId]);

  const hasActiveFilters =
    effectiveFilterDeptKind !== 'Internal' ||
    Boolean(search.trim()) ||
    Boolean(resellerId.trim()) ||
    Boolean(parentCompanyId.trim()) ||
    Boolean(departmentId.trim());

  useEffect(() => {
    if (searchInput.trim().length > 0) return;
    if (!search.trim()) return;
    setSearch('');
    setPage(1);
  }, [searchInput, search]);

  useEffect(() => {
    setPage(1);
  }, [search, effectiveFilterDeptKind, resellerId, parentCompanyId, departmentId]);

  useEffect(() => {
    if (mayPickInternal) return;
    setFilterDeptKind('External');
  }, [mayPickInternal]);

  useEffect(() => {
    setResellerId('');
    setParentCompanyId('');
    setDepartmentId('');
  }, [filterDeptKind]);

  useEffect(() => {
    setParentCompanyId('');
    setDepartmentId('');
  }, [resellerId]);

  useEffect(() => {
    setDepartmentId('');
  }, [parentCompanyId]);

  const openCreate = () => {
    setAddOpen(true);
  };

  const openEdit = (row: PoolRow) => {
    setEditRow(row);
    setEditName(row.poolName === '—' ? '' : row.poolName);
  };

  const clearFilters = () => {
    setFilterDeptKind(mayPickInternal ? 'Internal' : 'External');
    setResellerId('');
    setParentCompanyId('');
    setDepartmentId('');
    setSearch('');
    setSearchInput('');
    setPage(1);
  };

  const saveEdit = async () => {
    if (!editRow) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'Pool name is required.');
      return;
    }
    try {
      await updateMutation.mutateAsync({ id: editRow.id, body: { name: trimmed } });
      setEditRow(null);
      void query.refetch();
    } catch (err) {
      Alert.alert('Save failed', extractApiErrorMessage(err));
    }
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
              void deptsQuery.refetch();
              void query.refetch();
            }}
            tintColor={accent}
          />
        } showsVerticalScrollIndicator={false}>
        <DashboardPageIntro subtitle="Create and manage pools by department.">
          {canCreate ? (
            <Pressable
              onPress={openCreate}
              accessibilityRole="button"
              accessibilityLabel="Add pool"
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
                  Add pool
                </Typography>
                <Typography variant="small" muted numberOfLines={2}>
                  Create a pool for a department
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

          <View
            style={[
              styles.filtersCard,
              {
                borderColor: theme.app.dashboard.cardBorder,
                backgroundColor: theme.app.dashboard.overlayLight,
              },
            ]}
          >
            <View style={styles.filtersHeader}>
              <View style={styles.filtersTitleRow}>
                <View style={[styles.filtersIcon, { backgroundColor: `${accent}28` }]}>
                  <Ionicons name="options-outline" size={16} color={accent} />
                </View>
                <Typography variant="medium" style={{ fontWeight: '700' }}>
                  Filters
                </Typography>
              </View>
              {hasActiveFilters ? (
                <Button size="compact" variant="outlined" onPress={clearFilters}>
                  Clear filters
                </Button>
              ) : null}
            </View>
            <SelectField
              label="Department type"
              value={effectiveFilterDeptKind}
              onChange={(v) =>
                setFilterDeptKind(v === 'External' ? 'External' : 'Internal')
              }
              options={deptTypeOptions}
              disabled={deptTypeOptions.length === 1}
 />
            {effectiveFilterDeptKind === 'External' ? (
              <>
                <SelectField
                  label="Reseller"
                  value={resellerId}
                  onChange={setResellerId}
                  options={resellerOptions}
 />
                <SelectField
                  label="Parent company"
                  value={parentCompanyId}
                  onChange={setParentCompanyId}
                  options={parentCompanyOptions}
                  disabled={!resellerId.trim()}
 />
                <SelectField
                  label="Department"
                  value={departmentId}
                  onChange={setDepartmentId}
                  options={departmentOptions}
                  disabled={!resellerId.trim() || !parentCompanyId.trim()}
 />
              </>
            ) : null}
          </View>
        </DashboardPageIntro>

        {query.isError ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(query.error, 'Could not load pools.')}
            </Typography>
            <Button size="compact" variant="outlined" onPress={() => void query.refetch()}>
              Retry
            </Button>
          </AppCard>
        ) : (
          <ListTableCard
            title="Pools"
            subtitle={`${total} total`}
            icon="people-outline"
            toolbar={
              <View style={styles.searchRow}>
                <View style={{ flex: 1 }}>
                  <SearchBar
                    value={searchInput}
                    onChange={setSearchInput}
                    onSubmit={() => {
                      setSearch(searchInput.trim());
                      setPage(1);
                    }}
                    placeholder="Search anything…"
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
            }
          >
            <DataCardGrid
              columns={1}
              isLoading={query.isLoading && !query.data}
              empty={!query.isLoading && rows.length === 0}
              emptyState={{
                title: 'No pools',
                description: 'Create a pool to assign agents.',
                icon: 'people-outline',
                action: canCreate ? (
                  <Button size="compact" onPress={openCreate}>
                    Add pool
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
                  title={row.poolName}
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

      <AddPoolModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => void query.refetch()}
 />

      <FormModal
        open={Boolean(editRow)}
        title="Edit pool"
        description="Update pool name."
        onClose={() => setEditRow(null)}
        onSave={() => void saveEdit()}
        primaryButtonLabel={saving ? 'Saving…' : 'Save changes'}
        primaryButtonDisabled={saving}
        cancelButtonLabel="Close"
      >
        <InputField
          label="Pool name"
          value={editName}
          onChangeText={setEditName}
          placeholder="e.g. Team Alpha"
 />
      </FormModal>

      <ConfirmActionModal
        open={Boolean(deleteId)}
        title="Delete pool?"
        description="This removes the pool from the directory."
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
  filtersCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  filtersTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filtersIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
});
