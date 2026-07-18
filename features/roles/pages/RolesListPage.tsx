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
import { canRoleAction } from '@/lib/permissions';
import {
  useCreateRoleMutation,
  useRolesListQuery,
  useSoftDeleteRoleMutation,
  useUpdateRoleMutation,
} from '@/lib/hooks/query/roles';
import { isRecord, pickStr } from '@/lib/utils/core';
import { pickApiItems, pickApiTotal } from '@/lib/utils/admin-list';
import { useAppTheme } from '@/theme';

const PAGE_SIZE = 15;

type RoleRow = { id: string; name: string };

function parseRows(data: unknown): RoleRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r) => {
      const id = pickStr(r, ['id']);
      if (!id) return null;
      return { id, name: pickStr(r, ['name']) || '—' };
    })
    .filter((x): x is RoleRow => x !== null);
}

export function RolesListPage() {
  const theme = useAppTheme();
  const { hasOperational } = useAuth();
  const canManage = canRoleAction(hasOperational);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<RoleRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');

  const query = useRolesListQuery({ page, limit: PAGE_SIZE, search: search.trim() || undefined });
  const createMutation = useCreateRoleMutation();
  const updateMutation = useUpdateRoleMutation();
  const deleteMutation = useSoftDeleteRoleMutation();

  const rows = useMemo(() => parseRows(query.data), [query.data]);
  const total = pickApiTotal(query.data, rows.length);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const saving = createMutation.isPending || updateMutation.isPending;

  const columns: DataTableColumn<RoleRow>[] = useMemo(
    () => [{ id: 'name', label: 'Role', minWidth: 200 }],
    [],
  );

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'Role name is required.');
      return;
    }
    try {
      if (editRow) {
        await updateMutation.mutateAsync({ id: editRow.id, body: { name: trimmed } });
      } else {
        await createMutation.mutateAsync({
          name: trimmed,
          permissionNames: [],
          deniedPermissionNames: [],
        });
      }
      setModalOpen(false);
    } catch (err) {
      Alert.alert('Save failed', extractApiErrorMessage(err));
    }
  };

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
              <Typography variant="boldLarge">Roles</Typography>
              <Typography variant="medium" muted>
                Access roles. Fine-grained permission matrix can be refined after create.
              </Typography>
            </View>
            {canManage ? (
              <Button
                size="compact"
                onPress={() => {
                  setEditRow(null);
                  setName('');
                  setModalOpen(true);
                }}
              >
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
            placeholder="Search roles…"
          />
          {query.isError ? (
            <AppCard>
              <Typography variant="medium" color={theme.app.danger}>
                {extractApiErrorMessage(query.error, 'Could not load roles.')}
              </Typography>
            </AppCard>
          ) : (
            <ListTableCard
              title="Role list"
              subtitle={`${total} total`}
              icon="shield-outline"
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
                  minWidth={320}
                  emptyState={{
                    title: 'No roles',
                    description: 'Create a role to assign permissions.',
                    icon: 'shield-outline',
                  }}
                  actionColumn={
                    canManage
                      ? {
                          label: 'Actions',
                          width: 150,
                          render: (row) => (
                            <View style={styles.actions}>
                              <Button
                                size="compact"
                                variant="outlined"
                                onPress={() => {
                                  setEditRow(row);
                                  setName(row.name === '—' ? '' : row.name);
                                  setModalOpen(true);
                                }}
                              >
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
        title={editRow ? 'Edit role' : 'Add role'}
        description="Permission checkboxes can be assigned after the role exists."
        onClose={() => setModalOpen(false)}
        onSave={() => void save()}
        primaryButtonLabel={editRow ? 'Update' : 'Create'}
        primaryButtonDisabled={saving}
      >
        <InputField label="Role name" value={name} onChangeText={setName} />
      </FormModal>

      <ConfirmActionModal
        open={Boolean(deleteId)}
        title="Delete role?"
        description="This soft-deletes the role."
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
