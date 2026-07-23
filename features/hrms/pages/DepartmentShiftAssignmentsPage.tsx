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
  useDepartmentShiftsListQuery,
  useDepartmentsListQuery,
  useEnableDepartmentShiftMutation,
  useRemoveDepartmentShiftMutation,
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
import type { HrmsShiftsListShiftScope } from '@/lib/utils/hrms/shifts-list-params';
import { useAppTheme } from '@/theme';

/** Network parity: GET /hrms/department-shifts?page=1&limit=8&shiftScope=all */
const PAGE_LIMIT = 8;

type AssignmentRow = {
  id: string;
  departmentName: string;
  shiftName: string;
  shiftTemplate: 'Platform' | 'Tenant' | '—';
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

function shiftTemplateCatalogLabel(
  shift: Record<string, unknown> | null,
): 'Platform' | 'Tenant' | '—' {
  if (!shift) return '—';
  const orv = shift.ownerResellerId ?? shift.owner_reseller_id;
  const opv = shift.ownerParentCompanyId ?? shift.owner_parent_company_id;
  const orStr = orv == null || orv === '' ? '' : String(orv).trim();
  const opStr = opv == null || opv === '' ? '' : String(opv).trim();
  if (!orStr && !opStr) return 'Platform';
  return 'Tenant';
}

function parseRows(data: unknown): AssignmentRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r) => {
      const id = pickStr(r, ['id']);
      if (!id) return null;
      const dept = isRecord(r.department) ? r.department : null;
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
        departmentName:
          pickStr(dept, ['name']) || pickStr(r, ['departmentName']) || '—',
        shiftName: pickStr(shift, ['name']) || pickStr(r, ['shiftName']) || '—',
        shiftTemplate: shiftTemplateCatalogLabel(shift),
        weekSummary: inherited
          ? `Inherited (${weekLabel})`
          : weekLabel,
        effectiveFrom: formatIsoDate(
          pickStr(r, ['effectiveFrom', 'effective_from']),
        ),
        effectiveTo: formatIsoDate(
          pickStr(r, ['effectiveTo', 'effective_to']),
        ),
      };
    })
    .filter((x): x is AssignmentRow => x !== null);
}

/**
 * Department Shift Assignments.
 * On load: departments?all=true&type=Internal,
 * department-shifts?page=1&limit=8&shiftScope=all,
 * shifts?all=true&shiftScope=internal
 */
