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
import { AddShiftModal } from '@/features/hrms/components/AddShiftModal';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import { useCompaniesSetupResellersQuery } from '@/lib/hooks/query/companies';
import {
  useDeleteShiftMutation,
  useShiftsListQuery,
} from '@/lib/hooks/query/hrms/shifts';
import { canShiftAction } from '@/lib/permissions';
import { glassUi } from '@/lib/theme/glass-ui';
import { pickApiItems, pickApiTotal } from '@/lib/utils/admin-list';
import {
  isRecord,
  pickNum,
  pickStr,
  unwrapApiData,
} from '@/lib/utils/core';
import {
  formatWorkingDaysMaskHuman,
  HRMS_DEFAULT_WORKING_DAYS_MASK,
  workingWeekdaysFromApiRecord,
} from '@/lib/utils/hrms/shift-working-days';
import type { HrmsShiftsListShiftScope } from '@/lib/utils/hrms/shifts-list-params';
import { useAppTheme } from '@/theme';

/** Network parity: GET /hrms/shifts?page=1&limit=8&shiftScope=external */
const PAGE_LIMIT = 8;

type ShiftRow = {
  id: string;
  name: string;
  scope: string;
  owner: string;
  workingWeek: string;
  startTime: string;
  endTime: string;
  breakMinutes: string;
  timezone: string;
  workingDaysMask: number;
};

function extractTotalPages(data: unknown): number {
  const payload = unwrapApiData(data);
  if (!isRecord(payload)) return 1;
  const n = pickNum(payload, ['totalPages']);
  return n && n > 0 ? n : 1;
}

function formatWorkingWeek(r: Record<string, unknown>): string {
  const fromArr = workingWeekdaysFromApiRecord(r);
  if (fromArr?.length) return fromArr.join(', ');
  const mask =
    pickNum(r, ['workingDaysMask', 'working_days_mask']) ??
    HRMS_DEFAULT_WORKING_DAYS_MASK;
  return formatWorkingDaysMaskHuman(mask);
}

function parseRows(data: unknown): ShiftRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r) => {
      const id = pickStr(r, ['id']);
      if (!id) return null;
      const catalog = isRecord(r.catalog) ? r.catalog : null;
      const reseller =
        (isRecord(r.ownerReseller) ? r.ownerReseller : null) ??
        (isRecord(r.reseller) ? r.reseller : null);
      const parent =
        (isRecord(r.ownerParentCompany) ? r.ownerParentCompany : null) ??
        (isRecord(r.parentCompany) ? r.parentCompany : null);
      const scopeRaw =
        pickStr(r, ['shiftScope', 'scope', 'catalog']) ||
        pickStr(catalog, ['name', 'scope']) ||
        '—';
      const owner =
        pickStr(r, ['ownerResellerName', 'ownerName', 'owner']) ||
        pickStr(reseller, ['name']) ||
        pickStr(parent, ['name']) ||
        pickStr(r, ['ownerParentCompanyName']) ||
        '—';
      const workingDaysMask =
        pickNum(r, ['workingDaysMask', 'working_days_mask']) ??
        HRMS_DEFAULT_WORKING_DAYS_MASK;
      return {
        id,
        name: pickStr(r, ['name']) || '—',
        scope: scopeRaw,
        owner,
        workingWeek: formatWorkingWeek(r),
        startTime: pickStr(r, ['startTime', 'start']) || '—',
        endTime: pickStr(r, ['endTime', 'end']) || '—',
        breakMinutes: String(r.breakMinutes ?? r.break_minutes ?? 0),
        timezone: pickStr(r, ['timezone', 'tz']) || 'UTC',
        workingDaysMask,
      };
    })
    .filter((x): x is ShiftRow => x !== null);
}

/**
 * Shifts — templates list.
 * On load: GET /companies/setup/resellers + GET /hrms/shifts?page=1&limit=8&shiftScope=external
 */
