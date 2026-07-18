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
  TablePagination,
  Typography,
  type DataTableColumn,
} from '@/components/ui';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import { canLeaveTypeManage, canLeaveTypeView } from '@/lib/permissions';
import {
  useCreateLeaveTypeMutation,
  useDeleteLeaveTypeMutation,
  useLeaveTypesListQuery,
  useUpdateLeaveTypeMutation,
} from '@/lib/hooks/query/hrms/leave-types';
import { isRecord, pickStr } from '@/lib/utils/core';
import { pickApiItems, pickApiTotal } from '@/lib/utils/admin-list';
import { useAppTheme } from '@/theme';

const PAGE_SIZE = 15;

type LeaveTypeRow = {
  id: string;
  name: string;
  description: string;
  maxDaysPerYear: string;
};

function parseRows(data: unknown): LeaveTypeRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r) => {
      const id = pickStr(r, ['id']);
      if (!id) return null;
      return {
        id,
        name: pickStr(r, ['name']) || '—',
        description: pickStr(r, ['description']) || '—',
        maxDaysPerYear:
          r.maxDaysPerYear != null || r.max_days_per_year != null
            ? String(r.maxDaysPerYear ?? r.max_days_per_year)
            : '—',
      };
    })
    .filter((x): x is LeaveTypeRow => x !== null);
}

export function LeaveTypesListPage() {
  const theme = useAppTheme();
  const { hasOperational } = useAuth();
  const canManage = canLeaveTypeManage(hasOperational);
  const canView = canLeaveTypeView(hasOperational) || canManage;

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<LeaveTypeRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxDays, setMaxDays] = useState('');

  const query = useLeaveTypesListQuery(
    { page, limit: PAGE_SIZE, search: search.trim() || undefined },
    { enabled: canView },
  );
  const createMutation = useCreateLeaveTypeMutation();
  const updateMutation = useUpdateLeaveTypeMutation();
  const deleteMutation = useDeleteLeaveTypeMutation();

  const rows = useMemo(() => parseRows(query.data), [query.data]);
  const total = pickApiTotal(query.data, rows.length);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const saving = createMutation.isPending || updateMutation.isPending;

  if (!canView) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="boldLarge">Leave types</Typography>
          <Typography variant="medium" muted>
            You do not have permission to view leave types.
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  const openCreate = () => {
    setEditRow(null);
    setName('');
    setDescription('');
    setMaxDays('');
    setModalOpen(true);
  };

  const openEdit = (row: LeaveTypeRow) => {
    setEditRow(row);
    setName(row.name === '—' ? '' : row.name);
    setDescription(row.description === '—' ? '' : row.description);
    setMaxDays(row.maxDaysPerYear === '—' ? '' : row.maxDaysPerYear);
    setModalOpen(true);
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'Name is required.');
      return;
    }
    const body = {
      name: trimmed,
      description: description.trim() || undefined,
      maxDaysPerYear: maxDays.trim() ? Number(maxDays) : undefined,
    };
    try {
      if (editRow) {
        await updateMutation.mutateAsync({ id: editRow.id, body });
      } else {
        await createMutation.mutateAsync(body);
      }
      setModalOpen(false);
    } catch (err) {
      Alert.alert('Save failed', extractApiErrorMessage(err));
    }
  };

  const columns: DataTableColumn<LeaveTypeRow>[] = useMemo(
    () => [
      { id: 'name', label: 'Type', minWidth: 140 },
      { id: 'description', label: 'Description', minWidth: 160, cellVariant: 'muted' },
      { id: 'maxDaysPerYear', label: 'Max/yr', minWidth: 80 },
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
              <Typography variant="boldLarge">Leave types</Typography>
              <Typography variant="medium" muted>
                Configure leave categories and yearly caps.
              </Typography>
            </View>
            {canManage ? (
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
            placeholder="Search leave types…"
          />
          {query.isError ? (
            <AppCard>
              <Typography variant="medium" color={theme.app.danger}>
                {extractApiErrorMessage(query.error, 'Could not load leave types.')}
              </Typography>
            </AppCard>
          ) : (
            <ListTableCard
              title="Leave type catalog"
              subtitle={`${total} total`}
              icon="airplane-outline"
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
                  minWidth={480}
                  emptyState={{
                    title: 'No leave types',
                    description: 'Create leave types for employees to apply against.',
                    icon: 'airplane-outline',
                  }}
                  actionColumn={
                    canManage
                      ? {
                          label: 'Actions',
                          width: 150,
                          render: (row) => (
                            <View style={styles.actions}>
                              <Button size="compact" variant="outlined" onPress={() => openEdit(row)}>
                                Edit
                              </Button>
                              <Button size="compact" variant="ghost" onPress={() => setDeleteId(row.id)}>
                                Delete
                              </Button>
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
        title={editRow ? 'Edit leave type' : 'Add leave type'}
        onClose={() => setModalOpen(false)}
        onSave={() => void save()}
        primaryButtonLabel={editRow ? 'Update' : 'Create'}
        primaryButtonDisabled={saving}
      >
        <View style={{ gap: 12 }}>
          <InputField label="Name" value={name} onChangeText={setName} />
          <InputField label="Description" value={description} onChangeText={setDescription} />
          <InputField
            label="Max days per year"
            value={maxDays}
            onChangeText={setMaxDays}
            placeholder="e.g. 12"
          />
        </View>
      </FormModal>

      <ConfirmActionModal
        open={Boolean(deleteId)}
        title="Delete leave type?"
        description="This removes the leave type from the catalog."
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
  screen: { flex: 1, paddingTop: 12 },
  scroll: { paddingBottom: 32 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  centered: { minHeight: 120, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 6, justifyContent: 'flex-end' },
});