export function DepartmentShiftAssignmentsPage() {
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
  const [shiftScope, setShiftScope] =
    useState<HrmsShiftsListShiftScope>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [assignDeptKind, setAssignDeptKind] = useState<'Internal' | 'External'>(
    'Internal',
  );
  const [departmentId, setDepartmentId] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [overrideWeek, setOverrideWeek] = useState(false);
  const [workingMask, setWorkingMask] = useState(HRMS_DEFAULT_WORKING_DAYS_MASK);

  const effectiveAssignKind: 'Internal' | 'External' = mayPickInternal
    ? assignDeptKind
    : 'External';

  /** Assign open + Internal → GET /hrms/departments?all=true&type=Internal */
  const deptsQuery = useDepartmentsListQuery(
    assignOpen && effectiveAssignKind === 'Internal'
      ? { all: true, type: 'Internal' }
      : undefined,
    {
      enabled: assignOpen && effectiveAssignKind === 'Internal',
      scope: 'dept-shift-assign-internal-depts',
    },
  );

  /** GET /hrms/shifts?all=true&shiftScope=internal|external */
  const shiftsQuery = useShiftsListQuery(
    {
      all: true,
      shiftScope: effectiveAssignKind === 'Internal' ? 'internal' : 'external',
    },
    { enabled: true, scope: 'dept-shift-templates' },
  );

  const listParams = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      shiftScope: mayPickInternal ? shiftScope : ('external' as const),
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [page, shiftScope, search, mayPickInternal],
  );

  /** GET /hrms/department-shifts?page=1&limit=8&shiftScope=all */
  const listQuery = useDepartmentShiftsListQuery(listParams, {
    enabled: true,
    scope: 'dept-shifts',
  });

  const assignMutation = useEnableDepartmentShiftMutation();
  const removeMutation = useRemoveDepartmentShiftMutation();

  const rows = useMemo(() => parseRows(listQuery.data), [listQuery.data]);
  const total = pickApiTotal(listQuery.data, rows.length);
  const pageCount = Math.max(
    1,
    extractTotalPages(listQuery.data) || Math.ceil(total / PAGE_LIMIT),
  );
  const rangeStart = rows.length > 0 ? (page - 1) * PAGE_LIMIT + 1 : 0;
  const rangeEnd = (page - 1) * PAGE_LIMIT + rows.length;

  const deptOptions = useMemo(() => {
    if (effectiveAssignKind !== 'Internal') {
      return [
        {
          value: '',
          label: '— Select department —',
        },
      ];
    }
    const base = pickApiItems(deptsQuery.data)
      .filter(isRecord)
      .map((r) => {
        const id = pickStr(r, ['id']);
        return id ? { value: id, label: pickStr(r, ['name']) || id } : null;
      })
      .filter((x): x is { value: string; label: string } => x !== null);
    return [
      {
        value: '',
        label: deptsQuery.isLoading
          ? 'Loading departments…'
          : '— Select department —',
      },
      ...base,
    ];
  }, [deptsQuery.data, deptsQuery.isLoading, effectiveAssignKind]);

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
    setDepartmentId('');
  }, [effectiveAssignKind]);

  useEffect(() => {
    setPage((p) => (p > pageCount ? pageCount : p));
  }, [pageCount]);

  const resetAssign = () => {
    setAssignDeptKind('Internal');
    setDepartmentId('');
    setShiftId('');
    setEffectiveFrom('');
    setEffectiveTo('');
    setOverrideWeek(false);
    setWorkingMask(HRMS_DEFAULT_WORKING_DAYS_MASK);
  };

  const handleAssign = async () => {
    if (!departmentId.trim()) {
      Alert.alert('Validation', 'Please select a department.');
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
        departmentId: departmentId.trim(),
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
              if (assignOpen && effectiveAssignKind === 'Internal') {
                void deptsQuery.refetch();
              }
            }}
            tintColor={accent}
          />
        } showsVerticalScrollIndicator={false}>
        <DashboardPageIntro subtitle="Default shifts for a department (applies to users without user/pool overrides).">
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
              accessibilityLabel="Assign shift"
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
                  Assign shift
                </Typography>
                <Typography variant="small" muted numberOfLines={2}>
                  Link a shift template to a department
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
            placeholder="Search by shift or department"
            filtersOpen={filtersOpen}
            onFilterPress={() => setFiltersOpen((v) => !v)}
            hasActiveFilters={
              shiftScope !== 'all' || Boolean(search.trim())
            }
          >
            {filtersOpen && mayPickInternal ? (
              <View style={{ gap: 12 }}>
                <SelectField
                  label="Shift scope"
                  value={shiftScope}
                  onChange={(v) => {
                    if (v === 'internal' || v === 'external' || v === 'all') {
                      setShiftScope(v);
                      setPage(1);
                    }
                  }}
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'internal', label: 'Internal' },
                    { value: 'external', label: 'External' },
                  ]}
 />
                {shiftScope !== 'all' || search.trim() ? (
                  <Button
                    size="compact"
                    variant="outlined"
                    onPress={() => {
                      setShiftScope('all');
                      setSearch('');
                      setSearchInput('');
                      setPage(1);
                    }}
                  >
                    Clear filters
                  </Button>
                ) : null}
              </View>
            ) : filtersOpen ? (
              <Typography variant="small" muted>
                Search by shift or department name.
              </Typography>
            ) : null}
          </FiltersSearchBar>
        </DashboardPageIntro>

        {listQuery.isError ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(
                listQuery.error,
                'Could not load department shifts.',
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
            subtitle="Search and filter department shift assignments. Use Assign shift to add new assignments."
            icon="time-outline"
            toolbar={null}
          >
            <DataCardGrid
              columns={1}
              isLoading={listQuery.isLoading && !listQuery.data}
              empty={!listQuery.isLoading && rows.length === 0}
              emptyState={{
                title: 'No shift assignments',
                description:
                  'No shift assignments found for the current filter.',
                icon: 'time-outline',
                action: (
                  <Button size="compact" onPress={() => setAssignOpen(true)}>
                    Assign shift
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
                  title={row.departmentName}
                  meta={row.shiftName}
                  details={[
                    { label: 'Department', value: row.departmentName },
                    { label: 'Shift', value: row.shiftName },
                    { label: 'Template', value: row.shiftTemplate },
                    { label: 'Working week', value: row.weekSummary },
                    { label: 'Effective from', value: row.effectiveFrom },
                    { label: 'Effective to', value: row.effectiveTo },
                  ]}
                  badgeLabel={row.shiftTemplate}
                  badgeTone={
                    row.shiftTemplate === 'Platform' ? 'internal' : 'neutral'
                  }
                  onDeletePress={() => setDeleteId(row.id)}
 />
              ))}
            </DataCardGrid>
          </ListTableCard>
        )}
      </ScrollView>

      <FormModal
        open={assignOpen}
        title="Assign shift to department"
        description="Pick department type (Internal or External), then department, shift, and dates."
        onClose={() => {
          if (assignMutation.isPending) return;
          setAssignOpen(false);
          resetAssign();
        }}
        onSave={() => void handleAssign()}
        primaryButtonLabel={
          assignMutation.isPending ? 'Saving…' : 'Assign'
        }
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
                setDepartmentId('');
              }}
              options={[
                { value: 'Internal', label: 'Internal' },
                { value: 'External', label: 'External' },
              ]}
 />
          ) : null}

          <SelectField
            label="Department"
            value={departmentId}
            onChange={setDepartmentId}
            options={deptOptions}
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
            <Typography variant="small" muted style={styles.weeklyLabel}>
              Weekly pattern override
            </Typography>
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
                  Inherits the shift template when off. Pool copies use the
                  same mask when enabled.
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
        description="This removes the department shift assignment."
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
  datesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateCol: { flex: 1, minWidth: 0 },
});
