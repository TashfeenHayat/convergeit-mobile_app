import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
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
  DataCardGrid,
  EntityListCard,
  FiltersSearchBar,
  ListTableCard,
  TablePagination,
  Typography,
} from '@/components/ui';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import { useAttendanceMeQuery } from '@/lib/hooks/query/hrms';
import {
  hasAttendanceSelfOperational,
  OP,
} from '@/lib/permissions';
import { isRecord, unwrapApiData } from '@/lib/utils/core';
import {
  formatAttendanceStatus,
  formatBreakSummary,
  formatTimeOnly,
  mapAttendanceEnrichedColumns,
} from '@/lib/utils/hrms/attendance-display';
import { useAppTheme } from '@/theme';

/** Network parity: GET /hrms/attendance/me?from=&to=&page=1&limit=16 */
const PAGE_LIMIT = 16;

type AttendanceRow = {
  id: string;
  date: string;
  checkInTime: string;
  checkOutTime: string;
  status: string;
  breakSummary: string;
  workedMinutes: string;
  startChat: string;
  chatPause: string;
  login: string;
  logout: string;
  chatMinutes: string;
  meetingMinutes: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function startOfMonthIso(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

function formatDateOnly(value: string): string {
  const raw = value.trim();
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function pickStr(row: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function pickNumber(row: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return null;
}

export function MyAttendanceScreen() {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const { hasOperational } = useAuth();

  const canViewSelfAttendance =
    hasOperational(OP.hrms.attendance.selfView) ||
    hasAttendanceSelfOperational(hasOperational) ||
    hasOperational(OP.hrms.attendance.view);
  const canMarkAttendance =
    hasOperational(OP.hrms.attendance.checkIn) ||
    hasOperational(OP.hrms.attendance.checkOut) ||
    hasOperational(OP.hrms.attendance.breakIn) ||
    hasOperational(OP.hrms.attendance.breakOut) ||
    hasAttendanceSelfOperational(hasOperational);

  const today = useMemo(() => todayIso(), []);
  const monthStart = useMemo(() => startOfMonthIso(today), [today]);

  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  /** GET /hrms/attendance/me?from=&to=&page=1&limit=16 — fires on calendar change */
  const attendanceParams = useMemo(
    () => ({ from, to, page, limit: PAGE_LIMIT }),
    [from, to, page],
  );

  const attendanceQuery = useAttendanceMeQuery(attendanceParams, {
    enabled: canViewSelfAttendance && Boolean(from.trim() && to.trim()),
    keepPreviousPage: true,
  });

  const apiItems = useMemo(() => {
    const data = unwrapApiData(attendanceQuery.data);
    if (!data) return [];
    if (Array.isArray(data)) return data.filter(isRecord);
    if (!isRecord(data)) return [];
    const items = data.items;
    return Array.isArray(items) ? items.filter(isRecord) : [];
  }, [attendanceQuery.data]);

  const total = useMemo(() => {
    const data = unwrapApiData(attendanceQuery.data);
    if (!isRecord(data)) return apiItems.length;
    const n = Number(data.total);
    return Number.isFinite(n) ? n : apiItems.length;
  }, [attendanceQuery.data, apiItems.length]);

  const totalPages = useMemo(() => {
    const data = unwrapApiData(attendanceQuery.data);
    if (!isRecord(data)) return 1;
    const n = Number(data.totalPages);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [attendanceQuery.data]);

  const rows = useMemo((): AttendanceRow[] => {
    return apiItems.map((row, idx) => {
      const taken = pickNumber(row, ['breakMinutesTaken']);
      const allowed = pickNumber(row, ['breakMinutesAllowed']);
      const over = pickNumber(row, ['overBreakMinutes']);
      const worked = pickNumber(row, ['workedMinutes']);
      const rawStatus = pickStr(row, ['status']);
      const enriched = mapAttendanceEnrichedColumns(row);
      return {
        id: pickStr(row, ['id', 'attendanceId']) || `attendance-${idx}`,
        date: formatDateOnly(pickStr(row, ['date', 'day', 'attendanceDate'])),
        checkInTime: formatTimeOnly(
          pickStr(row, ['checkInAt', 'checkIn', 'checkInTime', 'inTime']),
        ),
        checkOutTime: formatTimeOnly(
          pickStr(row, ['checkOutAt', 'checkOut', 'checkOutTime', 'outTime']),
        ),
        status: rawStatus ? formatAttendanceStatus(rawStatus) : '—',
        breakSummary: formatBreakSummary(taken, allowed, over),
        workedMinutes: worked != null ? `${worked} min` : '—',
        startChat: enriched.startChat,
        chatPause: enriched.chatPause,
        login: enriched.login,
        logout: enriched.logout,
        chatMinutes: enriched.chatMinutes,
        meetingMinutes: enriched.meetingMinutes,
      };
    });
  }, [apiItems]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [
        r.date,
        r.checkInTime,
        r.checkOutTime,
        r.status,
        r.breakSummary,
        r.workedMinutes,
        r.startChat,
        r.chatPause,
        r.login,
        r.logout,
        r.chatMinutes,
        r.meetingMinutes,
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  const hasActiveFilters =
    from !== monthStart || to !== today || Boolean(search.trim());

  const footerRangeStart =
    filteredRows.length > 0 ? (page - 1) * PAGE_LIMIT + 1 : 0;
  const footerRangeEnd = (page - 1) * PAGE_LIMIT + filteredRows.length;

  useEffect(() => {
    if (searchInput.trim().length > 0) return;
    if (!search.trim()) return;
    setSearch('');
    setPage(1);
  }, [searchInput, search]);

  useEffect(() => {
    setPage(1);
  }, [search, from, to]);

  useEffect(() => {
    setPage((p) => (p > totalPages ? totalPages : p));
  }, [totalPages]);

  /** Calendar From — immediate API: ?from=&to=&page=1&limit=16 */
  const onFromChange = (next: string) => {
    const nextFrom = next.trim() || monthStart;
    setFrom(nextFrom);
    if (nextFrom > to) setTo(nextFrom);
    setPage(1);
  };

  /** Calendar To — immediate API: ?from=&to=&page=1&limit=16 */
  const onToChange = (next: string) => {
    const nextTo = next.trim() || today;
    setTo(nextTo);
    if (nextTo < from) setFrom(nextTo);
    setPage(1);
  };

  const clearFilters = () => {
    setFrom(monthStart);
    setTo(today);
    setSearch('');
    setSearchInput('');
    setPage(1);
  };

  const resetRangeToMonth = () => {
    clearFilters();
  };

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={
              attendanceQuery.isRefetching && !attendanceQuery.isLoading
            }
            onRefresh={() => void attendanceQuery.refetch()}
            tintColor={accent}
          />
        } showsVerticalScrollIndicator={false}>
        <DashboardPageIntro subtitle="View your attendance history for the selected date range.">
          <View style={styles.headerActions}>
            <Pressable
              onPress={resetRangeToMonth}
              accessibilityRole="button"
              accessibilityLabel="Reset date range"
              style={({ pressed }) => [
                styles.rangePill,
                {
                  borderColor: theme.app.dashboard.cardBorder,
                  backgroundColor: theme.app.dashboard.overlayLight,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Ionicons name="calendar-outline" size={16} color={accent} />
              <Typography variant="small" style={{ fontWeight: '600' }}>
                {from} → {to}
              </Typography>
            </Pressable>
            {canMarkAttendance ? (
              <Link href={'/attendance/mark-attendance/index' as Href} asChild>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Mark Attendance"
                  style={({ pressed }) => [
                    styles.markBtn,
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
                    Mark Attendance
                  </Typography>
                </Pressable>
              </Link>
            ) : null}
          </View>

          <FiltersSearchBar
            value={searchInput}
            onChange={setSearchInput}
            onSearch={() => {
              setSearch(searchInput.trim());
              setPage(1);
            }}
            placeholder="Search anything.."
            filtersOpen={filtersOpen}
            onFilterPress={() => setFiltersOpen((v) => !v)}
            hasActiveFilters={hasActiveFilters}
          >
            {filtersOpen ? (
              <View style={{ gap: 12 }}>
                <Calendar
                  label="From"
                  value={from}
                  onChange={onFromChange}
                  rangeMate={to}
                  max={to || undefined}
 />
                <Calendar
                  label="To"
                  value={to}
                  onChange={onToChange}
                  rangeMate={from}
                  min={from || undefined}
 />
                {hasActiveFilters ? (
                  <Button
                    size="compact"
                    variant="outlined"
                    onPress={clearFilters}
                  >
                    Clear filters
                  </Button>
                ) : null}
              </View>
            ) : null}
          </FiltersSearchBar>
        </DashboardPageIntro>

        {!canViewSelfAttendance ? (
          <AppCard>
            <Typography variant="medium" muted>
              You do not have permission to view self attendance.
            </Typography>
          </AppCard>
        ) : attendanceQuery.isError ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(
                attendanceQuery.error,
                'Could not load attendance.',
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
            title="Attendance Records"
            subtitle="Your attendance log for the selected date range."
            icon="time-outline"
            toolbar={null}
          >
            <DataCardGrid
              columns={1}
              isLoading={attendanceQuery.isLoading && !attendanceQuery.data}
              empty={
                !attendanceQuery.isLoading && filteredRows.length === 0
              }
              emptyState={{
                title: 'No attendance records',
                description:
                  'Nothing logged for this date range yet. Mark attendance to get started.',
                icon: 'calendar-outline',
                action: canMarkAttendance ? (
                  <Link
                    href={'/attendance/mark-attendance/index' as Href}
                    asChild
                  >
                    <Button size="compact">Mark Attendance</Button>
                  </Link>
                ) : undefined,
              }}
              showingLabel={
                filteredRows.length > 0 || total > 0
                  ? `Showing data ${footerRangeStart} to ${footerRangeEnd} of ${total} entries`
                  : undefined
              }
              footerRight={
                <TablePagination
                  page={page}
                  pageCount={totalPages}
                  onPageChange={setPage}
 />
              }
            >
              {filteredRows.map((row) => (
                <EntityListCard
                  key={row.id}
                  title={row.date}
                  details={[
                    { label: 'Check-in Time', value: row.checkInTime },
                    { label: 'Check-out Time', value: row.checkOutTime },
                    { label: 'Login', value: row.login },
                    { label: 'Logout', value: row.logout },
                    { label: 'Status', value: row.status },
                    { label: 'Break', value: row.breakSummary },
                    { label: 'Worked', value: row.workedMinutes },
                    { label: 'Start chat', value: row.startChat },
                    { label: 'Chat pause', value: row.chatPause },
                    { label: 'Chat min', value: row.chatMinutes },
                    { label: 'Meeting min', value: row.meetingMinutes },
                  ]}
 />
              ))}
            </DataCardGrid>
          </ListTableCard>
        )}
      </ScrollView>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12, paddingHorizontal: 8 },
  scroll: { paddingBottom: 32 },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  rangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  markBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
});
