import { useCallback, useMemo, type ComponentProps } from 'react';
import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

import { LiquidGlass, Typography } from '@/components/ui';
import { webHrefToMobile } from '@/constants/navigation';
import { glassUi } from '@/lib/theme/glass-ui';
import { useAuth } from '@/lib/auth';
import {
  useAttendanceBreakInMutation,
  useAttendanceBreakOutMutation,
  useAttendanceCheckInMutation,
  useAttendanceCheckOutMutation,
  useAttendanceMeetingInMutation,
  useAttendanceMeetingOutMutation,
  useTodayAttendanceRow,
} from '@/lib/hooks/query/hrms';
import { extractApiErrorMessageForToast, publishAppToast } from '@/lib/notify';
import { OP, hasAttendanceSelfOperational } from '@/lib/permissions';
import { formatBreakSummary, formatTimeOnly } from '@/lib/utils/hrms/attendance-display';
import { tokens } from '@/theme/tokens';

function formatTodayLabel(): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());
}

type ActionKey = 'check' | 'break' | 'meeting';

/**
 * Dashboard attendance — 3 actions like web AccountMenu:
 * Check-in/out · Break-in/out · Meeting-in/out
 * Checkout only appears after a successful check-in (open session).
 */
export function DashboardAttendancePanel() {
  const { hasOperational } = useAuth();

  const selfOk = hasAttendanceSelfOperational(hasOperational);
  const canCheckIn = hasOperational(OP.hrms.attendance.checkIn) || selfOk;
  const canCheckOut = hasOperational(OP.hrms.attendance.checkOut) || selfOk;
  const canBreakIn = hasOperational(OP.hrms.attendance.breakIn) || selfOk;
  const canBreakOut = hasOperational(OP.hrms.attendance.breakOut) || selfOk;
  const canMeetingIn = hasOperational(OP.hrms.attendance.meetingIn) || selfOk;
  const canMeetingOut = hasOperational(OP.hrms.attendance.meetingOut) || selfOk;

  const showCheck = canCheckIn || canCheckOut;
  const showBreak = canBreakIn || canBreakOut;
  const showMeeting = canMeetingIn || canMeetingOut;
  const show = showCheck || showBreak || showMeeting;

  const { dayState, headerTimes, isLoading } = useTodayAttendanceRow({ enabled: show });
  const checkInMutation = useAttendanceCheckInMutation();
  const checkOutMutation = useAttendanceCheckOutMutation();
  const breakInMutation = useAttendanceBreakInMutation();
  const breakOutMutation = useAttendanceBreakOutMutation();
  const meetingInMutation = useAttendanceMeetingInMutation();
  const meetingOutMutation = useAttendanceMeetingOutMutation();

  const isCheckedIn = dayState.hasOpenSession;
  const isOnBreak = dayState.isOnBreak;
  const isOnMeeting = dayState.isOnMeeting;

  const isBusy =
    isLoading ||
    checkInMutation.isPending ||
    checkOutMutation.isPending ||
    breakInMutation.isPending ||
    breakOutMutation.isPending ||
    meetingInMutation.isPending ||
    meetingOutMutation.isPending;

  const mutateWithToast = useCallback(
    (
      mutate: (opts: { onSuccess: () => void; onError: (e: unknown) => void }) => void,
      successMessage: string,
      errorFallback: string,
    ) => {
      mutate({
        onSuccess: () => publishAppToast({ variant: 'success', message: successMessage }),
        onError: (error) =>
          publishAppToast({
            variant: 'error',
            message: extractApiErrorMessageForToast(error) ?? errorFallback,
          }),
      });
    },
    [],
  );

  const handleCheck = useCallback(() => {
    if (isCheckedIn) {
      if (!canCheckOut || isBusy || isOnBreak || isOnMeeting) return;
      mutateWithToast(
        (opts) => checkOutMutation.mutate(undefined, opts),
        'Checked out successfully.',
        'Could not check out.',
      );
      return;
    }
    if (!canCheckIn || isBusy) return;
    mutateWithToast(
      (opts) => checkInMutation.mutate(undefined, opts),
      'Checked in successfully.',
      'Could not check in.',
    );
  }, [
    canCheckIn,
    canCheckOut,
    checkInMutation,
    checkOutMutation,
    isBusy,
    isCheckedIn,
    isOnBreak,
    isOnMeeting,
    mutateWithToast,
  ]);

  const handleBreak = useCallback(() => {
    if (!isCheckedIn || isBusy) return;
    if (isOnBreak) {
      if (!canBreakOut) return;
      mutateWithToast(
        (opts) => breakOutMutation.mutate(undefined, opts),
        'Break ended.',
        'Could not end break.',
      );
      return;
    }
    if (!canBreakIn || isOnMeeting) return;
    mutateWithToast(
      (opts) => breakInMutation.mutate(undefined, opts),
      'Break started.',
      'Could not start break.',
    );
  }, [
    breakInMutation,
    breakOutMutation,
    canBreakIn,
    canBreakOut,
    isBusy,
    isCheckedIn,
    isOnBreak,
    isOnMeeting,
    mutateWithToast,
  ]);

  const handleMeeting = useCallback(() => {
    if (!isCheckedIn || isBusy) return;
    if (isOnMeeting) {
      if (!canMeetingOut) return;
      mutateWithToast(
        (opts) => meetingOutMutation.mutate(undefined, opts),
        'Meeting ended.',
        'Could not end meeting.',
      );
      return;
    }
    if (!canMeetingIn || isOnBreak) return;
    mutateWithToast(
      (opts) => meetingInMutation.mutate(undefined, opts),
      'Meeting started.',
      'Could not start meeting.',
    );
  }, [
    canMeetingIn,
    canMeetingOut,
    isBusy,
    isCheckedIn,
    isOnBreak,
    isOnMeeting,
    meetingInMutation,
    meetingOutMutation,
    mutateWithToast,
  ]);

  const checkLabel = useMemo(() => {
    if (checkInMutation.isPending) return 'Checking in…';
    if (checkOutMutation.isPending) return 'Checking out…';
    return isCheckedIn ? 'Check out' : 'Check in';
  }, [checkInMutation.isPending, checkOutMutation.isPending, isCheckedIn]);

  const breakLabel = useMemo(() => {
    if (breakInMutation.isPending) return 'Starting…';
    if (breakOutMutation.isPending) return 'Ending…';
    return isOnBreak ? 'End break' : 'Break';
  }, [breakInMutation.isPending, breakOutMutation.isPending, isOnBreak]);

  const meetingLabel = useMemo(() => {
    if (meetingInMutation.isPending) return 'Starting…';
    if (meetingOutMutation.isPending) return 'Ending…';
    return isOnMeeting ? 'End meeting' : 'Meeting';
  }, [isOnMeeting, meetingInMutation.isPending, meetingOutMutation.isPending]);

  /** Checkout only after check-in; end break/meeting before checkout. */
  const checkDisabled =
    isBusy ||
    (isCheckedIn
      ? !canCheckOut || isOnBreak || isOnMeeting
      : !canCheckIn);

  const breakDisabled =
    isBusy || !isCheckedIn || (isOnBreak ? !canBreakOut : !canBreakIn || isOnMeeting);

  const meetingDisabled =
    isBusy || !isCheckedIn || isOnBreak || (isOnMeeting ? !canMeetingOut : !canMeetingIn);

  const statusTitle = useMemo(() => {
    if (isOnBreak) return 'You are on break';
    if (isOnMeeting) return 'You are in a meeting';
    if (isCheckedIn) return 'You are checked in';
    return 'Not checked in yet';
  }, [isCheckedIn, isOnBreak, isOnMeeting]);

  const statusHint = useMemo(() => {
    if (isLoading) return 'Loading today’s record…';
    if (!isCheckedIn) return 'Check in first — then break, meeting & check out unlock.';
    if (isOnBreak) return 'End break to use meeting or check out.';
    if (isOnMeeting) return 'End meeting to use break or check out.';
    return 'Use break, meeting, or check out below.';
  }, [isCheckedIn, isLoading, isOnBreak, isOnMeeting]);

  const tone = useMemo(() => {
    if (isOnBreak) {
      return { label: 'On break', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.16)' };
    }
    if (isOnMeeting) {
      return { label: 'In meeting', color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.16)' };
    }
    if (isCheckedIn) {
      return { label: 'Active', color: tokens.colors.accentGreen, bg: 'rgba(34, 197, 94, 0.18)' };
    }
    return { label: 'Pending', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.16)' };
  }, [isCheckedIn, isOnBreak, isOnMeeting]);

  const breakSummary = formatBreakSummary(
    dayState.breakMinutesTaken,
    dayState.breakMinutesAllowed,
    dayState.overBreakMinutes,
  );

  const checkInTime = headerTimes.checkIn ?? (dayState.checkInAt ? formatTimeOnly(dayState.checkInAt) : null);
  const checkOutTime = headerTimes.checkOut;

  if (!show) return null;

  return (
    <LiquidGlass intensity="medium" radius={glassUi.radius.lg} elevated contentStyle={styles.card}>
      <LinearGradient
        colors={[tone.bg, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.topRow}>
        <View style={[styles.statusIcon, { backgroundColor: tone.bg }]}>
          <Ionicons
            name={
              isOnBreak
                ? 'cafe-outline'
                : isOnMeeting
                  ? 'people-outline'
                  : isCheckedIn
                    ? 'checkmark-circle'
                    : 'finger-print'
            }
            size={22}
            color={tone.color}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Typography variant="small" muted style={styles.eyebrow}>
            Attendance · {formatTodayLabel()}
          </Typography>
          <Typography variant="medium16" style={styles.statusTitle}>
            {statusTitle}
          </Typography>
          <Typography variant="small" muted numberOfLines={2}>
            {statusHint}
          </Typography>
        </View>
        <View style={[styles.badge, { backgroundColor: tone.bg }]}>
          <Typography variant="small" style={{ fontWeight: '700', color: tone.color }}>
            {tone.label}
          </Typography>
        </View>
      </View>

      <View style={styles.timesRow}>
        <TimeChip
          icon="log-in-outline"
          label="In"
          value={checkInTime ?? (isLoading ? '…' : '—')}
          accent="#86EFAC"
        />
        <TimeChip
          icon="log-out-outline"
          label="Out"
          value={
            checkOutTime ??
            (isCheckedIn ? 'Active' : isLoading ? '…' : '—')
          }
          accent={isCheckedIn && !checkOutTime ? '#FCD34D' : '#FDBA74'}
        />
        {isCheckedIn ? (
          <TimeChip icon="cafe-outline" label="Break" value={breakSummary} accent="#FBBF24" />
        ) : null}
      </View>

      {/* 3 primary actions — checkout only when checked in */}
      <View style={styles.actionsGrid}>
        {showCheck ? (
          <ActionTile
            actionKey="check"
            label={checkLabel}
            icon={isCheckedIn ? 'log-out-outline' : 'log-in-outline'}
            accent={isCheckedIn ? tokens.colors.accentRed : tokens.colors.accentGreen}
            active={isCheckedIn && !isOnBreak && !isOnMeeting}
            disabled={checkDisabled}
            loading={checkInMutation.isPending || checkOutMutation.isPending}
            onPress={handleCheck}
          />
        ) : null}
        {showBreak ? (
          <ActionTile
            actionKey="break"
            label={breakLabel}
            icon={isOnBreak ? 'play-outline' : 'cafe-outline'}
            accent="#FBBF24"
            active={isOnBreak}
            disabled={breakDisabled}
            loading={breakInMutation.isPending || breakOutMutation.isPending}
            onPress={handleBreak}
          />
        ) : null}
        {showMeeting ? (
          <ActionTile
            actionKey="meeting"
            label={meetingLabel}
            icon={isOnMeeting ? 'close-circle-outline' : 'people-outline'}
            accent="#60A5FA"
            active={isOnMeeting}
            disabled={meetingDisabled}
            loading={meetingInMutation.isPending || meetingOutMutation.isPending}
            onPress={handleMeeting}
          />
        ) : null}
      </View>

      {!isCheckedIn && (showBreak || showMeeting) ? (
        <Typography variant="small" muted style={styles.unlockHint}>
          Break & meeting unlock after you check in.
        </Typography>
      ) : null}

      <View style={styles.secondaryRow}>
        <Link href={webHrefToMobile('/dashboard/attendance/my-attendance') as Href} asChild>
          <Pressable style={({ pressed }) => [styles.secondaryLink, pressed && styles.pressed]}>
            <Ionicons name="calendar-outline" size={16} color={tokens.colors.accentBlue} />
            <Typography variant="small" style={styles.secondaryText}>
              My log
            </Typography>
          </Pressable>
        </Link>
        <View style={styles.divider} />
        <Link href={webHrefToMobile('/dashboard/attendance/mark-attendance') as Href} asChild>
          <Pressable style={({ pressed }) => [styles.secondaryLink, pressed && styles.pressed]}>
            <Ionicons name="create-outline" size={16} color={tokens.colors.accentPurple} />
            <Typography variant="small" style={styles.secondaryText}>
              Manual entry
            </Typography>
          </Pressable>
        </Link>
      </View>
    </LiquidGlass>
  );
}

function TimeChip({
  icon,
  label,
  value,
  accent,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={styles.timeChip}>
      <Ionicons name={icon} size={13} color={accent} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography variant="small" muted style={styles.timeLabel}>
          {label}
        </Typography>
        <Typography variant="small" numberOfLines={1} style={[styles.timeValue, { color: accent }]}>
          {value}
        </Typography>
      </View>
    </View>
  );
}

function ActionTile({
  label,
  icon,
  accent,
  active,
  disabled,
  loading,
  onPress,
}: {
  actionKey: ActionKey;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  accent: string;
  active: boolean;
  disabled: boolean;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        styles.actionTile,
        active && { borderColor: accent, backgroundColor: `${accent}22` },
        (disabled || loading) && styles.actionTileDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: `${accent}28` }]}>
        <Ionicons name={icon} size={20} color={accent} />
      </View>
      <Typography variant="small" style={styles.actionLabel} numberOfLines={2}>
        {loading ? '…' : label}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 12,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  timesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    flexGrow: 1,
    flexBasis: '28%',
    minWidth: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: glassUi.border.subtle,
  },
  timeLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  timeValue: {
    fontWeight: '700',
    fontSize: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionTile: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1.5,
    borderColor: glassUi.border.subtle,
    minHeight: 96,
    justifyContent: 'center',
  },
  actionTileDisabled: {
    opacity: 0.42,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontWeight: '700',
    textAlign: 'center',
    color: tokens.colors.textPrimary,
  },
  unlockHint: {
    textAlign: 'center',
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  secondaryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  secondaryText: {
    fontWeight: '600',
    color: tokens.colors.textPrimary,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 16,
    backgroundColor: tokens.colors.overlayBorder,
  },
  pressed: {
    opacity: 0.82,
  },
});
