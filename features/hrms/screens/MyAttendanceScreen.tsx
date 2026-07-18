import { useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Link, type Href } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { MobileScreen } from '@/components/layout';
import {
  AppCard,
  Button,
  DataTable,
  ListTableCard,
  MetricCard,
  StatusChip,
  TablePagination,
  Typography,
  statusToneFromLabel,
  type DataTableColumn,
} from '@/components/ui';
import { getMyAttendance } from '@/api/hrms/attendance.api';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { isRecord, pickNum, pickStr, unwrapApiData } from '@/lib/utils/core';
import {
  formatAttendanceStatus,
  formatMinutesLabel,
  formatTimeOnly,
} from '@/lib/utils/hrms/attendance-display';
import { useAppTheme } from '@/theme';
import { tokens } from '@/theme/tokens';

const PAGE_SIZE = 10;

type AttendanceRow = {
  id: string;
  date: string;
  status: string;
  checkIn: string;
  checkOut: string;
  worked: string;
};

function monthRange(anchor: Date): { from: string; to: string } {
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  const from = new Date(y, m, 1).toISOString().slice(0, 10);
  const to = new Date(y, m + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

function parseRows(data: unknown): AttendanceRow[] {
  const payload = unwrapApiData(data);
  const items = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.items)
      ? payload.items
      : [];

  return items
    .filter(isRecord)
    .map((r, index) => {
      const id = pickStr(r, ['id']) || `row-${index}`;
      const date =
        pickStr(r, ['date', 'attendanceDate', 'day', 'workDate']) ||
        pickStr(r, ['checkInAt', 'checkIn']).slice(0, 10) ||
        '—';
      const statusRaw = pickStr(r, ['status']);
      const worked = pickNum(r, ['workedMinutes']);
      return {
        id,
        date,
        status: statusRaw ? formatAttendanceStatus(statusRaw) : '—',
        checkIn: formatTimeOnly(pickStr(r, ['checkInAt', 'checkIn', 'checkInTime'])),
        checkOut: formatTimeOnly(pickStr(r, ['checkOutAt', 'checkOut', 'checkOutTime'])),
        worked: formatMinutesLabel(worked),
      };
    });
}

const columns: DataTableColumn<AttendanceRow>[] = [
  { id: 'date', label: 'Date', minWidth: 110 },
  {
    id: 'status',
    label: 'Status',
    minWidth: 110,
    render: (value) => (
      <StatusChip label={String(value ?? '—')} tone={statusToneFromLabel(String(value ?? ''))} />
    ),
  },
  { id: 'checkIn', label: 'Check in', minWidth: 90, cellVariant: 'muted' },
  { id: 'checkOut', label: 'Check out', minWidth: 90, cellVariant: 'muted' },
  { id: 'worked', label: 'Worked', minWidth: 90 },
];

export function MyAttendanceScreen() {
  const theme = useAppTheme();
  const [anchor] = useState(() => new Date());
  const [page, setPage] = useState(1);
  const range = useMemo(() => monthRange(anchor), [anchor]);

  const query = useQuery({
    queryKey: ['hrms', 'attendance', 'me', range.from, range.to],
    queryFn: () =>
      getMyAttendance({
        from: range.from,
        to: range.to,
        page: 1,
        limit: 100,
      }),
  });

  const rows = useMemo(() => parseRows(query.data), [query.data]);
  const monthLabel = anchor.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [page, rows]);

  const presentCount = rows.filter((r) => /present/i.test(r.status)).length;
  const absentCount = rows.filter((r) => /absent/i.test(r.status)).length;

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
          <View style={{ gap: theme.spacing.xs }}>
            <Typography variant="boldLarge">My Attendance</Typography>
            <Typography variant="medium" muted>
              {monthLabel} · {range.from} → {range.to}
            </Typography>
          </View>

          <Link href={'/attendance/mark-attendance/index' as Href} asChild>
            <Button fullWidth>Mark attendance</Button>
          </Link>

          <View style={styles.metrics}>
            <MetricCard
              title="Records"
              value={String(rows.length)}
              subtitle={monthLabel}
              showTrendArrow={false}
              iconBgColor="rgba(88, 101, 242, 0.18)"
              icon={<Ionicons name="calendar-outline" size={20} color={tokens.colors.accentBlue} />}
              style={styles.metric}
            />
            <MetricCard
              title="Present"
              value={String(presentCount)}
              subtitle={`${absentCount} absent`}
              showTrendArrow={false}
              valueColor={tokens.colors.accentGreen}
              iconBgColor="rgba(34, 197, 94, 0.16)"
              icon={<Ionicons name="checkmark-circle-outline" size={20} color={tokens.colors.accentGreen} />}
              style={styles.metric}
            />
          </View>

          {query.isError ? (
            <AppCard>
              <Typography variant="medium" color={theme.app.danger}>
                {extractApiErrorMessage(query.error, 'Could not load attendance.')}
              </Typography>
            </AppCard>
          ) : (
            <ListTableCard
              title="Attendance log"
              subtitle={`${rows.length} day${rows.length === 1 ? '' : 's'} this month`}
              icon="time-outline"
              footer={
                rows.length > PAGE_SIZE ? (
                  <>
                    <Typography variant="small" muted>
                      Showing {(page - 1) * PAGE_SIZE + 1}–
                      {Math.min(page * PAGE_SIZE, rows.length)} of {rows.length}
                    </Typography>
                    <TablePagination page={page} pageCount={pageCount} onPageChange={setPage} />
                  </>
                ) : (
                  <Typography variant="small" muted>
                    {rows.length === 0 ? 'No rows yet' : `${rows.length} record${rows.length === 1 ? '' : 's'}`}
                  </Typography>
                )
              }
            >
              {query.isLoading && !query.data ? (
                <View style={styles.centered}>
                  <ActivityIndicator color={theme.app.dashboard.accentBlue} />
                </View>
              ) : (
                <DataTable
                  columns={columns}
                  rows={pageRows}
                  getRowId={(row) => row.id}
                  minWidth={520}
                  emptyState={{
                    title: 'No attendance records',
                    description: 'Nothing logged for this month yet. Mark attendance to get started.',
                    icon: 'calendar-outline',
                  }}
                />
              )}
            </ListTableCard>
          )}
        </View>
      </ScrollView>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
  scroll: { paddingBottom: 32, gap: 0 },
  metrics: { flexDirection: 'row', gap: 10 },
  metric: { flex: 1, padding: 14 },
  centered: { minHeight: 120, alignItems: 'center', justifyContent: 'center' },
});
