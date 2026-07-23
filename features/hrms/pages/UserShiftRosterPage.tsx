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
  Button,
  ConfirmActionModal,
  DataCardGrid,
  EntityListCard,
  FiltersSearchBar,
  ListTableCard,
  TablePagination,
  Typography,
  UserTypeBadge,
} from '@/components/ui';
import { UserShiftAssignModal } from '@/features/hrms/components/UserShiftAssignModal';
import { extractApiErrorMessage } from '@/lib/api/errors';
import {
  useCreateUserShiftAssignmentMutation,
  useRemoveUserShiftAssignmentMutation,
  useShiftsListQuery,
  useUserShiftAssignmentsListQuery,
} from '@/lib/hooks/query/hrms';
import { useUsersListQuery } from '@/lib/hooks/query/users';
import { pickApiItems, pickApiTotal } from '@/lib/utils/admin-list';
import {
  addMonths,
  daysInMonth,
  formatIsoDate,
  isRecord,
  pickNum,
  pickStr,
  startOfMonth,
  toIsoDateString,
  unwrapApiData,
} from '@/lib/utils/core';
import {
  clampWorkingDaysMask,
  effectiveWorkingDaysMask,
  formatWorkingDaysMaskHuman,
  HRMS_DEFAULT_WORKING_DAYS_MASK,
} from '@/lib/utils/hrms/shift-working-days';
import { useAppTheme } from '@/theme';

const USERS_PAGE_LIMIT = 50;
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

type UserType = 'Internal' | 'External';

type UserListRow = {
  id: string;
  name: string;
  email: string;
  type: UserType;
  resellerName: string;
  parentCompanyName: string;
};

type AssignmentRow = {
  id: string;
  shiftName: string;
  weekSummary: string;
  effectiveFrom: string;
  effectiveTo: string;
};

type CalendarCell = {
  key: string;
  day: number | null;
  iso: string | null;
};

function mapUserType(obj: Record<string, unknown> | null): UserType {
  if (!obj) return 'External';
  if (typeof obj.isInternal === 'boolean') {
    return obj.isInternal ? 'Internal' : 'External';
  }
  const picked = pickStr(obj, ['userType', 'type', 'user_type']).toLowerCase();
  if (picked === 'internal') return 'Internal';
  return 'External';
}

function parseUsers(data: unknown): UserListRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r) => {
      const id = pickStr(r, ['id']);
      if (!id) return null;
      const first = pickStr(r, ['firstName']);
      const last = pickStr(r, ['lastName']);
      const name =
        `${first} ${last}`.replace(/\s+/g, ' ').trim() ||
        pickStr(r, ['name', 'fullName', 'email']) ||
        '—';
      const reseller = isRecord(r.reseller) ? r.reseller : null;
      const parent = isRecord(r.parentCompany)
        ? r.parentCompany
        : isRecord(r.company)
          ? r.company
          : null;
      const type = mapUserType(r);
      return {
        id,
        name,
        email: pickStr(r, ['email']) || '—',
        type,
        resellerName:
          type === 'Internal'
            ? '—'
            : pickStr(reseller, ['name']) || pickStr(r, ['resellerName']) || '—',
        parentCompanyName:
          type === 'Internal'
            ? '—'
            : pickStr(parent, ['name']) ||
              pickStr(r, ['parentCompanyName', 'companyName']) ||
              '—',
      };
    })
    .filter((x): x is UserListRow => x !== null);
}

