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
import { AssignPoolHeadModal } from '@/features/hrms/components/AssignPoolHeadModal';
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
  usePoolHeadsAttendanceQuery,
  usePoolHeadsListQuery,
  usePoolsListQuery,
  useRemovePoolHeadMutation,
} from '@/lib/hooks/query/hrms';
import { useDepartmentsListQuery } from '@/lib/hooks/query/hrms/departments';
import {
  canManagePoolHeads,
  canRemovePoolHead,
} from '@/lib/permissions';
import { pickApiItems, pickApiTotal } from '@/lib/utils/admin-list';
import { isRecord, pickNum, pickStr, unwrapApiData } from '@/lib/utils/core';
import { useAppTheme } from '@/theme';

/** Network parity: GET /hrms/pool-heads?page=1&limit=12&all=false */
const PAGE_LIMIT = 12;

type HeadRow = {
  id: string;
  userName: string;
  userEmail: string;
  userType: UserKind;
  resellerName: string;
  parentCompanyName: string;
  departmentId: string;
  departmentName: string;
  designationName: string;
  poolId: string;
  poolName: string;
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

function mapPoolHeadItem(
  r: Record<string, unknown>,
  idx: number,
): HeadRow | null {
  const assignmentId = pickStr(r, ['id']) || '';
  const user = isRecord(r.user) ? r.user : null;
  const pool = isRecord(r.pool) ? r.pool : null;
  const poolDepartment =
    pool && isRecord(pool.department) ? pool.department : null;
  const poolReseller =
    poolDepartment && isRecord(poolDepartment.reseller)
      ? poolDepartment.reseller
      : null;
  const poolParentCompany =
    poolDepartment && isRecord(poolDepartment.parentCompany)
      ? poolDepartment.parentCompany
      : null;
  const userDepartment =
    user && isRecord(user.department) ? user.department : null;
  const userDesignation =
    user && isRecord(user.designation) ? user.designation : null;
  const userParentCompany =
    user && isRecord(user.parentCompany) ? user.parentCompany : null;
  const dept =
    (isRecord(r.department) ? r.department : null) ??
    poolDepartment ??
    userDepartment;

  const firstName = pickStr(user, ['firstName', 'first_name']) || '';
  const middleName = pickStr(user, ['middleName', 'middle_name']) || '';
  const lastName = pickStr(user, ['lastName', 'last_name']) || '';
  const joinedName = `${firstName} ${middleName} ${lastName}`
    .replace(/\s+/g, ' ')
    .trim();
  const userName =
    joinedName ||
    pickStr(user, ['name', 'fullName', 'userName']) ||
    pickStr(r, ['userName', 'name']) ||
    '—';
  const userEmail =
    pickStr(user, ['email']) || pickStr(r, ['userEmail', 'email']) || '—';
  const rawType =
    pickStr(user, ['userType', 'type', 'user_type']) ||
    pickStr(r, ['userType', 'user_type']);
  const deptType =
    pickStr(poolDepartment, ['type']) ||
    pickStr(dept, ['type']) ||
    pickStr(r, ['departmentType']);
  const userType = resolveUserKind(rawType, deptType);
  const resellerName =
    pickStr(r, ['resellerName']) ||
    pickStr(poolReseller, ['name']) ||
    pickStr(poolDepartment, ['resellerName']) ||
    '—';
  const parentCompanyName =
    pickStr(r, ['parentCompanyName', 'userParentCompanyName']) ||
    pickStr(user, ['parentCompanyName']) ||
    pickStr(userParentCompany, ['name']) ||
    pickStr(poolParentCompany, ['name']) ||
    pickStr(poolDepartment, ['parentCompanyName']) ||
    '—';
  const poolId = pickStr(pool, ['id']) || pickStr(r, ['poolId']) || '';
  const poolName = pickStr(pool, ['name']) || pickStr(r, ['poolName']) || '—';
  const departmentId =
    pickStr(dept, ['id']) ||
    pickStr(r, ['departmentId', 'poolDepartmentId']) ||
    '';
  const departmentName =
    pickStr(dept, ['name']) ||
    pickStr(r, ['departmentName', 'poolDepartmentName']) ||
    '—';
  const designationName =
    pickStr(r, ['userDesignationName', 'designationName']) ||
    pickStr(userDesignation, ['name', 'title']) ||
    pickStr(user, ['designationName', 'designation']) ||
    '—';
  const id = assignmentId || `ph-${idx}`;
  if (!id) return null;
  return {
    id,
    userName,
    userEmail,
    userType,
    resellerName,
    parentCompanyName,
    departmentId,
    departmentName,
    designationName,
    poolId,
    poolName,
  };
}

function parseRows(data: unknown): HeadRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r, idx) => mapPoolHeadItem(r, idx))
    .filter((x): x is HeadRow => x !== null);
}

