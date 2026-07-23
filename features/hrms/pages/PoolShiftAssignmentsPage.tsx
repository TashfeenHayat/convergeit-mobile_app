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
  Calendar,
  ConfirmActionModal,
  DataCardGrid,
  EntityListCard,
  FiltersSearchBar,
  FormModal,
  ListTableCard,
  SelectField,
  TablePagination,
  Typography,
} from '@/components/ui';
import { WorkingWeekDayToggles } from '@/features/hrms/components/WorkingWeekDayToggles';
import { extractApiErrorMessage } from '@/lib/api/errors';
import {
  sessionMayPickInternalUserScope,
  useAuth,
  type SessionScopeUser,
} from '@/lib/auth';
import {
  useAssignPoolShiftMutation,
  useDepartmentsListQuery,
  usePoolShiftAssignmentsListQuery,
  usePoolsListQuery,
  useRemovePoolShiftAssignmentMutation,
  useShiftsListQuery,
} from '@/lib/hooks/query/hrms';
import { glassUi } from '@/lib/theme/glass-ui';
import { pickApiItems, pickApiTotal } from '@/lib/utils/admin-list';
import {
  formatIsoDate,
  isRecord,
  pickNum,
  pickStr,
  unwrapApiData,
} from '@/lib/utils/core';
import {
  clampWorkingDaysMask,
  effectiveWorkingDaysMask,
  formatWorkingDaysMaskHuman,
  HRMS_DEFAULT_WORKING_DAYS_MASK,
} from '@/lib/utils/hrms/shift-working-days';
import { useAppTheme } from '@/theme';

/** Network parity: GET /hrms/pool-shift-assignments?all=true&page=1&limit=8 */
const PAGE_LIMIT = 8;

type AssignmentRow = {
  id: string;
  poolName: string;
  shiftName: string;
  weekSummary: string;
  effectiveFrom: string;
  effectiveTo: string;
};

function extractTotalPages(data: unknown): number {
  const payload = unwrapApiData(data);
  if (!isRecord(payload)) return 1;
  const n = pickNum(payload, ['totalPages']);
  return n && n > 0 ? n : 1;
}

function parseRows(data: unknown): AssignmentRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r) => {
      const id = pickStr(r, ['id']);
      if (!id) return null;
      const pool = isRecord(r.pool) ? r.pool : null;
      const shift = isRecord(r.shift) ? r.shift : null;
      const assignMask = r.workingDaysMask ?? r.working_days_mask;
      const tmplMask = pickNum(shift, ['workingDaysMask', 'working_days_mask']);
      const mask = effectiveWorkingDaysMask(assignMask, tmplMask);
      const inherited =
        assignMask == null ||
        assignMask === '' ||
        !Number.isFinite(Number(assignMask));
      const weekLabel = formatWorkingDaysMaskHuman(mask);
      return {
        id,
        poolName: pickStr(pool, ['name']) || pickStr(r, ['poolName']) || '—',
        shiftName: pickStr(shift, ['name']) || pickStr(r, ['shiftName']) || '—',
        weekSummary: inherited ? `Inherited (${weekLabel})` : weekLabel,
        effectiveFrom: formatIsoDate(
          pickStr(r, ['effectiveFrom', 'from', 'startDate']),
        ),
        effectiveTo: formatIsoDate(
          pickStr(r, ['effectiveTo', 'to', 'endDate']),
        ),
      };
    })
    .filter((x): x is AssignmentRow => x !== null);
}

/**
 * Pool Shift Assignments.
 * On load:
 * - GET /hrms/departments?all=true&type=Internal
 * - GET /hrms/pools?departmentType=Internal&all=true
 * - GET /hrms/shifts?all=true&shiftScope=internal
 * - GET /hrms/pool-shift-assignments?all=true&page=1&limit=8
 */