function parseAssignments(data: unknown): AssignmentRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r) => {
      const id = pickStr(r, ['id']);
      if (!id) return null;
      const shift = isRecord(r.shift) ? r.shift : null;
      const assignMask = r.workingDaysMask ?? r.working_days_mask;
      const tmplMask = pickNum(shift, ['workingDaysMask', 'working_days_mask']);
      const mask = effectiveWorkingDaysMask(assignMask, tmplMask);
      const inherited =
        assignMask == null ||
        assignMask === '' ||
        !Number.isFinite(Number(assignMask));
      return {
        id,
        shiftName: pickStr(shift, ['name']) || pickStr(r, ['shiftName']) || '—',
        weekSummary: inherited
          ? `Inherited (${formatWorkingDaysMaskHuman(mask)})`
          : formatWorkingDaysMaskHuman(mask),
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

function buildMonthCells(month: Date): CalendarCell[] {
  const start = startOfMonth(month);
  const lead = start.getDay();
  const count = daysInMonth(start);
  const cells: CalendarCell[] = [];
  for (let i = 0; i < lead; i += 1) {
    cells.push({ key: `pad-${i}`, day: null, iso: null });
  }
  for (let day = 1; day <= count; day += 1) {
    const d = new Date(start.getFullYear(), start.getMonth(), day);
    cells.push({
      key: toIsoDateString(d),
      day,
      iso: toIsoDateString(d),
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ key: `trail-${cells.length}`, day: null, iso: null });
  }
  return cells;
}

function monthLabel(d: Date): string {
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

/**
 * User Shift Roster.
 * On load: GET /users?page=1&limit=50 + GET /hrms/shifts?all=true&shiftScope=all
 */
export function UserShiftRosterPage() {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const todayIso = toIsoDateString(new Date());

  const [userPage, setUserPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));

  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [shiftId, setShiftId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [overrideWeek, setOverrideWeek] = useState(false);
  const [workingMask, setWorkingMask] = useState(HRMS_DEFAULT_WORKING_DAYS_MASK);

  /** GET /users?page=1&limit=50 */
  const usersQuery = useUsersListQuery({
    page: userPage,
    limit: USERS_PAGE_LIMIT,
    ...(search.trim() ? { search: search.trim() } : {}),
  });

  /** GET /hrms/shifts?all=true&shiftScope=all */
  const shiftsQuery = useShiftsListQuery(
    { all: true, shiftScope: 'all' },
    { enabled: true, scope: 'user-shift-templates' },
  );

  /** Assignments only after a user is selected */
  const assignmentsQuery = useUserShiftAssignmentsListQuery(
    userId.trim() ? { userId: userId.trim(), all: true } : undefined,
    { enabled: Boolean(userId.trim()), scope: 'user-shift-roster' },
  );

  const createMutation = useCreateUserShiftAssignmentMutation();
  const removeMutation = useRemoveUserShiftAssignmentMutation();

  const users = useMemo(() => parseUsers(usersQuery.data), [usersQuery.data]);
  const userTotal = pickApiTotal(usersQuery.data, users.length);
  const userPageCount = useMemo(() => {
    const payload = unwrapApiData(usersQuery.data);
    if (!isRecord(payload)) return 1;
    const n = pickNum(payload, ['totalPages']);
    return n && n > 0 ? n : Math.max(1, Math.ceil(userTotal / USERS_PAGE_LIMIT));
  }, [usersQuery.data, userTotal]);

  const internalUsers = useMemo(
    () => users.filter((u) => u.type === 'Internal'),
    [users],
  );
  const externalUsers = useMemo(
    () => users.filter((u) => u.type === 'External'),
    [users],
  );

  const selectedUser = useMemo(
    () => users.find((u) => u.id === userId) ?? null,
    [users, userId],
  );

  const assignmentRows = useMemo(
    () => parseAssignments(assignmentsQuery.data),
    [assignmentsQuery.data],
  );

  const cells = useMemo(() => buildMonthCells(monthCursor), [monthCursor]);

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
    setUserPage((p) => (p > userPageCount ? userPageCount : p));
  }, [userPageCount]);

  const resetAssign = () => {
    setShiftId('');
    setEffectiveFrom('');
    setEffectiveTo('');
    setOverrideWeek(false);
    setWorkingMask(HRMS_DEFAULT_WORKING_DAYS_MASK);
  };

  const handleAssign = async () => {
    if (!userId.trim()) {
      Alert.alert('Validation', 'Please select a user first.');
      return;
    }
    if (!shiftId.trim()) {
      Alert.alert('Validation', 'Please select a shift.');
      return;
    }
    if (!effectiveFrom.trim() || !effectiveTo.trim()) {
      Alert.alert('Validation', 'Please select effective from and to dates.');
      return;
    }
    try {
      await createMutation.mutateAsync({
        userId: userId.trim(),
        shiftId: shiftId.trim(),
        effectiveFrom: effectiveFrom.trim(),
        effectiveTo: effectiveTo.trim(),
        ...(overrideWeek
          ? { workingDaysMask: clampWorkingDaysMask(workingMask) }
          : {}),
      });
      setAssignOpen(false);
      resetAssign();
      void assignmentsQuery.refetch();
    } catch (err) {
      Alert.alert('Assign failed', extractApiErrorMessage(err));
    }
  };

  const shiftLabelForDay = (iso: string): string => {
    for (const row of assignmentRows) {
      if (row.effectiveFrom === '—' || row.effectiveTo === '—') continue;
      if (iso >= row.effectiveFrom && iso <= row.effectiveTo) {
        return row.shiftName;
      }
    }
    return '—';
  };

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={usersQuery.isRefetching && !usersQuery.isLoading}
            onRefresh={() => {
              void usersQuery.refetch();
              void shiftsQuery.refetch();
              if (userId.trim()) void assignmentsQuery.refetch();
            }}
            tintColor={accent}
          />
        } showsVerticalScrollIndicator={false}>
        <DashboardPageIntro subtitle="Pick a user, then manage their roster and shift assignments." />

        <ListTableCard
          title="Users"
          subtitle="Filter and search, then select a user for roster and assignments."
          icon="people-outline"
          toolbar={null}
        >
          <FiltersSearchBar
            value={searchInput}
            onChange={setSearchInput}
            onSearch={() => {
              setSearch(searchInput.trim());
              setUserPage(1);
            }}
            placeholder="Search name, email, company..."
            filtersOpen={filtersOpen}
            onFilterPress={() => setFiltersOpen((v) => !v)}
            hasActiveFilters={Boolean(search.trim())}
          >
            {filtersOpen ? (
              <Typography variant="small" muted>
                Search applies after you press Search.
              </Typography>
            ) : null}
          </FiltersSearchBar>

          {usersQuery.isError ? (
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(
                usersQuery.error,
                'Could not load users.',
              )}
            </Typography>
          ) : usersQuery.isLoading && !usersQuery.data ? (
            <Typography variant="small" muted>
              Loading users…
            </Typography>
          ) : users.length === 0 ? (
            <Typography variant="medium" muted>
              No users found.
            </Typography>
          ) : (
            <View style={{ gap: 14 }}>
              {internalUsers.length > 0 ? (
                <View style={{ gap: 8 }}>
                  <Typography variant="small" muted style={{ fontWeight: '700' }}>
                    Internal ({internalUsers.length})
                  </Typography>
                  {internalUsers.map((u) => (
                    <UserPickCard
                      key={u.id}
                      user={u}
                      selected={u.id === userId}
                      onPress={() => setUserId(u.id)}
                      accent={accent}
                      theme={theme}
 />
                  ))}
                </View>
              ) : null}
              {externalUsers.length > 0 ? (
                <View style={{ gap: 8 }}>
                  <Typography variant="small" muted style={{ fontWeight: '700' }}>
                    External ({externalUsers.length})
                  </Typography>
                  {externalUsers.map((u) => (
                    <UserPickCard
                      key={u.id}
                      user={u}
                      selected={u.id === userId}
                      onPress={() => setUserId(u.id)}
                      accent={accent}
                      theme={theme}
 />
                  ))}
                </View>
              ) : null}
            </View>
          )}

          <View style={styles.usersFooter}>
            <Typography variant="small" muted>
              Total {userTotal} user(s)
            </Typography>
            <TablePagination
              page={userPage}
              pageCount={userPageCount}
              onPageChange={setUserPage}
 />
          </View>
        </ListTableCard>

        <ListTableCard
          title="Roster"
          subtitle={
            selectedUser
              ? `${selectedUser.name} · ${selectedUser.type}`
              : 'Select a user from the left.'
          }
          icon="calendar-outline"
          toolbar={
            <Pressable
              onPress={() => setAssignOpen(true)}
              style={({ pressed }) => [
                styles.addBtn,
                {
                  backgroundColor: accent,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Typography
                variant="small"
                color="#FFFFFF"
                style={{ fontWeight: '700' }}
              >
                Add user shift
              </Typography>
            </Pressable>
          }
        >
          <View style={styles.monthNav}>
            <Pressable
              onPress={() => setMonthCursor((m) => startOfMonth(addMonths(m, -1)))}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={20} color={accent} />
            </Pressable>
            <Typography variant="medium" style={{ fontWeight: '700' }}>
              {monthLabel(monthCursor)}
            </Typography>
            <Pressable
              onPress={() => setMonthCursor((m) => startOfMonth(addMonths(m, 1)))}
              hitSlop={8}
            >
              <Ionicons name="chevron-forward" size={20} color={accent} />
            </Pressable>
            <Button
              size="compact"
              variant="outlined"
              onPress={() => setMonthCursor(startOfMonth(new Date()))}
            >
              Today
            </Button>
          </View>

          <View style={styles.weekHead}>
            {WEEKDAYS.map((d, i) => (
              <Typography
                key={`${d}-${i}`}
                variant="small"
                muted
                style={styles.weekHeadCell}
              >
                {d}
              </Typography>
            ))}
          </View>
          <View style={styles.monthGrid}>
            {cells.map((cell) => {
              const isToday = cell.iso === todayIso;
              const label =
                cell.iso && userId.trim()
                  ? shiftLabelForDay(cell.iso)
                  : cell.day
                    ? '—'
                    : '';
              return (
                <View
                  key={cell.key}
                  style={[
                    styles.dayCell,
                    {
                      borderColor: isToday
                        ? accent
                        : theme.app.dashboard.cardBorder,
                      backgroundColor: theme.app.dashboard.overlayLight,
                      opacity: cell.day ? 1 : 0.35,
                    },
                  ]}
                >
                  {cell.day ? (
                    <>
                      <Typography variant="small" style={{ fontWeight: '700' }}>
                        {cell.day}
                      </Typography>
                      <Typography
                        variant="small"
                        muted
                        numberOfLines={1}
                        style={{ fontSize: 10 }}
                      >
                        {label}
                      </Typography>
                    </>
                  ) : null}
                </View>
              );
            })}
          </View>
        </ListTableCard>

        <ListTableCard
          title="Assignments"
          subtitle={
            userId.trim()
              ? 'Shift assignments for the selected user.'
              : 'Select a user to view assignments.'
          }
          icon="time-outline"
          toolbar={null}
        >
          {!userId.trim() ? (
            <View style={styles.emptyAssign}>
              <Typography variant="medium" style={{ fontWeight: '700' }}>
                No records yet
              </Typography>
              <Typography variant="small" muted style={{ textAlign: 'center' }}>
                There is no data available for the current filter.
              </Typography>
              <Typography variant="small" muted>
                Select a user to view assignments.
              </Typography>
            </View>
          ) : assignmentsQuery.isError ? (
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(
                assignmentsQuery.error,
                'Could not load assignments.',
              )}
            </Typography>
          ) : (
            <DataCardGrid
              columns={1}
              isLoading={
                assignmentsQuery.isLoading && !assignmentsQuery.data
              }
              empty={
                !assignmentsQuery.isLoading && assignmentRows.length === 0
              }
              emptyState={{
                title: 'No records yet',
                description:
                  'There is no data available for the current filter.',
                icon: 'time-outline',
              }}
            >
              {assignmentRows.map((row) => (
                <EntityListCard
                  key={row.id}
                  title={row.shiftName}
                  details={[
                    { label: 'Shift', value: row.shiftName },
                    { label: 'Working week', value: row.weekSummary },
                    { label: 'Effective from', value: row.effectiveFrom },
                    { label: 'Effective to', value: row.effectiveTo },
                  ]}
                  onDeletePress={() => setDeleteId(row.id)}
 />
              ))}
            </DataCardGrid>
          )}
        </ListTableCard>
      </ScrollView>

      <UserShiftAssignModal
        open={assignOpen}
        onClose={() => {
          if (createMutation.isPending) return;
          setAssignOpen(false);
          resetAssign();
        }}
        onSave={() => void handleAssign()}
        isSaving={createMutation.isPending}
        users={users}
        usersLoading={usersQuery.isLoading && !usersQuery.data}
        userId={userId}
        onUserIdChange={setUserId}
        shiftId={shiftId}
        onShiftIdChange={setShiftId}
        shiftOptions={shiftOptions}
        effectiveFrom={effectiveFrom}
        onEffectiveFromChange={setEffectiveFrom}
        effectiveTo={effectiveTo}
        onEffectiveToChange={setEffectiveTo}
        overrideWeek={overrideWeek}
        onOverrideWeekChange={setOverrideWeek}
        workingMask={workingMask}
        onWorkingMaskChange={setWorkingMask}
 />

      <ConfirmActionModal
        open={Boolean(deleteId)}
        title="Remove assignment?"
        description="This removes the user shift assignment."
        confirmLabel="Remove"
        confirmButtonVariant="danger"
        isLoading={removeMutation.isPending}
        onDismiss={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await removeMutation.mutateAsync(deleteId);
            setDeleteId(null);
            void assignmentsQuery.refetch();
          } catch (err) {
            Alert.alert('Remove failed', extractApiErrorMessage(err));
          }
        }}
 />
    </MobileScreen>
  );
}

function UserPickCard({
  user,
  selected,
  onPress,
  accent,
  theme,
}: {
  user: UserListRow;
  selected: boolean;
  onPress: () => void;
  accent: string;
  theme: ReturnType<typeof useAppTheme>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.userCard,
        {
          borderColor: selected ? accent : theme.app.dashboard.cardBorder,
          backgroundColor: selected
            ? `${accent}22`
            : theme.app.dashboard.overlayLight,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <Typography variant="medium" style={{ fontWeight: '700' }} numberOfLines={1}>
          {user.name}
        </Typography>
        <Typography variant="small" muted numberOfLines={1}>
          {user.email}
        </Typography>
        {user.type === 'External' ? (
          <Typography variant="small" muted numberOfLines={1}>
            Reseller: {user.resellerName} · Parent: {user.parentCompanyName}
          </Typography>
        ) : null}
      </View>
      <UserTypeBadge value={user.type} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12, paddingHorizontal: 8 },
  scroll: { paddingBottom: 32 },
  usersFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  addBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  weekHead: { flexDirection: 'row', marginBottom: 4 },
  weekHeadCell: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dayCell: {
    width: '13.5%',
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 10,
    padding: 4,
    gap: 2,
  },
  emptyAssign: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
});
