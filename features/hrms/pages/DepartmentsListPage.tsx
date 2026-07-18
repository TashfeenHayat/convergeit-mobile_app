import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { MobileScreen } from '@/components/layout';
import {
  AppCard,
  Button,
  ConfirmActionModal,
  DataTable,
  ListTableCard,
  SearchBar,
  StatusChip,
  TablePagination,
  Typography,
  type DataTableColumn,
} from '@/components/ui';
import { AddDepartmentModal, type DepartmentRow } from '@/features/hrms/components/AddDepartmentModal';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { canDepartmentAction } from '@/lib/permissions';
import { useAuth } from '@/lib/auth';
import { useDepartmentsListQuery, useSoftDeleteDepartmentMutation } from '@/lib/hooks/query/hrms/departments';
import { isRecord, pickStr } from '@/lib/utils/core';
import { pickApiItems, pickApiTotal } from '@/lib/utils/admin-list';
import { useAppTheme } from '@/theme';

const PAGE_SIZE = 15;

function parseRows(data: unknown): DepartmentRow[] {
  const rows: DepartmentRow[] = [];
  for (const r of pickApiItems(data).filter(isRecord)) {
    const id = pickStr(r, ['id']);
    if (!id) continue;
    const typeRaw = pickStr(r, ['type']) || 'Internal';
    const type: DepartmentRow['type'] = typeRaw === 'External' ? 'External' : 'Internal';
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
  const { hasOperational } = useAuth();
  const canCreate = canDepartmentAction(hasOperational, 'create');
  const canUpdate = canDepartmentAction(hasOperational, 'update');
  const canDelete = canDepartmentAction(hasOperational, 'delete');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<DepartmentRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const query = useDepartmentsListQuery({
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
  });
  const deleteMutation = useSoftDeleteDepartmentMutation();

  const rows = useMemo(() => parseRows(query.data), [query.data]);
  const total = pickApiTotal(query.data, rows.length);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const openCreate = () => {
    setEditRow(null);
    setModalOpen(true);
  };

  const openEdit = (row: DepartmentRow) => {
    setEditRow(row);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    } catch (err) {
      Alert.alert('Delete failed', extractApiErrorMessage(err));
    }
  };

  const columns: DataTableColumn<DepartmentRow>[] = useMemo(
    () => [
      { id: 'name', label: 'Name', minWidth: 160 },
      {
        id: 'type',
        label: 'Type',
        minWidth: 110,
        render: (value) => (
          <StatusChip
            label={String(value)}
            tone={value === 'External' ? 'info' : 'neutral'}
          />
        ),
      },
    ],
    [],
  );

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: theme.spacing.screen }]}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isLoading}
            onRefresh={() => void query.refetch()}
            tintColor={theme.app.dashboard.accentBlue}
          />
        }
      >
        <View style={{ gap: theme.spacing.md }}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1, gap: 4 }}>
              <Typography variant="boldLarge">Departments</Typography>
              <Typography variant="medium" muted>
                Organize teams by department type.
              </Typography>
            </View>
            {canCreate ? (
              <Button size="compact" onPress={openCreate}>
                Add
              </Button>
            ) : null}
          </View>

          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search departments…"
          />

          {query.isError ? (
            <AppCard>
              <Typography variant="medium" color={theme.app.danger}>
                {extractApiErrorMessage(query.error, 'Could not load departments.')}
              </Typography>
            </AppCard>
          ) : (
            <ListTableCard
              title="Department list"
              subtitle={`${total} total`}
              icon="business-outline"
              footer={
                <>
                  <Typography variant="small" muted>
                    Page {page} · {total} records
                  </Typography>
                  <TablePagination page={page} pageCount={pageCount} onPageChange={setPage} />
                </>
              }
            >
              {query.isLoading && !query.data ? (
                <View style={styles.centered}>
                  <ActivityIndicator color={theme.app.dashboard.accentBlue} />
                </View>
              ) : (
                <DataTable
                  columns={columns}
                  rows={rows}
                  getRowId={(r) => r.id}
                  minWidth={420}
                  emptyState={{
                    title: 'No departments',
                    description: 'Create a department to organize your teams.',
                    icon: 'business-outline',
                  }}
                  actionColumn={
                    canUpdate || canDelete
                      ? {
                          label: 'Actions',
                          width: 150,
                          render: (row) => (
                            <View style={styles.actions}>
                              {canUpdate ? (
                                <Button size="compact" variant="outlined" onPress={() => openEdit(row)}>
                                  Edit
                                </Button>
                              ) : null}
                              {canDelete ? (
                                <Button
                                  size="compact"
                                  variant="ghost"
                                  onPress={() => setDeleteId(row.id)}
                                >
                                  Delete
                                </Button>
                              ) : null}
                            </View>
                          ),
                        }
                      : undefined
                  }
                />
              )}
            </ListTableCard>
          )}
        </View>
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
        onConfirm={() => void confirmDelete()}
      />
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
  scroll: { paddingBottom: 32 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  centered: { minHeight: 120, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 6, justifyContent: 'flex-end' },
});
