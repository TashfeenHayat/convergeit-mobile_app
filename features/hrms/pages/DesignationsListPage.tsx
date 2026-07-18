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
  FormModal,
  InputField,
  ListTableCard,
  SearchBar,
  SelectField,
  TablePagination,
  Typography,
  type DataTableColumn,
} from '@/components/ui';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import { canDesignationAction } from '@/lib/permissions';
import { useDepartmentsListQuery } from '@/lib/hooks/query/hrms/departments';
import {
  useCreateDesignationMutation,
  useDesignationsListQuery,
  useSoftDeleteDesignationMutation,
  useUpdateDesignationMutation,
} from '@/lib/hooks/query/hrms/designations';
import { isRecord, pickStr } from '@/lib/utils/core';
import { pickApiItems, pickApiTotal } from '@/lib/utils/admin-list';
import { useAppTheme } from '@/theme';

const PAGE_SIZE = 15;

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
        departmentName: pickStr(r, ['departmentName']) || pickStr(dept, ['name']) || '—',
      };
    })
    .filter((x): x is DesignationRow => x !== null);
}

export function DesignationsListPage() {
  const theme = useAppTheme();
  const { hasOperational } = useAuth();
  const canCreate = canDesignationAction(hasOperational, 'create');
  const canUpdate = canDesignationAction(hasOperational, 'update');
  const canDelete = canDesignationAction(hasOperational, 'delete');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<DesignationRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const query = useDesignationsListQuery({
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
  });
  const deptsQuery = useDepartmentsListQuery({ all: true }, { scope: 'designation-form' });
  const createMutation = useCreateDesignationMutation();
  const updateMutation = useUpdateDesignationMutation();
  const deleteMutation = useSoftDeleteDesignationMutation();

  const rows = useMemo(() => parseRows(query.data), [query.data]);
  const total = pickApiTotal(query.data, rows.length);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const deptOptions = useMemo(() => {
    return pickApiItems(deptsQuery.data)
      .filter(isRecord)
      .map((r) => {
        const id = pickStr(r, ['id']);
        if (!id) return null;
        return { label: pickStr(r, ['name']) || id, value: id };
      })
      .filter((x): x is { label: string; value: string } => x !== null);
  }, [deptsQuery.data]);

  const openCreate = () => {
    setEditRow(null);
    setName('');
    setDepartmentId(deptOptions[0]?.value ?? '');
    setModalOpen(true);
  };

  const openEdit = (row: DesignationRow) => {
    setEditRow(row);
    setName(row.name === '—' ? '' : row.name);
    setDepartmentId(row.departmentId);
    setModalOpen(true);
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed || !departmentId) {
      Alert.alert('Validation', 'Name and department are required.');
      return;
    }
    try {
      if (editRow) {
        await updateMutation.mutateAsync({
          id: editRow.id,
          body: { name: trimmed, departmentId },
        });
      } else {
        await createMutation.mutateAsync({ name: trimmed, departmentId });
      }
      setModalOpen(false);
    } catch (err) {
      Alert.alert('Save failed', extractApiErrorMessage(err));
    }
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

  const columns: DataTableColumn<DesignationRow>[] = useMemo(
    () => [
      { id: 'name', label: 'Designation', minWidth: 150 },
      { id: 'departmentName', label: 'Department', minWidth: 140, cellVariant: 'muted' },
    ],
    [],
  );

  const saving = createMutation.isPending || updateMutation.isPending;

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
              <Typography variant="boldLarge">Designations</Typography>
              <Typography variant="medium" muted>
                Job titles within departments.
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
            placeholder="Search designations…"
          />

          {query.isError ? (
            <AppCard>
              <Typography variant="medium" color={theme.app.danger}>
                {extractApiErrorMessage(query.error, 'Could not load designations.')}
              </Typography>
            </AppCard>
          ) : (
            <ListTableCard
              title="Designation list"
              subtitle={`${total} total`}
              icon="ribbon-outline"
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
                  minWidth={400}
                  emptyState={{
                    title: 'No designations',
                    description: 'Create a designation linked to a department.',
                    icon: 'ribbon-outline',
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
                                <Button size="compact" variant="ghost" onPress={() => setDeleteId(row.id)}>
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

      <FormModal
        open={modalOpen}
        title={editRow ? 'Edit designation' : 'Add designation'}
        onClose={() => setModalOpen(false)}
        onSave={() => void save()}
        primaryButtonLabel={editRow ? 'Update' : 'Create'}
        primaryButtonDisabled={saving}
      >
        <View style={{ gap: 12 }}>
          <InputField label="Name" value={name} onChangeText={setName} placeholder="e.g. Agent" />
          <SelectField
            label="Department"
            value={departmentId}
            onChange={setDepartmentId}
            options={deptOptions}
            placeholder="Select department"
          />
        </View>
      </FormModal>

      <ConfirmActionModal
        open={Boolean(deleteId)}
        title="Delete designation?"
        description="This soft-deletes the designation."
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