function parseAttendanceRows(data: unknown): AttendanceRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((row, idx) => {
      const pick = (obj: Record<string, unknown> | null, keys: string[]) =>
        (obj ? pickStr(obj, keys) : '') || '';
      const id = pick(row, ['id', 'attendanceId']) || `pha-${idx}`;
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
      const userType = resolveUserKind(
        rawType,
        pickStr(poolDepartment, ['type']),
      );
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

function extractTotalPages(data: unknown): number {
  const payload = unwrapApiData(data);
  if (!isRecord(payload)) return 1;
  const n = pickNum(payload, ['totalPages']);
  return n && n > 0 ? n : 1;
}

export function PoolHeadsPage() {
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
  const canAssign = canManagePoolHeads(hasOperational);
  const canRemove = canRemovePoolHead(hasOperational);

  const [mode, setMode] = useState<'heads' | 'attendance'>('heads');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterDepartmentId, setFilterDepartmentId] = useState('');
  const [filterPoolId, setFilterPoolId] = useState('');
  const [headsUserTypeFilter, setHeadsUserTypeFilter] = useState<
    'all' | 'Internal' | 'External'
  >('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(todayIso);
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendancePoolId, setAttendancePoolId] = useState('');
  const [attendanceMemberName, setAttendanceMemberName] = useState('');
  const [attendanceFiltersOpen, setAttendanceFiltersOpen] = useState(false);

  /** GET /hrms/departments?all=true&type=Internal */
  const deptsQuery = useDepartmentsListQuery(
    { all: true, type: 'Internal' },
    { enabled: true, scope: 'pool-heads-page' },
  );

  /** GET /hrms/pools?all=true&departmentType=Internal */
  const poolsQuery = usePoolsListQuery(
    { all: true, departmentType: 'Internal' },
    { enabled: true, scope: 'pool-heads-page' },
  );

  /** Department without pool: client-side page (API has no departmentId on list). */
  const poolHeadsClientPaging = Boolean(
    filterDepartmentId.trim() && !filterPoolId.trim(),
  );

  /** GET /hrms/pool-heads?page=1&limit=12&all=false */
  const listParams = useMemo(() => {
    if (mode !== 'heads') return undefined;
    if (filterPoolId.trim()) {
      return {
        page,
        limit: PAGE_LIMIT,
        poolId: filterPoolId.trim(),
        all: false as const,
      };
    }
    if (filterDepartmentId.trim()) return { all: true as const };
    return { page, limit: PAGE_LIMIT, all: false as const };
  }, [mode, page, filterPoolId, filterDepartmentId]);

  const query = usePoolHeadsListQuery(listParams, {
    enabled: mode === 'heads' && listParams != null,
    scope: 'pool-heads-list',
  });

  const attendanceParams = useMemo(() => {
    if (mode !== 'attendance') return undefined;
    const date = attendanceDate.trim() || todayIso();
    return {
      page: attendancePage,
      limit: PAGE_LIMIT,
      date,
      ...(attendancePoolId.trim() ? { poolId: attendancePoolId.trim() } : {}),
      ...(attendanceMemberName.trim()
        ? { memberName: attendanceMemberName.trim() }
        : {}),
    };
  }, [
    mode,
    attendancePage,
    attendancePoolId,
    attendanceDate,
    attendanceMemberName,
  ]);

  const attendanceQuery = usePoolHeadsAttendanceQuery(attendanceParams, {
    enabled: mode === 'attendance',
    scope: 'pool-heads-attendance',
  });

  const removeMutation = useRemovePoolHeadMutation();

  const mappedHeadRows = useMemo(
    () => parseRows(query.data),
    [query.data],
  );

  const scopedHeadRows = useMemo(() => {
    const d = filterDepartmentId.trim();
    let rows = mappedHeadRows;
    if (d) rows = rows.filter((r) => r.departmentId === d);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) => {
        const hay =
          `${r.userName} ${r.userEmail} ${r.poolName} ${r.departmentName} ${r.designationName} ${r.resellerName} ${r.parentCompanyName}`.toLowerCase();
        return hay.includes(q);
      });
    }
    if (headsUserTypeFilter !== 'all') {
      rows = rows.filter((r) => r.userType === headsUserTypeFilter);
    }
    return rows;
  }, [
    mappedHeadRows,
    filterDepartmentId,
    search,
    headsUserTypeFilter,
  ]);

  const rows = useMemo(() => {
    if (!poolHeadsClientPaging) return scopedHeadRows;
    const start = (page - 1) * PAGE_LIMIT;
    return scopedHeadRows.slice(start, start + PAGE_LIMIT);
  }, [poolHeadsClientPaging, scopedHeadRows, page]);

  const total = useMemo(() => {
    if (poolHeadsClientPaging || search.trim() || headsUserTypeFilter !== 'all') {
      return scopedHeadRows.length;
    }
    return pickApiTotal(query.data, scopedHeadRows.length);
  }, [
    poolHeadsClientPaging,
    search,
    headsUserTypeFilter,
    scopedHeadRows.length,
    query.data,
  ]);

  const pageCount = useMemo(() => {
    if (poolHeadsClientPaging || search.trim() || headsUserTypeFilter !== 'all') {
      return Math.max(1, Math.ceil(scopedHeadRows.length / PAGE_LIMIT));
    }
    return Math.max(1, extractTotalPages(query.data));
  }, [
    poolHeadsClientPaging,
    search,
    headsUserTypeFilter,
    scopedHeadRows.length,
    query.data,
  ]);

  const from = rows.length > 0 ? (page - 1) * PAGE_LIMIT + 1 : 0;
  const to = (page - 1) * PAGE_LIMIT + rows.length;

  const attendanceRows = useMemo(
    () => parseAttendanceRows(attendanceQuery.data),
    [attendanceQuery.data],
  );
  const attendanceTotal = pickApiTotal(
    attendanceQuery.data,
    attendanceRows.length,
  );
  const attendancePageCount = Math.max(
    1,
    extractTotalPages(attendanceQuery.data) ||
      Math.ceil(attendanceTotal / PAGE_LIMIT),
  );
  const attendanceFrom =
    attendanceRows.length > 0
      ? (attendancePage - 1) * PAGE_LIMIT + 1
      : 0;
  const attendanceTo =
    (attendancePage - 1) * PAGE_LIMIT + attendanceRows.length;

  const departmentFilterOptions = useMemo(() => {
    const options = pickItemsArray(deptsQuery.data)
      .map((row) => toIdNameOption(row))
      .filter((o): o is { value: string; label: string } => o !== null);
    return [
      {
        value: '',
        label: deptsQuery.isLoading
          ? 'Loading departments…'
          : '— All departments —',
      },
      ...options,
    ];
  }, [deptsQuery.data, deptsQuery.isLoading]);

  const poolFilterOptions = useMemo(() => {
    const options = pickApiItems(poolsQuery.data)
      .filter(isRecord)
      .map((r) => {
        const id = pickStr(r, ['id']);
        if (!id) return null;
        return {
          value: id,
          label: pickStr(r, ['name', 'poolName']) || id,
        };
      })
      .filter((x): x is { value: string; label: string } => x !== null);
    return [
      {
        value: '',
        label: poolsQuery.isLoading ? 'Loading pools…' : '— All pools —',
      },
      ...options,
    ];
  }, [poolsQuery.data, poolsQuery.isLoading]);

  const headsUserTypeOptions = useMemo(
    () =>
      mayPickInternal
        ? [
            { value: 'all', label: 'All' },
            { value: 'Internal', label: 'Internal' },
            { value: 'External', label: 'External' },
          ]
        : [
            { value: 'all', label: 'All' },
            { value: 'External', label: 'External' },
          ],
    [mayPickInternal],
  );

  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(filterDepartmentId.trim()) ||
    Boolean(filterPoolId.trim()) ||
    headsUserTypeFilter !== 'all';

  const attendanceFiltersActive =
    Boolean(attendancePoolId.trim()) ||
    Boolean(attendanceMemberName.trim()) ||
    attendanceDate !== todayIso();

  useEffect(() => {
    if (searchInput.trim().length > 0) return;
    if (!search.trim()) return;
    setSearch('');
    setPage(1);
  }, [searchInput, search]);

  useEffect(() => {
    setPage(1);
  }, [search, filterDepartmentId, filterPoolId, headsUserTypeFilter]);

  useEffect(() => {
    setAttendancePage(1);
  }, [attendanceDate, attendancePoolId, attendanceMemberName]);

  useEffect(() => {
    if (mode !== 'attendance') {
      setAttendanceFiltersOpen(false);
      return;
    }
    setAttendancePage(1);
    setAttendanceDate(todayIso());
  }, [mode]);

  useEffect(() => {
    setPage((p) => (p > pageCount ? pageCount : p));
  }, [pageCount]);

  useEffect(() => {
    setAttendancePage((p) =>
      p > attendancePageCount ? attendancePageCount : p,
    );
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
              void poolsQuery.refetch();
              if (mode === 'attendance') {
                void attendanceQuery.refetch();
              } else {
                void query.refetch();
              }
            }}
            tintColor={accent}
          />
        } showsVerticalScrollIndicator={false}>
        <DashboardPageIntro subtitle="Assign pool heads, remove assignments, and view pool team attendance (head plus members) from the HRMS APIs.">
          <View style={styles.topActions}>
            <SegmentedControl
              style={{ flex: 1 }}
              options={[
                { label: 'Heads', value: 'heads' },
                { label: 'Team attendance', value: 'attendance' },
              ]}
              value={mode}
              onChange={(v) =>
                setMode(v === 'attendance' ? 'attendance' : 'heads')
              }
 />
            {canAssign && mode === 'heads' ? (
              <Pressable
                onPress={() => setModalOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Assign Pool Head"
                style={({ pressed }) => [
                  styles.assignBtn,
                  {
                    backgroundColor: accent,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Typography
                  variant="small"
                  color="#FFFFFF"
                  style={{ fontWeight: '700' }}
                >
                  Assign Pool Head
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
              placeholder="Name, email, pool, department…"
              filtersOpen={filtersOpen}
              onFilterPress={() => setFiltersOpen((v) => !v)}
              hasActiveFilters={hasActiveFilters}
            >
              {filtersOpen ? (
                <View style={{ gap: 12 }}>
                  <SelectField
                    label="Department"
                    value={filterDepartmentId}
                    onChange={(v) => {
                      setFilterDepartmentId(v);
                      setFilterPoolId('');
                    }}
                    options={departmentFilterOptions}
 />
                  <SelectField
                    label="Pool"
                    value={filterPoolId}
                    onChange={setFilterPoolId}
                    options={poolFilterOptions}
 />
                  <SelectField
                    label="User type"
                    value={headsUserTypeFilter}
                    onChange={(v) =>
                      setHeadsUserTypeFilter(
                        v === 'Internal' || v === 'External' ? v : 'all',
                      )
                    }
                    options={headsUserTypeOptions}
 />
                  {hasActiveFilters ? (
                    <Button
                      size="compact"
                      variant="outlined"
                      onPress={() => {
                        setFilterDepartmentId('');
                        setFilterPoolId('');
                        setHeadsUserTypeFilter('all');
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
          ) : null}
        </DashboardPageIntro>

        {mode === 'attendance' ? (
          attendanceQuery.isError ? (
            <AppCard style={{ gap: 10 }}>
              <Typography variant="medium" color={theme.app.danger}>
                {extractApiErrorMessage(
                  attendanceQuery.error,
                  'Could not load pool team attendance.',
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
              title="Pool team attendance"
              subtitle="Use Filter to narrow department, pool, and (for attendance) member or date. Heads table can also filter by user type."
              icon="time-outline"
              toolbar={
                <FilterButton
                  active={attendanceFiltersOpen || attendanceFiltersActive}
                  onPress={() => setAttendanceFiltersOpen((v) => !v)}
 />
              }
            >
              {attendanceFiltersOpen ? (
                <View
                  style={[
                    styles.attendanceFilterPanel,
                    {
                      borderColor: theme.app.dashboard.cardBorder,
                      backgroundColor: theme.app.dashboard.overlayLight,
                    },
                  ]}
                >
                  <SelectField
                    label="Pool"
                    value={attendancePoolId}
                    onChange={setAttendancePoolId}
                    options={poolFilterOptions}
 />
                  <InputField
                    label="Member name"
                    value={attendanceMemberName}
                    onChangeText={setAttendanceMemberName}
                    placeholder="Optional"
                    autoCapitalize="none"
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
                        setAttendancePoolId('');
                        setAttendanceMemberName('');
                        setAttendanceDate(todayIso());
                        setAttendancePage(1);
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : null}
                </View>
              ) : null}
              <DataCardGrid
                columns={1}
                isLoading={
                  attendanceQuery.isLoading && !attendanceQuery.data
                }
                empty={
                  !attendanceQuery.isLoading && attendanceRows.length === 0
                }
                emptyState={{
                  title: 'No records yet',
                  description:
                    'There is no data available for the current filter.',
                  icon: 'time-outline',
                }}
                showingLabel={`Showing data ${attendanceFrom} to ${attendanceTo} of ${attendanceTotal} entries${
                  attendancePoolId.trim()
                    ? ''
                    : ' (members in pools you head — select a pool to narrow)'
                }`}
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
                      {
                        label: 'Parent company',
                        value: row.parentCompanyName,
                      },
                      { label: 'Member', value: row.employeeName },
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
                'Could not load pool heads.',
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
            title="Pool head assignments"
            subtitle="Use Filter to narrow department, pool, and (for attendance) member or date. Heads table can also filter by user type."
            icon="person-outline"
            toolbar={null}
          >
            <DataCardGrid
              columns={1}
              isLoading={query.isLoading && !query.data}
              empty={!query.isLoading && rows.length === 0}
              emptyState={{
                title: 'No pool heads',
                description: 'Assign a head user for each pool.',
                icon: 'person-outline',
                action: canAssign ? (
                  <Button
                    size="compact"
                    onPress={() => setModalOpen(true)}
                  >
                    Assign Pool Head
                  </Button>
                ) : undefined,
              }}
              showingLabel={
                rows.length > 0
                  ? `Showing data ${from} to ${to} of ${total} entries${
                      !filterPoolId.trim()
                        ? ' (all pools in your access scope when pool is not selected)'
                        : ''
                    }`
                  : undefined
              }
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
                  title={row.userName}
                  details={[
                    {
                      label: 'Type',
                      value: row.userType === '—' ? '—' : row.userType,
                    },
                    { label: 'Email', value: row.userEmail },
                    { label: 'Reseller', value: row.resellerName },
                    {
                      label: 'Parent company',
                      value: row.parentCompanyName,
                    },
                    { label: 'Department', value: row.departmentName },
                    { label: 'Designation', value: row.designationName },
                    { label: 'Pool', value: row.poolName },
                  ]}
                  onDeletePress={
                    canRemove ? () => setDeleteId(row.id) : undefined
                  }
 />
              ))}
            </DataCardGrid>
          </ListTableCard>
        )}
      </ScrollView>

      <AssignPoolHeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => void query.refetch()}
 />

      <ConfirmActionModal
        open={Boolean(deleteId)}
        title="Remove pool head?"
        description="This user will no longer be the pool head."
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
  attendanceFilterPanel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 12,
    marginBottom: 12,
  },
});
