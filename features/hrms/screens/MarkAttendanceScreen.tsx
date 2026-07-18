import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, type Href } from 'expo-router';

import { MobileScreen } from '@/components/layout';
import { AppCard, Button, Typography } from '@/components/ui';
import {
  attendanceBreakIn,
  attendanceBreakOut,
  attendanceCheckIn,
  attendanceCheckOut,
  getMyAttendance,
} from '@/api/hrms/attendance.api';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import { OP, hasAttendanceSelfOperational } from '@/lib/permissions';
import { isRecord, unwrapApiData } from '@/lib/utils/core';
import {
  formatAttendanceStatus,
  formatBreakSummary,
  formatMinutesLabel,
  formatTimeOnly,
  parseAttendanceDayState,
} from '@/lib/utils/hrms/attendance-display';
import { useAppTheme } from '@/theme';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function firstTodayRow(data: unknown): Record<string, unknown> {
  const payload = unwrapApiData(data);
  const source = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.items)
      ? payload.items
      : [];
  const row = source.find((item) => isRecord(item));
  return row && isRecord(row) ? row : {};
}

export function MarkAttendanceScreen() {
  const theme = useAppTheme();
  const qc = useQueryClient();
  const { hasOperational } = useAuth();
  const [date] = useState(todayIso);

  const selfOk = hasAttendanceSelfOperational(hasOperational);
  const canCheckIn = hasOperational(OP.hrms.attendance.checkIn) || selfOk;
  const canCheckOut = hasOperational(OP.hrms.attendance.checkOut) || selfOk;
  const canBreakIn = hasOperational(OP.hrms.attendance.breakIn) || selfOk;
  const canBreakOut = hasOperational(OP.hrms.attendance.breakOut) || selfOk;

  const todayQuery = useQuery({
    queryKey: ['hrms', 'attendance', 'me', date],
    queryFn: () => getMyAttendance({ from: date, to: date, page: 1, limit: 1 }),
    staleTime: 30_000,
  });

  const dayState = useMemo(
    () => parseAttendanceDayState(firstTodayRow(todayQuery.data)),
    [todayQuery.data],
  );

  const statusLabel = useMemo(() => {
    const row = firstTodayRow(todayQuery.data);
    const raw = typeof row.status === 'string' ? row.status : '';
    if (raw.trim()) return formatAttendanceStatus(raw);
    if (dayState.isOnBreak) return 'On break';
    if (dayState.hasOpenSession) return 'Checked in';
    return 'Not checked in';
  }, [todayQuery.data, dayState]);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['hrms', 'attendance'] });
  };

  const checkIn = useMutation({
    mutationFn: attendanceCheckIn,
    onSuccess: () => {
      invalidate();
      Alert.alert('Checked in', 'Your attendance session started.');
    },
    onError: (err) => Alert.alert('Check-in failed', extractApiErrorMessage(err)),
  });
  const checkOut = useMutation({
    mutationFn: attendanceCheckOut,
    onSuccess: () => {
      invalidate();
      Alert.alert('Checked out', 'Your attendance session ended.');
    },
    onError: (err) => Alert.alert('Check-out failed', extractApiErrorMessage(err)),
  });
  const breakIn = useMutation({
    mutationFn: attendanceBreakIn,
    onSuccess: () => {
      invalidate();
      Alert.alert('Break started');
    },
    onError: (err) => Alert.alert('Break failed', extractApiErrorMessage(err)),
  });
  const breakOut = useMutation({
    mutationFn: attendanceBreakOut,
    onSuccess: () => {
      invalidate();
      Alert.alert('Break ended');
    },
    onError: (err) => Alert.alert('Break failed', extractApiErrorMessage(err)),
  });

  const busy =
    checkIn.isPending ||
    checkOut.isPending ||
    breakIn.isPending ||
    breakOut.isPending ||
    todayQuery.isFetching;

  const breakSummary = formatBreakSummary(
    dayState.breakMinutesTaken,
    dayState.breakMinutesAllowed,
    dayState.overBreakMinutes,
  );

  return (
    <MobileScreen>
      <View style={{ gap: theme.spacing.md }}>
        <View style={{ gap: theme.spacing.xs }}>
          <Typography variant="boldLarge">Mark Attendance</Typography>
          <Typography variant="medium" muted>
            Check in/out and manage breaks for today (shift timezone).
          </Typography>
        </View>

        <AppCard style={{ gap: theme.spacing.md }}>
          <StatRow label="Date" value={date} />
          <StatRow label="Status" value={statusLabel} />
          <StatRow
            label="Check-in"
            value={dayState.checkInAt ? formatTimeOnly(dayState.checkInAt) : '—'}
          />
          <StatRow
            label="Check-out"
            value={dayState.checkOutAt ? formatTimeOnly(dayState.checkOutAt) : '—'}
          />
          <StatRow label="Break today" value={breakSummary} />
          <StatRow label="Worked" value={formatMinutesLabel(dayState.workedMinutes)} />

          <View style={[styles.actions, { gap: theme.spacing.sm }]}>
            {canCheckIn && !dayState.hasOpenSession ? (
              <Button
                fullWidth
                loading={checkIn.isPending}
                disabled={busy}
                onPress={() => checkIn.mutate()}
              >
                Check in
              </Button>
            ) : null}
            {canCheckOut && dayState.hasOpenSession && !dayState.isOnBreak ? (
              <Button
                fullWidth
                variant="secondary"
                loading={checkOut.isPending}
                disabled={busy}
                onPress={() => checkOut.mutate()}
              >
                Check out
              </Button>
            ) : null}
            {canBreakIn && dayState.hasOpenSession && !dayState.isOnBreak ? (
              <Button
                fullWidth
                variant="outlined"
                loading={breakIn.isPending}
                disabled={busy}
                onPress={() => breakIn.mutate()}
              >
                Start break
              </Button>
            ) : null}
            {canBreakOut && dayState.isOnBreak ? (
              <Button
                fullWidth
                variant="outlined"
                loading={breakOut.isPending}
                disabled={busy}
                onPress={() => breakOut.mutate()}
              >
                End break
              </Button>
            ) : null}
          </View>

          <Link href={"/attendance/my-attendance/index" as Href} asChild>
            <Button variant="ghost" fullWidth>
              View my attendance
            </Button>
          </Link>
        </AppCard>
      </View>
    </MobileScreen>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Typography variant="small" muted>
        {label}
      </Typography>
      <Typography variant="medium16">{value}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { marginTop: 4 },
  statRow: { gap: 2 },
});
