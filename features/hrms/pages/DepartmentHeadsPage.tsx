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
  FilterButton,
  FiltersSearchBar,
  InputField,
  ListTableCard,
  SegmentedControl,
  SelectField,
  TablePagination,
  Typography,
} from '@/components/ui';
import { AssignDepartmentHeadModal } from '@/features/hrms/components/AssignDepartmentHeadModal';
import { extractApiErrorMessage } from '@/lib/api/errors';
import {
  sessionMayPickInternalUserScope,
  useAuth,
  type SessionScopeUser,
} from '@/lib/auth';
import {
  pickItemsArray,
  toIdNameOption,
} from '@/lib/companies/scope-tree-options';
import { resolveUserKind, type UserKind } from '@/lib/hrms/user-kind';
import {
  useDepartmentHeadsAttendanceQuery,
  useDepartmentHeadsListQuery,
  usePoolsListQuery,
  useRemoveDepartmentHeadMutation,
} from '@/lib/hooks/query/hrms';
import { useDepartmentsListQuery } from '@/lib/hooks/query/hrms/departments';
import {
  canManageDepartmentHeads,
  canRemoveDepartmentHead,
} from '@/lib/permissions';
import { pickApiItems, pickApiTotal } from '@/lib/utils/admin-list';
import { isRecord, pickNum, pickStr, unwrapApiData } from '@/lib/utils/core';
import { useAppTheme } from '@/theme';

const PAGE_SIZE = 20;
const ATTENDANCE_PAGE_SIZE = 12;

type HeadRow = {
  id: string;
  userName: string;
  userEmail: string;
  userType: UserKind;
  resellerName: string;
  parentCompanyName: string;
  departmentId: string;
  departmentName: string;
};

type AttendanceRow = {
  id: string;
  employeeName: string;
  userType: UserKind;
  resellerName: string;
  parentCompanyName: string;
  poolName: string;
  date: string;
  status: string;
  checkIn: string;
  checkOut: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function mapDepartmentHeadItem(
  r: Record<string, unknown>,
  idx: number,
): HeadRow | null {
  const assignmentId = pickStr(r, ['id']) || '';
  const user = isRecord(r.user) ? r.user : null;
  const dept = isRecord(r.department) ? r.department : null;
  const deptParentCompany =
    dept && isRecord(dept.parentCompany) ? dept.parentCompany : null;
  const deptReseller = dept && isRecord(dept.reseller) ? dept.reseller : null;
  const firstName = pickStr(user, ['firstName', 'first_name']) || '';
  const lastName = pickStr(user, ['lastName', 'last_name']) || '';
  const joinedName = `${firstName} ${lastName}`.replace(/\s+/g, ' ').trim();
  const name =
    joinedName ||
    pickStr(r, ['userName']) ||
    pickStr(user, ['name', 'fullName', 'userName']) ||
    '—';
  const email =
    pickStr(user, ['email']) || pickStr(r, ['userEmail', 'email']) || '—';
  const userType = resolveUserKind(
    pickStr(user, ['userType', 'type']) || pickStr(r, ['userType', 'user_type']),
    pickStr(dept, ['type']) || pickStr(r, ['departmentType']),
  );
  const resellerName =
    pickStr(r, ['resellerName']) || pickStr(deptReseller, ['name']) || '—';
  const parentCompanyName =
    pickStr(r, ['parentCompanyName']) ||
    pickStr(deptParentCompany, ['name']) ||
    '—';
  const departmentId = pickStr(dept, ['id']) || pickStr(r, ['departmentId']) || '';
  const departmentName =
    pickStr(dept, ['name']) || pickStr(r, ['departmentName']) || '—';
  const id = assignmentId || `dh-${idx}`;
  if (!id) return null;
  return {
    id,
    userName: name,
    userEmail: email,
    userType,
    resellerName,
    parentCompanyName,
    departmentId,
    departmentName,
  };
}

function parseRows(data: unknown): HeadRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r, idx) => mapDepartmentHeadItem(r, idx))
    .filter((x): x is HeadRow => x !== null);
}

