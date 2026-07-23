import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import {
  AppCard,
  Button,
  InputField,
  Typography,
} from '@/components/ui';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import {
  useAttendanceBreakInMutation,
  useAttendanceBreakOutMutation,
  useAttendanceCheckInMutation,
  useAttendanceCheckOutMutation,
  useAttendanceMeQuery,
} from '@/lib/hooks/query/hrms';
import { OP, hasAttendanceSelfOperational } from '@/lib/permissions';
import { isRecord, unwrapApiData } from '@/lib/utils/core';
import {
  formatAttendanceStatus,
  formatBreakSummary,
  parseAttendanceDayState,
} from '@/lib/utils/hrms/attendance-display';
import { useAppTheme } from '@/theme';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDisplayDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${m}/${d}/${y}`;
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

/** Mark Attendance — web parity card: Date / Status / Break today + Back / Check in. */
export function MarkAttendanceScreen() {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const router = useRouter();
  const { hasOperational } = useAuth();
  const [date] = useState(todayIso);

  const selfOk = hasAttendanceSelfOperational(hasOperational);
  const canCheckIn = hasOperational(OP.hrms.attendance.checkIn) || selfOk;
  const canCheckOut = hasOperational(OP.hrms.attendance.checkOut) || selfOk;
  const canBreakIn = hasOperational(OP.hrms.attendance.breakIn) || selfOk;
  const canBreakOut = hasOperational(OP.hrms.attendance.breakOut) || selfOk;

  const todayQuery = useAttendanceMeQuery(
    { from: date, to: date, page: 1, limit: 1 },
    { enabled: Boolean(date.trim()) },
  );

  const checkIn = useAttendanceCheckInMutation();
  const checkOut = useAttendanceCheckOutMutation();
  const breakIn = useAttendanceBreakInMutation();
  const breakOut = useAttendanceBreakOutMutation();

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

  const breakSummary = useMemo(
    () =>
      formatBreakSummary(
        dayState.breakMinutesTaken,
        dayState.breakMinutesAllowed,
        dayState.overBreakMinutes,
      ),
    [dayState],
  );

  const busy =
    checkIn.isPending ||
    checkOut.isPending ||
    breakIn.isPending ||
    breakOut.isPending ||
    todayQuery.isFetching;

  const runAction = (
    mutate: {
      mutate: (
        vars: void,
        opts: { onSuccess: () => void; onError: (e: unknown) => void },
      ) => void;
    },
    successMessage: string,
    errorFallback: string,
  ) => {
    mutate.mutate(undefined, {
      onSuccess: () => Alert.alert('Success', successMessage),
      onError: (err) =>
        Alert.alert(
          'Failed',
          extractApiErrorMessage(err, errorFallback),
        ),
    });
  };

  return (
    <MobileScreen>
      <View style={{ gap: theme.spacing.md }}>
        <DashboardPageIntro subtitle="Check in/out and manage breaks for today (shift timezone)." />

        <AppCard style={{ gap: 16 }}>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: `${theme.app.dashboard.accentPurple}33` },
              ]}
            >
              <Ionicons name="cash-outline" size={18} color="#FFFFFF" />
            </View>
            <Typography variant="medium16" style={{ fontWeight: '700' }}>
              Mark Attendance
            </Typography>
          </View>

          <View style={styles.fields}>
            <InputField
              label="Date"
              value={formatDisplayDate(date)}
              editable={false}
            />
            <InputField label="Status" value={statusLabel} editable={false} />
            <InputField
              label="Break today"
              value={breakSummary}
              editable={false}
            />
          </View>

          <View style={styles.actions}>
            <Button
              variant="secondary"
              size="compact"
              onPress={() =>
                router.push('/attendance/my-attendance/index' as Href)
              }
              style={styles.actionBtn}
            >
              Back
            </Button>

            {canCheckIn ? (
              <Button
                variant="secondary"
                size="compact"
                loading={checkIn.isPending}
                disabled={busy || dayState.hasOpenSession}
                onPress={() =>
                  runAction(checkIn, 'Checked in.', 'Could not check in.')
                }
                style={styles.actionBtn}
              >
                {checkIn.isPending ? 'Checking in…' : 'Check in'}
              </Button>
            ) : null}

            {dayState.hasOpenSession && !dayState.isOnBreak && canBreakIn ? (
              <Button
                variant="secondary"
                size="compact"
                loading={breakIn.isPending}
                disabled={busy}
                onPress={() =>
                  runAction(
                    breakIn,
                    'Break started.',
                    'Could not start break.',
                  )
                }
                style={styles.actionBtn}
              >
                {breakIn.isPending ? 'Starting break…' : 'Start break'}
              </Button>
            ) : null}

            {dayState.hasOpenSession && dayState.isOnBreak && canBreakOut ? (
              <Button
                variant="secondary"
                size="compact"
                loading={breakOut.isPending}
                disabled={busy}
                onPress={() =>
                  runAction(breakOut, 'Break ended.', 'Could not end break.')
                }
                style={styles.actionBtn}
              >
                {breakOut.isPending ? 'Ending break…' : 'End break'}
              </Button>
            ) : null}

            {dayState.hasOpenSession && canCheckOut ? (
              <Button
                variant="primary"
                size="compact"
                loading={checkOut.isPending}
                disabled={busy}
                onPress={() =>
                  runAction(
                    checkOut,
                    'Checked out.',
                    'Could not check out.',
                  )
                }
                style={[styles.actionBtn, { backgroundColor: accent }]}
              >
                {checkOut.isPending ? 'Checking out…' : 'Check out'}
              </Button>
            ) : null}
          </View>
        </AppCard>
      </View>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fields: {
    gap: 12,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    minWidth: 110,
  },
});
