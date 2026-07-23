import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import {
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
import { useDepartmentHeadsReviewerAttendanceQuery } from '@/lib/hooks/query/hrms';
import { OP } from '@/lib/permissions';
import { HRMS } from '@/lib/permissions/permission-constants';
import { pickApiItems, pickApiTotal } from '@/lib/utils/admin-list';
import {
  formatAttendanceStatus,
  formatTimeOnly,
} from '@/lib/utils/hrms/attendance-display';
import {
  isRecord,
  pickNum,
  pickStr,
  unwrapApiData,
} from '@/lib/utils/core';
import { useAppTheme } from '@/theme';

/** Network parity: GET …/reviewer-attendance?page=1&limit=16&date= */
const PAGE_LIMIT = 16;

type AttendanceRow = {
  id: string;
  name: string;
  email: string;
  department: string;
  status: string;
  checkIn: string;
  checkOut: string;
  date: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function extractTotalPages(data: unknown): number {
  const payload = unwrapApiData(data);
  if (!isRecord(payload)) return 1;
  const n = pickNum(payload, ['totalPages']);
  return n && n > 0 ? n : 1;
}

function parseRows(data: unknown): AttendanceRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((row, idx) => {
      const user = isRecord(row.user) ? row.user : null;
      const dept =
        (isRecord(row.department) ? row.department : null) ??
        (user && isRecord(user.department) ? user.department : null);
      const first =
        pickStr(user, ['firstName']) || pickStr(row, ['firstName']);
      const last = pickStr(user, ['lastName']) || pickStr(row, ['lastName']);
      const joined = `${first} ${last}`.replace(/\s+/g, ' ').trim();
      const name =
        joined ||
        pickStr(user, ['name', 'employeeName', 'fullName']) ||
        pickStr(row, ['name', 'employeeName', 'memberName']) ||
        '—';
      const email =
        pickStr(user, ['email']) || pickStr(row, ['email']) || '—';
      const id =
        pickStr(row, ['id', 'attendanceId', 'userId']) ||
        pickStr(user, ['id']) ||
        `dhr-${idx}`;
      const checkInRaw =
        pickStr(row, ['checkInAt', 'checkIn', 'checkInTime', 'inTime']) || '';
      const checkOutRaw =
        pickStr(row, ['checkOutAt', 'checkOut', 'checkOutTime', 'outTime']) ||
        '';
      return {
        id,
        name,
        email,
        department: pickStr(dept, ['name']) || pickStr(row, ['departmentName']) || '—',
        status: formatAttendanceStatus(
          pickStr(row, ['status', 'attendanceStatus']) || '—',
        ),
        checkIn: checkInRaw ? formatTimeOnly(checkInRaw) : '—',
        checkOut: checkOutRaw ? formatTimeOnly(checkOutRaw) : '—',
        date: pickStr(row, ['date', 'day', 'attendanceDate']) || '—',
      };
    });
}

/**
 * Attendance (department heads review scope).
 * Network: GET /hrms/department-heads/reviewer-attendance?page=1&limit=16&date=
 */
export function TeamAttendancePage() {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const { hasOperational } = useAuth();
  const canView =
    hasOperational(HRMS.ATTENDANCE_VIEW) ||
    hasOperational(OP.hrms.attendance.view);

  const [date, setDate] = useState(todayIso);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      date: date.trim() || todayIso(),
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [page, date, search],
  );

  /** GET /hrms/department-heads/reviewer-attendance?page=1&limit=16&date=… */
  const query = useDepartmentHeadsReviewerAttendanceQuery(params, {
    enabled: canView,
    scope: 'team-attendance-reviewer',
  });

  const rows = useMemo(() => parseRows(query.data), [query.data]);
  const total = pickApiTotal(query.data, rows.length);
  const pageCount = Math.max(
    1,
    extractTotalPages(query.data) || Math.ceil(total / PAGE_LIMIT),
  );
  const rangeStart = rows.length > 0 ? (page - 1) * PAGE_LIMIT + 1 : 0;
  const rangeEnd = (page - 1) * PAGE_LIMIT + rows.length;

  useEffect(() => {
    setPage((p) => (p > pageCount ? pageCount : p));
  }, [pageCount]);

  if (!canView) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" muted>
            You need attendance view permission to open this page.
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
        <DashboardPageIntro subtitle="Attendance for all department heads in your review scope.">
          <View style={styles.scopeRow}>
            <View
              style={[
                styles.scopePill,
                {
                  backgroundColor: `${accent}22`,
                  borderColor: `${accent}55`,
                },
              ]}
            >
              <Ionicons name="people-outline" size={14} color={accent} />
              <Typography
                variant="small"
                style={{ fontWeight: '700', color: accent }}
              >
                Department heads
              </Typography>
            </View>
          </View>

          <FiltersSearchBar
            value={searchInput}
            onChange={setSearchInput}
            onSearch={() => {
              setSearch(searchInput.trim());
              setPage(1);
            }}
            placeholder="Search name or email..."
            filtersOpen={filtersOpen}
            onFilterPress={() => setFiltersOpen((v) => !v)}
            hasActiveFilters={date !== todayIso() || Boolean(search.trim())}
          >
            {filtersOpen ? (
              <View style={{ gap: 12 }}>
                <Button
                  size="compact"
                  variant="outlined"
                  onPress={() => {
                    setDate(todayIso());
                    setPage(1);
                  }}
                >
                  Today
                </Button>
                {search.trim() || date !== todayIso() ? (
                  <Button
                    size="compact"
                    variant="outlined"
                    onPress={() => {
                      setSearch('');
                      setSearchInput('');
                      setDate(todayIso());
                      setPage(1);
                    }}
                  >
                    Clear filters
                  </Button>
                ) : null}
              </View>
            ) : null}
          </FiltersSearchBar>

          <Calendar
            label="Date (UTC)"
            value={date}
            onChange={(v) => {
              setDate(v);
              setPage(1);
            }}
 />
        </DashboardPageIntro>

        {query.isError ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(
                query.error,
                'Could not load department head attendance.',
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
            title="Attendance records"
            icon="time-outline"
            toolbar={null}
          >
            <DataCardGrid
              columns={1}
              isLoading={query.isLoading && !query.data}
              empty={!query.isLoading && rows.length === 0}
              emptyState={{
                title: 'No department head attendance',
                description:
                  'No department head attendance for this date in your review scope.',
                icon: 'cloud-download-outline',
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
                  subtitle={row.email !== '—' ? row.email : undefined}
                  details={[
                    { label: 'Department', value: row.department },
                    { label: 'Date', value: row.date },
                    { label: 'Status', value: row.status },
                    { label: 'Check in', value: row.checkIn },
                    { label: 'Check out', value: row.checkOut },
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
  scopeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  scopePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
});
