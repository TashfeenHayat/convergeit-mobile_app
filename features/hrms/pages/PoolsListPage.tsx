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
  SegmentedControl,
  StatusChip,
  TablePagination,
  Typography,
  type DataTableColumn,
} from '@/components/ui';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import { canPoolAction } from '@/lib/permissions';
import {
  useCreatePoolMutation,
  useDeletePoolMutation,
  usePoolsListQuery,
  useUpdatePoolMutation,
} from '@/lib/hooks/query/hrms/pools';
import { isRecord, pickStr } from '@/lib/utils/core';
import { pickApiItems, pickApiTotal } from '@/lib/utils/admin-list';
import { useAppTheme } from '@/theme';

const PAGE_SIZE = 15;

type PoolRow = { id: string; name: string; poolKind: string };

function parseRows(data: unknown): PoolRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r) => {
      const id = pickStr(r, ['id']);
      if (!id) return null;
      const kind = pickStr(r, ['poolKind', 'type', 'kind']) || 'Internal';
      return {
        id,
        name: pickStr(r, ['name']) || '—',
        poolKind: kind === 'External' ? 'External' : 'Internal',
      };
    })
    .filter((x): x is PoolRow => x !== null);
}

export function PoolsListPage() {
  const theme = useAppTheme();
  const { hasOperational } = useAuth();
  const canCreate = canPoolAction(hasOperational, 'create');
  const canUpdate = canPoolAction(hasOperational, 'update');
  const canDelete = canPoolAction(hasOperational, 'delete');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<PoolRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [poolKind, setPoolKind] = useState<'Internal' | 'External'>('Internal');

  const query = usePoolsListQuery({ page, limit: PAGE_SIZE, search: search.trim() || undefined });
  const createMutation = useCreatePoolMutation();
  const updateMutation = useUpdatePoolMutation();
  const deleteMutation = useDeletePoolMutation();

  const rows = useMemo(() => parseRows(query.data), [query.data]);
  const total = pickApiTotal(query.data, rows.length);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const saving = createMutation.isPending || updateMutation.isPending;

  const openCreate = () => {
    setEditRow(null);
    setName('');
    setPoolKind('Internal');
    setModalOpen(true);
  };

  const openEdit = (row: PoolRow) => {
    setEditRow(row);
    setName(row.name === '—' ? '' : row.name);
    setPoolKind(row.poolKind === 'External' ? 'External' : 'Internal');
    setModalOpen(true);
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'Pool name is required.');
      return;
    }
    try {
      if (editRow) {
        await updateMutation.mutateAsync({ id: editRow.id, body: { name: trimmed } });
      } else {
        await createMutation.mutateAsync({ name: trimmed, poolKind });
      }
      setModalOpen(false);
    } catch (err) {
      Alert.alert('Save failed', extractApiErrorMessage(err));
    }
  };

  const columns: DataTableColumn<PoolRow>[] = useMemo(
    () => [
      { id: 'name', label: 'Pool', minWidth: 160 },
      {
        id: 'poolKind',
        label: 'Kind',
        minWidth: 110,
        render: (v) => <StatusChip label={String(v)} tone={v === 'External' ? 'info' : 'neutral'} />,
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
              <Typography variant="boldLarge">Pools</Typography>
              <Typography variant="medium" muted>
                Group agents into staffing pools.
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
            placeholder="Search pools…"
          />
          {query.isError ? (
            <AppCard>
              <Typography variant="medium" color={theme.app.danger}>
                {extractApiErrorMessage(query.error, 'Could not load pools.')}
              </Typography>
            </AppCard>
          ) : (
            <ListTableCard
              title="Pool list"
              subtitle={`${total} total`}
              icon="people-outline"
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
                    title: 'No pools',
                    description: 'Create a pool to assign agents.',
                    icon: 'people-outline',
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
        title={editRow ? 'Edit pool' : 'Add pool'}
        onClose={() => setModalOpen(false)}
        onSave={() => void save()}
        primaryButtonLabel={editRow ? 'Update' : 'Create'}
        primaryButtonDisabled={saving}
      >
        <View style={{ gap: 12 }}>
          <InputField label="Pool name" value={name} onChangeText={setName} />
          {!editRow ? (
            <>
              <Typography variant="small" muted>
                Pool kind
              </Typography>
              <SegmentedControl
                options={[
                  { label: 'Internal', value: 'Internal' },
                  { label: 'External', value: 'External' },
                ]}
                value={poolKind}
                onChange={(v) => setPoolKind(v as 'Internal' | 'External')}
              />
            </>
          ) : null}
        </View>
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
  screen: { flex: 1, paddingTop: 12 },
  scroll: { paddingBottom: 32 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  centered: { minHeight: 120, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 6, justifyContent: 'flex-end' },
});