function parseAttendanceRows(data: unknown): AttendanceRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((row, idx) => {
      const pick = (obj: Record<string, unknown> | null, keys: string[]) =>
        (obj ? pickStr(obj, keys) : '') || '';
      const id = pick(row, ['id', 'attendanceId']) || `dha-${idx}`;
      const userNested = isRecord(row.user) ? row.user : null;
      const first = pick(userNested ?? row, ['firstName']);
      const last = pick(userNested ?? row, ['lastName']);
      const joined = `${first} ${last}`.replace(/\s+/g, ' ').trim();
      const employeeName =
        joined ||
        pick(userNested ?? row, ['employeeName', 'userName', 'name']) ||
        '—';
      const rawType =
        pickStr(userNested, ['userType', 'type']) ||
        pickStr(row, ['userType', 'user_type']);
      const poolNested = isRecord(row.pool) ? row.pool : null;
      const userPoolNested =
        userNested && isRecord(userNested.pool) ? userNested.pool : null;
      const poolDepartment =
        (poolNested && isRecord(poolNested.department)
          ? poolNested.department
          : null) ??
        (userPoolNested && isRecord(userPoolNested.department)
          ? userPoolNested.department
          : null);
      const userType = resolveUserKind(rawType, pickStr(poolDepartment, ['type']));
      const poolReseller =
        poolDepartment && isRecord(poolDepartment.reseller)
          ? poolDepartment.reseller
          : null;
      const poolParentCompany =
        poolDepartment && isRecord(poolDepartment.parentCompany)
          ? poolDepartment.parentCompany
          : null;
      const userParentCompany =
        userNested && isRecord(userNested.parentCompany)
          ? userNested.parentCompany
          : null;
      const resellerName =
        pickStr(row, ['resellerName']) || pickStr(poolReseller, ['name']) || '—';
      const parentCompanyName =
        pickStr(row, ['parentCompanyName']) ||
        pickStr(userParentCompany, ['name']) ||
        pickStr(poolParentCompany, ['name']) ||
        '—';
      const poolName =
        pick(isRecord(poolNested) ? poolNested : userPoolNested ?? row, [
          'name',
          'poolName',
        ]) ||
        pick(row, ['poolName']) ||
        '—';
      return {
        id,
        employeeName,
        userType,
        resellerName,
        parentCompanyName,
        poolName,
        date: pick(row, ['date', 'day', 'attendanceDate']) || '—',
        status: pick(row, ['status']) || '—',
        checkIn: pick(row, ['checkIn', 'checkInTime', 'inTime', 'check_in']) || '—',
        checkOut:
          pick(row, ['checkOut', 'checkOutTime', 'outTime', 'check_out']) || '—',
      };
    });
}

function extractAttendanceTotalPages(data: unknown): number {
  const payload = unwrapApiData(data);
  if (!isRecord(payload)) return 1;
  const n = pickNum(payload, ['totalPages']);
  return n && n > 0 ? n : 1;
}