export function ShiftsListPage() {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const { hasOperational } = useAuth();
  const canCreate = canShiftAction(hasOperational, 'create');
  const canUpdate = canShiftAction(hasOperational, 'update');
  const canDelete = canShiftAction(hasOperational, 'delete');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [shiftScope, setShiftScope] =
    useState<HrmsShiftsListShiftScope>('external');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<ShiftRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  /** GET /companies/setup/resellers (web parity on Shifts open) */
  const resellersQuery = useCompaniesSetupResellersQuery({ enabled: true });

  const listParams = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      shiftScope,
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [page, shiftScope, search],
  );

  /** GET /hrms/shifts?page=1&limit=8&shiftScope=external */
  const query = useShiftsListQuery(listParams, {
    enabled: true,
    scope: 'shifts-list',
  });
  const deleteMutation = useDeleteShiftMutation();

  const rows = useMemo(() => parseRows(query.data), [query.data]);
  const total = pickApiTotal(query.data, rows.length);
  const pageCount = Math.max(
    1,
    extractTotalPages(query.data) || Math.ceil(total / PAGE_LIMIT),
  );
  const rangeStart = rows.length > 0 ? (page - 1) * PAGE_LIMIT + 1 : 0;
  const rangeEnd = (page - 1) * PAGE_LIMIT + rows.length;

  const hasActiveFilters =
    shiftScope !== 'external' || Boolean(search.trim());

  useEffect(() => {
    setPage((p) => (p > pageCount ? pageCount : p));
  }, [pageCount]);

  const openCreate = () => {
    setEditRow(null);
    setModalOpen(true);
  };

  const openEdit = (row: ShiftRow) => {
    setEditRow(row);
    setModalOpen(true);
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
        <DashboardPageIntro subtitle="Shift templates and weekly patterns.">
          {canCreate ? (
            <Pressable
              onPress={openCreate}
              accessibilityRole="button"
              accessibilityLabel="Add shift"
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
                  Add shift
                </Typography>
                <Typography variant="small" muted numberOfLines={2}>
                  Create a shift template
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
            placeholder="Search by shift name..."
            filtersOpen={filtersOpen}
            onFilterPress={() => setFiltersOpen((v) => !v)}
            hasActiveFilters={hasActiveFilters}
          >
            {filtersOpen ? (
              <View style={{ gap: 12 }}>
                <SelectField
                  label="Scope"
                  value={shiftScope}
                  onChange={(v) => {
                    if (v === 'internal' || v === 'external' || v === 'all') {
                      setShiftScope(v);
                      setPage(1);
                    }
                  }}
                  options={[
                    { value: 'external', label: 'External' },
                    { value: 'internal', label: 'Internal' },
                    { value: 'all', label: 'All' },
                  ]}
 />
                {hasActiveFilters ? (
                  <Button
                    size="compact"
                    variant="outlined"
                    onPress={() => {
                      setShiftScope('external');
                      setSearch('');
                      setSearchInput('');
                      setPage(1);
                    }}
                  >
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
              {extractApiErrorMessage(query.error, 'Could not load shifts.')}
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
          <ListTableCard title="Shift templates" icon="time-outline" toolbar={null}>
            <DataCardGrid
              columns={1}
              isLoading={query.isLoading && !query.data}
              empty={!query.isLoading && rows.length === 0}
              emptyState={{
                title: 'No shift templates',
                description: 'Try another search or page.',
                icon: 'time-outline',
                action: canCreate ? (
                  <Button size="compact" onPress={openCreate}>
                    Add shift
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
                    { label: 'Shift', value: row.name },
                    { label: 'Scope', value: row.scope },
                    { label: 'Owner', value: row.owner },
                    { label: 'Working week', value: row.workingWeek },
                    { label: 'Start', value: row.startTime },
                    { label: 'End', value: row.endTime },
                    { label: 'Break', value: row.breakMinutes },
                    { label: 'Timezone', value: row.timezone },
                  ]}
                  onEditPress={canUpdate ? () => openEdit(row) : undefined}
                  onDeletePress={
                    canDelete ? () => setDeleteId(row.id) : undefined
                  }
 />
              ))}
            </DataCardGrid>
          </ListTableCard>
        )}
      </ScrollView>

      <AddShiftModal
        open={modalOpen}
        editShift={editRow}
        onClose={() => {
          setModalOpen(false);
          setEditRow(null);
        }}
        onSaved={() => void query.refetch()}
 />

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
});