export function PoolShiftAssignmentsPage() {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const { isPlatformAdmin, user: authUser } = useAuth();
  const mayPickInternal = useMemo(
    () =>
      sessionMayPickInternalUserScope(
        isPlatformAdmin,
        authUser as SessionScopeUser | null,
      ),
    [isPlatformAdmin, authUser],
  );

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterPoolId, setFilterPoolId] = useState('');

  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [assignDeptKind, setAssignDeptKind] = useState<'Internal' | 'External'>(
    'Internal',
  );
  const [poolId, setPoolId] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [overrideWeek, setOverrideWeek] = useState(false);
  const [workingMask, setWorkingMask] = useState(HRMS_DEFAULT_WORKING_DAYS_MASK);

  const effectiveAssignKind: 'Internal' | 'External' = mayPickInternal
    ? assignDeptKind
    : 'External';

  /**
   * Add pool shift (Internal):
   * GET /hrms/departments?all=true&type=Internal
   */
  const deptsQuery = useDepartmentsListQuery(
    assignOpen && effectiveAssignKind === 'Internal'
      ? { all: true, type: 'Internal' }
      : undefined,
    {
      enabled: assignOpen && effectiveAssignKind === 'Internal',
      scope: 'pool-shift-assign-internal-depts',
    },
  );

  /**
   * Add pool shift (Internal):
   * GET /hrms/pools?departmentType=Internal&all=true
   */
  const poolsQuery = usePoolsListQuery(
    assignOpen && effectiveAssignKind === 'Internal'
      ? { departmentType: 'Internal', all: true }
      : undefined,
    {
      enabled: assignOpen && effectiveAssignKind === 'Internal',
      scope: 'pool-shift-assign-internal-pools',
    },
  );

  /** Filter pools (page list) — same Internal catalog when available */
  const filterPoolsQuery = usePoolsListQuery(
    { departmentType: 'Internal', all: true },
    { enabled: true, scope: 'pool-shift-filter-internal-pools' },
  );

  /** GET /hrms/shifts?all=true&shiftScope=internal */
  const shiftsQuery = useShiftsListQuery(
    {
      all: true,
      shiftScope: effectiveAssignKind === 'Internal' ? 'internal' : 'external',
    },
    { enabled: true, scope: 'pool-shift-templates' },
  );

  const listParams = useMemo(
    () =>
      filterPoolId.trim()
        ? {
            poolId: filterPoolId.trim(),
            page,
            limit: PAGE_LIMIT,
          }
        : {
            all: true as const,
            page,
            limit: PAGE_LIMIT,
          },
    [filterPoolId, page],
  );

  /** GET /hrms/pool-shift-assignments?all=true&page=1&limit=8 */
  const listQuery = usePoolShiftAssignmentsListQuery(listParams, {
    enabled: true,
    scope: 'pool-shifts',
  });

  const assignMutation = useAssignPoolShiftMutation();
  const removeMutation = useRemovePoolShiftAssignmentMutation();

  const allRows = useMemo(() => parseRows(listQuery.data), [listQuery.data]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((row) =>
      [row.poolName, row.shiftName, row.weekSummary, row.effectiveFrom, row.effectiveTo]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [allRows, search]);

  const total = pickApiTotal(listQuery.data, allRows.length);
  const pageCount = Math.max(
    1,
    extractTotalPages(listQuery.data) || Math.ceil(total / PAGE_LIMIT),
  );
  const rangeStart = rows.length > 0 ? (page - 1) * PAGE_LIMIT + 1 : 0;
  const rangeEnd = (page - 1) * PAGE_LIMIT + rows.length;

  const poolOptions = useMemo(() => {
    if (effectiveAssignKind !== 'Internal') {
      return [{ value: '', label: '— Select pool —' }];
    }
    const base = pickApiItems(poolsQuery.data)
      .filter(isRecord)
      .map((r) => {
        const id = pickStr(r, ['id']);
        return id ? { value: id, label: pickStr(r, ['name']) || id } : null;
      })
      .filter((x): x is { value: string; label: string } => x !== null);
    return [
      {
        value: '',
        label: poolsQuery.isLoading ? 'Loading pools…' : '— Select pool —',
      },
      ...base,
    ];
  }, [poolsQuery.data, poolsQuery.isLoading, effectiveAssignKind]);

  const filterPoolOptions = useMemo(() => {
    const base = pickApiItems(filterPoolsQuery.data)
      .filter(isRecord)
      .map((r) => {
        const id = pickStr(r, ['id']);
        return id ? { value: id, label: pickStr(r, ['name']) || id } : null;
      })
      .filter((x): x is { value: string; label: string } => x !== null);
    return [{ value: '', label: 'All pools' }, ...base];
  }, [filterPoolsQuery.data]);

  const shiftOptions = useMemo(() => {
    const base = pickApiItems(shiftsQuery.data)
      .filter(isRecord)
      .map((r) => {
        const id = pickStr(r, ['id']);
        const name = pickStr(r, ['name']);
        if (!id || !name) return null;
        return { value: id, label: name };
      })
      .filter((x): x is { value: string; label: string } => x !== null);
    return [
      {
        value: '',
        label: shiftsQuery.isLoading
          ? 'Loading shifts…'
          : '— Select shift —',
      },
      ...base,
    ];
  }, [shiftsQuery.data, shiftsQuery.isLoading]);

  useEffect(() => {
    setPage((p) => (p > pageCount ? pageCount : p));
  }, [pageCount]);

  useEffect(() => {
    setPoolId('');
  }, [effectiveAssignKind]);

  // Ensure Internal assign APIs fire when modal opens (network parity).
  useEffect(() => {
    if (!assignOpen || effectiveAssignKind !== 'Internal') return;
    void deptsQuery.refetch();
    void poolsQuery.refetch();
  }, [assignOpen, effectiveAssignKind]);

  const resetAssign = () => {
    setAssignDeptKind('Internal');
    setPoolId('');
    setShiftId('');
    setEffectiveFrom('');
    setEffectiveTo('');
    setOverrideWeek(false);
    setWorkingMask(HRMS_DEFAULT_WORKING_DAYS_MASK);
  };

  const handleAssign = async () => {
    if (!poolId.trim()) {
      Alert.alert('Validation', 'Please select a pool.');
      return;
    }
    if (!shiftId.trim()) {
      Alert.alert('Validation', 'Please select a shift.');
      return;
    }
    if (!effectiveFrom.trim()) {
      Alert.alert('Validation', 'Please select effective from date.');
      return;
    }
    if (!effectiveTo.trim()) {
      Alert.alert('Validation', 'Please select effective to date.');
      return;
    }
    try {
      await assignMutation.mutateAsync({
        poolId: poolId.trim(),
        shiftId: shiftId.trim(),
        effectiveFrom: effectiveFrom.trim(),
        effectiveTo: effectiveTo.trim(),
        ...(overrideWeek
          ? { workingDaysMask: clampWorkingDaysMask(workingMask) }
          : {}),
      });
      setAssignOpen(false);
      resetAssign();
      void listQuery.refetch();
    } catch (err) {
      Alert.alert('Assign failed', extractApiErrorMessage(err));
    }
  };

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={listQuery.isRefetching && !listQuery.isLoading}
            onRefresh={() => {
              void listQuery.refetch();
              void shiftsQuery.refetch();
              void filterPoolsQuery.refetch();
              if (assignOpen && effectiveAssignKind === 'Internal') {
                void deptsQuery.refetch();
                void poolsQuery.refetch();
              }
            }}
            tintColor={accent}
          />
        } showsVerticalScrollIndicator={false}>
        <DashboardPageIntro subtitle="Default shifts for a pool (applies to users without a user override).">
          <View style={styles.headerActions}>
            <View
              style={[
                styles.countPill,
                {
                  borderColor: theme.app.dashboard.cardBorder,
                  backgroundColor: theme.app.dashboard.overlayLight,
                },
              ]}
            >
              <Typography variant="small" style={{ fontWeight: '600' }}>
                {total} assignment{total === 1 ? '' : 's'}
              </Typography>
            </View>
            <Pressable
              onPress={() => setAssignOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Add pool shift"
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
                  Add pool shift
                </Typography>
                <Typography variant="small" muted numberOfLines={2}>
                  Assign a shift template to a pool
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
          </View>

          <FiltersSearchBar
            value={searchInput}
            onChange={setSearchInput}
            onSearch={() => {
              setSearch(searchInput.trim());
              setPage(1);
            }}
            placeholder="Search by pool, shift, or dates."
            filtersOpen={filtersOpen}
            onFilterPress={() => setFiltersOpen((v) => !v)}
            hasActiveFilters={Boolean(filterPoolId.trim()) || Boolean(search.trim())}
          >
            {filtersOpen ? (
              <View style={{ gap: 12 }}>
                <Typography variant="small" muted>
                  Use Filter to narrow by department or pool. Search applies to
                  the current page after you press Search.
                </Typography>
                <SelectField
                  label="Pool"
                  value={filterPoolId}
                  onChange={(v) => {
                    setFilterPoolId(v);
                    setPage(1);
                  }}
                  options={filterPoolOptions}
 />
                {filterPoolId.trim() || search.trim() ? (
                  <Button
                    size="compact"
                    variant="outlined"
                    onPress={() => {
                      setFilterPoolId('');
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

        {listQuery.isError ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(
                listQuery.error,
                'Could not load pool shift assignments.',
              )}
            </Typography>
            <Button
              size="compact"
              variant="outlined"
              onPress={() => void listQuery.refetch()}
            >
              Retry
            </Button>
          </AppCard>
        ) : (
          <ListTableCard
            title="Assigned shifts"
            subtitle="Use Filter to narrow by department or pool. Search applies to the current page after you press Search."
            icon="cash-outline"
            toolbar={null}
          >
            <DataCardGrid
              columns={1}
              isLoading={listQuery.isLoading && !listQuery.data}
              empty={!listQuery.isLoading && rows.length === 0}
              emptyState={{
                title: 'No records yet',
                description:
                  'There is no data available for the current filter.',
                icon: 'time-outline',
                action: (
                  <Button size="compact" onPress={() => setAssignOpen(true)}>
                    Add pool shift
                  </Button>
                ),
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
                  title={row.poolName}
                  meta={row.shiftName}
                  details={[
                    { label: 'Pool', value: row.poolName },
                    { label: 'Shift', value: row.shiftName },
                    { label: 'Working week', value: row.weekSummary },
                    { label: 'Effective from', value: row.effectiveFrom },
                    { label: 'Effective to', value: row.effectiveTo },
                  ]}
                  onDeletePress={() => setDeleteId(row.id)}
 />
              ))}
            </DataCardGrid>
          </ListTableCard>
        )}
      </ScrollView>

      <FormModal
        open={assignOpen}
        title="Add pool shift"
        description={
          mayPickInternal
            ? 'Pick department type and pool. Internal pools are company-wide; External still needs reseller, parent company, and department.'
            : 'Pick pool, shift, and effective dates.'
        }
        onClose={() => {
          if (assignMutation.isPending) return;
          setAssignOpen(false);
          resetAssign();
        }}
        onSave={() => void handleAssign()}
        primaryButtonLabel={assignMutation.isPending ? 'Saving…' : 'Assign'}
        primaryButtonDisabled={assignMutation.isPending}
        cancelButtonLabel="Close"
      >
        <View style={{ gap: 14 }}>
          {mayPickInternal ? (
            <SelectField
              label="Department type"
              value={assignDeptKind}
              onChange={(v) => {
                setAssignDeptKind(v === 'External' ? 'External' : 'Internal');
              }}
              options={[
                { value: 'Internal', label: 'Internal' },
                { value: 'External', label: 'External' },
              ]}
 />
          ) : null}

          <SelectField
            label="Pool"
            value={poolId}
            onChange={setPoolId}
            options={poolOptions}
 />
          <SelectField
            label="Shift"
            value={shiftId}
            onChange={setShiftId}
            options={shiftOptions}
 />

          <View
            style={[
              styles.weeklyBlock,
              { borderTopColor: theme.app.dashboard.cardBorder },
            ]}
          >
            <Pressable
              onPress={() => setOverrideWeek((v) => !v)}
              style={styles.overrideRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: overrideWeek }}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: accent,
                    backgroundColor: overrideWeek ? accent : 'transparent',
                  },
                ]}
              >
                {overrideWeek ? (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                ) : null}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Typography variant="medium" style={{ fontWeight: '600' }}>
                  Use custom working days
                </Typography>
                <Typography variant="small" muted>
                  Inherits the shift template when off. Sent only for this pool
                  assignment.
                </Typography>
              </View>
            </Pressable>
            {overrideWeek ? (
              <WorkingWeekDayToggles
                value={workingMask}
                onChange={setWorkingMask}
                disabled={assignMutation.isPending}
 />
            ) : null}
          </View>

          <View style={styles.datesRow}>
            <View style={styles.dateCol}>
              <Calendar
                label="Effective from"
                value={effectiveFrom}
                onChange={setEffectiveFrom}
                max={effectiveTo || undefined}
 />
            </View>
            <View style={styles.dateCol}>
              <Calendar
                label="Effective to"
                value={effectiveTo}
                onChange={setEffectiveTo}
                min={effectiveFrom || undefined}
 />
            </View>
          </View>
        </View>
      </FormModal>

      <ConfirmActionModal
        open={Boolean(deleteId)}
        title="Remove assignment?"
        description="This removes the pool shift assignment."
        confirmLabel="Remove"
        confirmButtonVariant="danger"
        isLoading={removeMutation.isPending}
        onDismiss={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await removeMutation.mutateAsync(deleteId);
            setDeleteId(null);
            void listQuery.refetch();
          } catch (err) {
            Alert.alert('Remove failed', extractApiErrorMessage(err));
          }
        }}
 />
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12, paddingHorizontal: 8 },
  scroll: { paddingBottom: 32 },
  headerActions: { gap: 12 },
  countPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
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
  overrideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  weeklyBlock: {
    gap: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  weeklyLabel: {
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  datesRow: { flexDirection: 'row', gap: 10 },
  dateCol: { flex: 1, minWidth: 0 },
});
