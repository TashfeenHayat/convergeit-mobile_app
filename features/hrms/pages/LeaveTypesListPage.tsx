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
  TablePagination,
  Typography,
} from '@/components/ui';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import {
  useCreateLeaveTypeMutation,
  useDeleteLeaveTypeMutation,
  useLeaveTypesListQuery,
  useUpdateLeaveTypeMutation,
} from '@/lib/hooks/query/hrms/leave-types';
import { canLeaveTypeManage, canLeaveTypeView } from '@/lib/permissions';
import { pickApiItems, pickApiTotal } from '@/lib/utils/admin-list';
import { isRecord, pickNum, pickStr, unwrapApiData } from '@/lib/utils/core';
import { glassUi } from '@/lib/theme/glass-ui';
import { useAppTheme } from '@/theme';

/** Network parity: GET /hrms/leave-types?page=1&limit=10 */
const PAGE_LIMIT = 10;

type LeaveTypeRow = {
  id: string;
  name: string;
  description: string;
  maxDaysPerYear: string;
};

function extractTotalPages(data: unknown): number {
  const payload = unwrapApiData(data);
  if (!isRecord(payload)) return 1;
  const n = pickNum(payload, ['totalPages']);
  return n && n > 0 ? n : 1;
}

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

/**
 * Leave Types — catalog list + add/edit/delete.
 * Network: GET /hrms/leave-types?page=1&limit=10
 */
export function LeaveTypesListPage() {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const { hasOperational } = useAuth();
  const canManage = canLeaveTypeManage(hasOperational);
  const canView = canLeaveTypeView(hasOperational) || canManage;

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<LeaveTypeRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxDays, setMaxDays] = useState('');

  /** GET /hrms/leave-types?page=1&limit=10 */
  const query = useLeaveTypesListQuery(
    {
      page,
      limit: PAGE_LIMIT,
      ...(search.trim() ? { search: search.trim() } : {}),
    },
    { enabled: canView, scope: 'leave-types-list' },
  );
  const createMutation = useCreateLeaveTypeMutation();
  const updateMutation = useUpdateLeaveTypeMutation();
  const deleteMutation = useDeleteLeaveTypeMutation();

  const rows = useMemo(() => parseRows(query.data), [query.data]);
  const total = pickApiTotal(query.data, rows.length);
  const pageCount = Math.max(
    1,
    extractTotalPages(query.data) || Math.ceil(total / PAGE_LIMIT),
  );
  const rangeStart = rows.length > 0 ? (page - 1) * PAGE_LIMIT + 1 : 0;
  const rangeEnd = (page - 1) * PAGE_LIMIT + rows.length;
  const saving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    setPage((p) => (p > pageCount ? pageCount : p));
  }, [pageCount]);

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
      void query.refetch();
    } catch (err) {
      Alert.alert('Save failed', extractApiErrorMessage(err));
    }
  };

  if (!canView) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" muted>
            You do not have permission to view leave types.
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
            tintColor={accent}
          />
        } showsVerticalScrollIndicator={false}>
        <DashboardPageIntro subtitle="Create and manage leave types.">
          {canManage ? (
            <Pressable
              onPress={openCreate}
              accessibilityRole="button"
              accessibilityLabel="Add leave type"
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
                  Add leave type
                </Typography>
                <Typography variant="small" muted numberOfLines={2}>
                  Create a leave category and yearly cap
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
        </DashboardPageIntro>

        {query.isError ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(
                query.error,
                'Could not load leave types.',
              )}
            </Typography>
            <Button
              size="compact"
              variant="outlined"
              onPress={() => void query.refetch()}
            >
              Retry
            </Button>
          </AppCard>
        ) : (
          <ListTableCard
            title="Leave Types"
            icon="cash-outline"
            toolbar={
              <View style={styles.searchToolbar}>
                <View style={styles.searchField}>
                  <SearchBar
                    value={searchInput}
                    onChange={setSearchInput}
                    onSubmit={() => {
                      setSearch(searchInput.trim());
                      setPage(1);
                    }}
                    placeholder="Search anything.."
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
                title: 'No leave types',
                description:
                  'Create leave types for employees to apply against.',
                icon: 'airplane-outline',
                action: canManage ? (
                  <Button size="compact" onPress={openCreate}>
                    Add leave type
                  </Button>
                ) : undefined,
              }}
              showingLabel={`Showing data ${rangeStart} to ${rangeEnd} of ${total} entries`}
              footerRight={
                <TablePagination
                  page={page}
                  pageCount={pageCount}
                  onPageChange={setPage}
 />
              }
            >
              {rows.map((row) => (
                <EntityListCard
                  key={row.id}
                  title={row.name}
                  details={[
                    { label: 'Leave type', value: row.name },
                    { label: 'Description', value: row.description },
                    { label: 'Max days/year', value: row.maxDaysPerYear },
                  ]}
                  onEditPress={canManage ? () => openEdit(row) : undefined}
                  onDeletePress={
                    canManage ? () => setDeleteId(row.id) : undefined
                  }
 />
              ))}
            </DataCardGrid>
          </ListTableCard>
        )}
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
          <InputField
            label="Description"
            value={description}
            onChangeText={setDescription}
 />
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
            void query.refetch();
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
  searchToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  searchField: { flex: 1, minWidth: 0 },
});
