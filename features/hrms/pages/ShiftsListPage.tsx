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
import { canShiftAction } from '@/lib/permissions';
import {
  useCreateShiftMutation,
  useDeleteShiftMutation,
  useShiftsListQuery,
  useUpdateShiftMutation,
} from '@/lib/hooks/query/hrms/shifts';
import { isRecord, pickStr } from '@/lib/utils/core';
import { pickApiItems, pickApiTotal } from '@/lib/utils/admin-list';
import { useAppTheme } from '@/theme';

const PAGE_SIZE = 15;
const DEFAULT_MASK = 31;

type ShiftRow = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  timezone: string;
  breakMinutes: string;
};

function parseRows(data: unknown): ShiftRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r) => {
      const id = pickStr(r, ['id']);
      if (!id) return null;
      return {
        id,
        name: pickStr(r, ['name']) || '—',
        startTime: pickStr(r, ['startTime', 'start']) || '—',
        endTime: pickStr(r, ['endTime', 'end']) || '—',
        timezone: pickStr(r, ['timezone', 'tz']) || 'UTC',
        breakMinutes: String(r.breakMinutes ?? r.break_minutes ?? 0),
      };
    })
    .filter((x): x is ShiftRow => x !== null);
}

export function ShiftsListPage() {
  const theme = useAppTheme();
  const { hasOperational } = useAuth();
  const canCreate = canShiftAction(hasOperational, 'create');
  const canUpdate = canShiftAction(hasOperational, 'update');
  const canDelete = canShiftAction(hasOperational, 'delete');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<ShiftRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [breakMinutes, setBreakMinutes] = useState('60');
  const [timezone, setTimezone] = useState('UTC');

  const query = useShiftsListQuery({ page, limit: PAGE_SIZE, search: search.trim() || undefined });
  const createMutation = useCreateShiftMutation();
  const updateMutation = useUpdateShiftMutation();
  const deleteMutation = useDeleteShiftMutation();

  const rows = useMemo(() => parseRows(query.data), [query.data]);
  const total = pickApiTotal(query.data, rows.length);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const saving = createMutation.isPending || updateMutation.isPending;

  const openCreate = () => {
    setEditRow(null);
    setName('');
    setStartTime('09:00');
    setEndTime('17:00');
    setBreakMinutes('60');
    setTimezone('UTC');
    setModalOpen(true);
  };

  const openEdit = (row: ShiftRow) => {
    setEditRow(row);
    setName(row.name === '—' ? '' : row.name);
    setStartTime(row.startTime === '—' ? '09:00' : row.startTime);
    setEndTime(row.endTime === '—' ? '17:00' : row.endTime);
    setBreakMinutes(row.breakMinutes || '0');
    setTimezone(row.timezone || 'UTC');
    setModalOpen(true);
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'Shift name is required.');
      return;
    }
    const body = {
      name: trimmed,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      breakMinutes: Number(breakMinutes) || 0,
      timezone: timezone.trim() || 'UTC',
      workingDaysMask: DEFAULT_MASK,
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

  const columns: DataTableColumn<ShiftRow>[] = useMemo(
    () => [
      { id: 'name', label: 'Shift', minWidth: 140 },
      { id: 'startTime', label: 'Start', minWidth: 80, cellVariant: 'muted' },
      { id: 'endTime', label: 'End', minWidth: 80, cellVariant: 'muted' },
      { id: 'timezone', label: 'TZ', minWidth: 80, cellVariant: 'muted' },
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
              <Typography variant="boldLarge">Shifts</Typography>
              <Typography variant="medium" muted>
                Shift templates for scheduling.
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
            placeholder="Search shifts…"
          />
          {query.isError ? (
            <AppCard>
              <Typography variant="medium" color={theme.app.danger}>
                {extractApiErrorMessage(query.error, 'Could not load shifts.')}
              </Typography>
            </AppCard>
          ) : (
            <ListTableCard
              title="Shift templates"
              subtitle={`${total} total`}
              icon="time-outline"
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
                    title: 'No shifts',
                    description: 'Create a shift template to assign later.',
                    icon: 'time-outline',
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
        title={editRow ? 'Edit shift' : 'Add shift'}
        onClose={() => setModalOpen(false)}
        onSave={() => void save()}
        primaryButtonLabel={editRow ? 'Update' : 'Create'}
        primaryButtonDisabled={saving}
      >
        <View style={{ gap: 12 }}>
          <InputField label="Name" value={name} onChangeText={setName} />
          <InputField label="Start time" value={startTime} onChangeText={setStartTime} placeholder="HH:mm" />
          <InputField label="End time" value={endTime} onChangeText={setEndTime} placeholder="HH:mm" />
          <InputField label="Break minutes" value={breakMinutes} onChangeText={setBreakMinutes} />
          <InputField label="Timezone" value={timezone} onChangeText={setTimezone} placeholder="UTC" />
        </View>
      </FormModal>

      <ConfirmActionModal
        open={Boolean(deleteId)}
        title="Delete shift?"
        description="This removes the shift template."
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