export function DepartmentHeadsPage() {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const { hasOperational, isPlatformAdmin, user: authUser } = useAuth();
  const mayPickInternal = useMemo(
    () =>
      sessionMayPickInternalUserScope(
        isPlatformAdmin,
        authUser as SessionScopeUser | null,
      ),
    [isPlatformAdmin, authUser],
  );
  const canAssign = canManageDepartmentHeads(hasOperational);
  const canRemove = canRemoveDepartmentHead(hasOperational);

  const [mode, setMode] = useState<'heads' | 'attendance'>('heads');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'Internal' | 'External' | ''>(
    mayPickInternal ? 'Internal' : 'External',
  );
  const [filterDepartmentId, setFilterDepartmentId] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(todayIso);
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendanceDepartmentId, setAttendanceDepartmentId] = useState('');
  const [attendanceFiltersOpen, setAttendanceFiltersOpen] = useState(false);

  /** Heads list: GET /hrms/departments?all=true&type=Internal (+ pools + heads). */
  const deptsQuery = useDepartmentsListQuery(
    { all: true, type: 'Internal' },
    {
      enabled: mode === 'heads' || mode === 'attendance',
      scope: 'department-heads-page',
    },
  );
  const poolsQuery = usePoolsListQuery(
    { all: true },
    { enabled: mode === 'heads', scope: 'department-heads-page' },
  );

  const headsParams = useMemo(() => {
    const params: Record<string, string | boolean | number> = { all: true };
    if (search.trim()) params.search = search.trim();
    if (filterType) params.type = filterType;
    if (filterDepartmentId.trim()) params.departmentId = filterDepartmentId.trim();
    return params;
  }, [search, filterType, filterDepartmentId]);

  const query = useDepartmentHeadsListQuery(headsParams, {
    enabled: mode === 'heads',
    scope: 'department-heads-page',
  });

  /** Attendance: GET /hrms/department-heads/attendance?page=1&limit=12&date=… */
  const attendanceParams = useMemo(() => {
    const params: {
      page: number;
      limit: number;
      date?: string;
      departmentId?: string;
    } = {
      page: attendancePage,
      limit: ATTENDANCE_PAGE_SIZE,
    };
    if (attendanceDate.trim()) params.date = attendanceDate.trim();
    if (attendanceDepartmentId.trim()) {
      params.departmentId = attendanceDepartmentId.trim();
    }
    return params;
  }, [attendancePage, attendanceDate, attendanceDepartmentId]);

  const attendanceQuery = useDepartmentHeadsAttendanceQuery(attendanceParams, {
    enabled: mode === 'attendance',
    scope: 'department-heads-attendance',
  });

  const removeMutation = useRemoveDepartmentHeadMutation();

  const allRows = useMemo(() => parseRows(query.data), [query.data]);
  const total = pickApiTotal(query.data, allRows.length);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const rows = useMemo(() => {
    if (total > allRows.length) return allRows;
    const start = (page - 1) * PAGE_SIZE;
    return allRows.slice(start, start + PAGE_SIZE);
  }, [allRows, page, total]);

  const attendanceRows = useMemo(
    () => parseAttendanceRows(attendanceQuery.data),
    [attendanceQuery.data],
  );
  const attendanceTotal = pickApiTotal(attendanceQuery.data, attendanceRows.length);
  const attendancePageCount = Math.max(
    1,
    extractAttendanceTotalPages(attendanceQuery.data) ||
      Math.ceil(attendanceTotal / ATTENDANCE_PAGE_SIZE),
  );
  const attendanceFrom =
    attendanceTotal === 0 ? 0 : (attendancePage - 1) * ATTENDANCE_PAGE_SIZE + 1;
  const attendanceTo = Math.min(
    (attendancePage - 1) * ATTENDANCE_PAGE_SIZE + attendanceRows.length,
    attendanceTotal,
  );

  const departmentFilterOptions = useMemo(() => {
    const options = pickItemsArray(deptsQuery.data)
      .map((row) => toIdNameOption(row))
      .filter((o): o is { value: string; label: string } => o !== null);
    const all = { value: '', label: 'All departments' };
    if (options.length > 0) return [all, ...options];
    return [
      {
        value: '',
        label: deptsQuery.isLoading ? 'Loading departments…' : 'No departments',
      },
    ];
  }, [deptsQuery.data, deptsQuery.isLoading]);

  const attendanceDepartmentOptions = useMemo(() => {
    const options = pickItemsArray(deptsQuery.data)
      .map((row) => toIdNameOption(row))
      .filter((o): o is { value: string; label: string } => o !== null);
    return [
      {
        value: '',
        label: deptsQuery.isLoading
          ? 'Loading departments…'
          : '— Select department —',
      },
      ...options,
    ];
  }, [deptsQuery.data, deptsQuery.isLoading]);

  const typeFilterOptions = useMemo(
    () =>
      mayPickInternal
        ? [
            { value: '', label: 'All types' },
            { value: 'Internal', label: 'Internal' },
            { value: 'External', label: 'External' },
          ]
        : [{ value: 'External', label: 'External' }],
    [mayPickInternal],
  );

  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(filterDepartmentId.trim()) ||
    (mayPickInternal && filterType !== 'Internal' && Boolean(filterType));

  const attendanceFiltersActive =
    Boolean(attendanceDepartmentId.trim()) || attendanceDate !== todayIso();

  useEffect(() => {
    if (searchInput.trim().length > 0) return;
    if (!search.trim()) return;
    setSearch('');
    setPage(1);
  }, [searchInput, search]);

  useEffect(() => {
    setPage(1);
  }, [search, filterType, filterDepartmentId]);

  useEffect(() => {
    setAttendancePage(1);
  }, [attendanceDate, attendanceDepartmentId]);

  useEffect(() => {
    setAttendancePage((p) => (p > attendancePageCount ? attendancePageCount : p));
  }, [attendancePageCount]);

  const listRefreshing =
    mode === 'attendance'
      ? attendanceQuery.isRefetching && !attendanceQuery.isLoading
      : query.isRefetching && !query.isLoading;

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={listRefreshing}
            onRefresh={() => {
              void deptsQuery.refetch();
              if (mode === 'attendance') {
                void attendanceQuery.refetch();
              } else {
                void poolsQuery.refetch();
                void query.refetch();
              }
            }}
            tintColor={accent}
          />
        } showsVerticalScrollIndicator={false}>
        <DashboardPageIntro subtitle="Assign and manage department heads (Internal / External). View attendance across pools in a department.">
          <View style={styles.topActions}>
            <SegmentedControl
              style={{ flex: 1 }}
              options={[
                { label: 'Heads', value: 'heads' },
                { label: 'Attendance', value: 'attendance' },
              ]}
              value={mode}
              onChange={(v) => setMode(v === 'attendance' ? 'attendance' : 'heads')}
 />
            {canAssign && mode === 'heads' ? (
              <Pressable
                onPress={() => setModalOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Assign head"
                style={({ pressed }) => [
                  styles.assignBtn,
                  {
                    backgroundColor: accent,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Typography variant="small" color="#FFFFFF" style={{ fontWeight: '700' }}>
                  Assign head
                </Typography>
              </Pressable>
            ) : null}
          </View>

          {mode === 'heads' ? (
            <FiltersSearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSearch={() => {
                setSearch(searchInput.trim());
                setPage(1);
              }}
              placeholder="Name, email, department, reseller…"
              filtersOpen={filtersOpen}
              onFilterPress={() => setFiltersOpen((v) => !v)}
              hasActiveFilters={hasActiveFilters}
            >
              {filtersOpen ? (
                <View style={{ gap: 12 }}>
                  {mayPickInternal ? (
                    <SelectField
                      label="Type"
                      value={filterType}
                      onChange={(v) =>
                        setFilterType(
                          v === 'Internal' || v === 'External' ? v : '',
                        )
                      }
                      options={typeFilterOptions}
 />
                  ) : null}
                  <SelectField
                    label="Department"
                    value={filterDepartmentId}
                    onChange={setFilterDepartmentId}
                    options={departmentFilterOptions}
                    placeholder="All departments"
 />
                  {hasActiveFilters ? (
                    <Button
                      size="compact"
                      variant="outlined"
                      onPress={() => {
                        setFilterType(mayPickInternal ? 'Internal' : 'External');
                        setFilterDepartmentId('');
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
          ) : (
            <View
              style={[
                styles.attendanceFilterCard,
                {
                  borderColor: theme.app.dashboard.cardBorder,
                  backgroundColor: theme.app.dashboard.overlayLight,
                },
              ]}
            >
              <View style={styles.attendanceFilterHeader}>
                <Typography variant="small" muted style={{ flex: 1 }}>
                  Use Filter: pick department and date for attendance.
                </Typography>
                <FilterButton
                  active={attendanceFiltersOpen || attendanceFiltersActive}
                  onPress={() => setAttendanceFiltersOpen((v) => !v)}
 />
              </View>
              {attendanceFiltersOpen ? (
                <View style={{ gap: 12, paddingTop: 4 }}>
                  <SelectField
                    label="Department"
                    value={attendanceDepartmentId}
                    onChange={setAttendanceDepartmentId}
                    options={attendanceDepartmentOptions}
                    placeholder="— Select department —"
 />
                  <InputField
                    label="Date (UTC)"
                    value={attendanceDate}
                    onChangeText={setAttendanceDate}
                    placeholder={todayIso()}
                    autoCapitalize="none"
 />
                  <Button
                    size="compact"
                    variant="outlined"
                    onPress={() => setAttendanceDate(todayIso())}
                  >
                    Today
                  </Button>
                  {attendanceFiltersActive ? (
                    <Button
                      size="compact"
                      variant="outlined"
                      onPress={() => {
                        setAttendanceDepartmentId('');
                        setAttendanceDate(todayIso());
                        setAttendancePage(1);
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : null}
                </View>
              ) : null}
            </View>
          )}
        </DashboardPageIntro>

        {mode === 'attendance' ? (
          attendanceQuery.isError ? (
            <AppCard style={{ gap: 10 }}>
              <Typography variant="medium" color={theme.app.danger}>
                {extractApiErrorMessage(
                  attendanceQuery.error,
                  'Could not load department attendance.',
                )}
              </Typography>
              <Button
                size="compact"
                variant="outlined"
                onPress={() => void attendanceQuery.refetch()}
              >
                Retry
              </Button>
            </AppCard>
          ) : (
            <ListTableCard
              title="Department attendance"
              subtitle="Use Filter: pick Internal / External / All for departments API, then department and optional pool."
              icon="time-outline"
              toolbar={null}
            >
              <DataCardGrid
                columns={1}
                isLoading={attendanceQuery.isLoading && !attendanceQuery.data}
                empty={!attendanceQuery.isLoading && attendanceRows.length === 0}
                emptyState={{
                  title: 'No records yet',
                  description: 'There is no data available for the current filter.',
                  icon: 'time-outline',
                }}
                showingLabel={`Showing data ${attendanceFrom} to ${attendanceTo} of ${attendanceTotal} entries`}
                footerRight={
                  <TablePagination
                    page={attendancePage}
                    pageCount={attendancePageCount}
                    onPageChange={setAttendancePage}
 />
                }
              >
                {attendanceRows.map((row) => (
                  <EntityListCard
                    key={row.id}
                    title={row.employeeName}
                    details={[
                      {
                        label: 'Type',
                        value: row.userType === '—' ? '—' : row.userType,
                      },
                      { label: 'Reseller', value: row.resellerName },
                      { label: 'Parent company', value: row.parentCompanyName },
                      { label: 'Pool', value: row.poolName },
                      { label: 'Date (UTC)', value: row.date },
                      { label: 'Status', value: row.status },
                      { label: 'Check-in', value: row.checkIn },
                      { label: 'Check-out', value: row.checkOut },
                    ]}
 />
                ))}
              </DataCardGrid>
            </ListTableCard>
          )
        ) : query.isError ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(
                query.error,
                'Could not load department heads.',
              )}
            </Typography>
            <Button size="compact" variant="outlined" onPress={() => void query.refetch()}>
              Retry
            </Button>
          </AppCard>
        ) : (
          <ListTableCard
            title="Department head assignments"
            subtitle="Use Filter for list scope. Search applies after you press Search."
            icon="person-outline"
            toolbar={null}
          >
            <DataCardGrid
              columns={1}
              isLoading={query.isLoading && !query.data}
              empty={!query.isLoading && rows.length === 0}
              emptyState={{
                title: 'No department heads',
                description: 'Assign a head user for each department.',
                icon: 'person-outline',
                action: canAssign ? (
                  <Button size="compact" onPress={() => setModalOpen(true)}>
                    Assign head
                  </Button>
                ) : undefined,
              }}
              showingLabel={
                rows.length > 0
                  ? `Showing data ${from} to ${to} of ${total} entries`
                  : undefined
              }
              footerRight={
                <TablePagination page={page} pageCount={pageCount} onPageChange={setPage} />
              }
            >
              {rows.map((row) => (
                <EntityListCard
                  key={row.id}
                  title={row.userName}
                  details={[
                    { label: 'Type', value: row.userType === '—' ? '—' : row.userType },
                    { label: 'Email', value: row.userEmail },
                    { label: 'Reseller', value: row.resellerName },
                    { label: 'Parent company', value: row.parentCompanyName },
                    { label: 'Department', value: row.departmentName },
                  ]}
                  onDeletePress={canRemove ? () => setDeleteId(row.id) : undefined}
 />
              ))}
            </DataCardGrid>
          </ListTableCard>
        )}
      </ScrollView>

      <AssignDepartmentHeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => void query.refetch()}
 />

      <ConfirmActionModal
        open={Boolean(deleteId)}
        title="Remove department head?"
        description="This user will no longer be the department head."
        confirmLabel="Remove"
        confirmButtonVariant="danger"
        isLoading={removeMutation.isPending}
        onDismiss={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await removeMutation.mutateAsync(deleteId);
            setDeleteId(null);
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
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  attendanceFilterCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  attendanceFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
