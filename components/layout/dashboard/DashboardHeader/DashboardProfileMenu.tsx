import { useCallback, useMemo, type ComponentProps } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';

import { LiquidGlass, Typography } from '@/components/ui';
import { AUTH_PATHS, webHrefToMobile } from '@/constants/navigation';
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
import { tokens } from '@/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

type MenuItem = {
  label: string;
  icon: IconName;
  href?: string;
  onPress?: () => void;
  danger?: boolean;
  disabled?: boolean;
  accent?: string;
};

export type DashboardProfileMenuProps = {
  visible: boolean;
  onClose: () => void;
  displayName: string;
  email?: string;
  initials: string;
};

function MenuRow({
  item,
  onSelect,
}: {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}) {
  const color = item.danger ? '#F87171' : item.accent ?? tokens.colors.textPrimary;
  return (
    <Pressable
      onPress={() => onSelect(item)}
      disabled={item.disabled}
      style={({ pressed }) => [
        styles.row,
        pressed && !item.disabled && styles.rowPressed,
        item.disabled && styles.rowDisabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      accessibilityState={{ disabled: Boolean(item.disabled) }}
    >
      <View style={[styles.rowIcon, item.danger && styles.rowIconDanger]}>
        <Ionicons
          name={item.icon}
          size={18}
          color={item.danger ? '#F87171' : item.accent ?? '#A78BFA'}
        />
      </View>
      <Typography variant="medium" style={{ fontWeight: '600', color, flex: 1 }}>
        {item.label}
      </Typography>
      {!item.disabled ? (
        <Ionicons name="chevron-forward" size={16} color={tokens.colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

export function DashboardProfileMenu({
  visible,
  onClose,
  displayName,
  email,
  initials,
}: DashboardProfileMenuProps) {
  const router = useRouter();
  const { logout, hasOperational } = useAuth();

  const selfOk = hasAttendanceSelfOperational(hasOperational);
  const canCheckIn = hasOperational(OP.hrms.attendance.checkIn) || selfOk;
  const canCheckOut = hasOperational(OP.hrms.attendance.checkOut) || selfOk;
  const canBreakIn = hasOperational(OP.hrms.attendance.breakIn) || selfOk;
  const canBreakOut = hasOperational(OP.hrms.attendance.breakOut) || selfOk;
  const canMeetingIn = hasOperational(OP.hrms.attendance.meetingIn) || selfOk;
  const canMeetingOut = hasOperational(OP.hrms.attendance.meetingOut) || selfOk;
  const showAttendance =
    canCheckIn || canCheckOut || canBreakIn || canBreakOut || canMeetingIn || canMeetingOut;

  const { dayState, isLoading } = useTodayAttendanceRow({ enabled: visible && showAttendance });
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

  const attendanceItems = useMemo((): MenuItem[] => {
    if (!showAttendance) return [];
    const items: MenuItem[] = [];

    if (canCheckIn || canCheckOut) {
      items.push({
        label: isCheckedIn ? 'Check out' : 'Check in',
        icon: isCheckedIn ? 'log-out-outline' : 'log-in-outline',
        accent: isCheckedIn ? '#F87171' : '#4ADE80',
        disabled:
          isBusy ||
          (isCheckedIn ? !canCheckOut || isOnBreak || isOnMeeting : !canCheckIn),
        onPress: () => {
          if (isCheckedIn) {
            mutateWithToast(
              (opts) => checkOutMutation.mutate(undefined, opts),
              'Checked out successfully.',
              'Could not check out.',
            );
          } else {
            mutateWithToast(
              (opts) => checkInMutation.mutate(undefined, opts),
              'Checked in successfully.',
              'Could not check in.',
            );
          }
        },
      });
    }

    if (canBreakIn || canBreakOut) {
      items.push({
        label: isOnBreak ? 'End break' : 'Break',
        icon: isOnBreak ? 'play-outline' : 'cafe-outline',
        accent: '#FBBF24',
        disabled:
          isBusy ||
          !isCheckedIn ||
          (isOnBreak ? !canBreakOut : !canBreakIn || isOnMeeting),
        onPress: () => {
          if (isOnBreak) {
            mutateWithToast(
              (opts) => breakOutMutation.mutate(undefined, opts),
              'Break ended.',
              'Could not end break.',
            );
          } else {
            mutateWithToast(
              (opts) => breakInMutation.mutate(undefined, opts),
              'Break started.',
              'Could not start break.',
            );
          }
        },
      });
    }

    if (canMeetingIn || canMeetingOut) {
      items.push({
        label: isOnMeeting ? 'End meeting' : 'Meeting',
        icon: isOnMeeting ? 'close-circle-outline' : 'people-outline',
        accent: '#60A5FA',
        disabled:
          isBusy ||
          !isCheckedIn ||
          isOnBreak ||
          (isOnMeeting ? !canMeetingOut : !canMeetingIn),
        onPress: () => {
          if (isOnMeeting) {
            mutateWithToast(
              (opts) => meetingOutMutation.mutate(undefined, opts),
              'Meeting ended.',
              'Could not end meeting.',
            );
          } else {
            mutateWithToast(
              (opts) => meetingInMutation.mutate(undefined, opts),
              'Meeting started.',
              'Could not start meeting.',
            );
          }
        },
      });
    }

    return items;
  }, [
    breakInMutation,
    breakOutMutation,
    canBreakIn,
    canBreakOut,
    canCheckIn,
    canCheckOut,
    canMeetingIn,
    canMeetingOut,
    checkInMutation,
    checkOutMutation,
    isBusy,
    isCheckedIn,
    isOnBreak,
    isOnMeeting,
    meetingInMutation,
    meetingOutMutation,
    mutateWithToast,
    showAttendance,
  ]);

  const navItems: MenuItem[] = [
    { label: 'My profile', icon: 'person-outline', href: '/dashboard/settings/profile' },
    { label: 'Settings', icon: 'settings-outline', href: '/dashboard/settings' },
    { label: 'Theme', icon: 'color-palette-outline', href: '/dashboard/theme' },
    { label: 'Notifications', icon: 'notifications-outline', href: '/dashboard/notifications' },
    {
      label: 'Log out',
      icon: 'log-out-outline',
      danger: true,
      onPress: async () => {
        await logout();
        router.replace(AUTH_PATHS.login);
      },
    },
  ];

  const onSelect = (item: MenuItem) => {
    if (item.disabled) return;
    // Keep menu open for attendance toggles so user can see state update; close for nav.
    if (item.href || item.danger) {
      onClose();
    }
    if (item.onPress) {
      void item.onPress();
      return;
    }
    if (item.href) router.push(webHrefToMobile(item.href) as Href);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close profile menu">
        <Pressable style={styles.menuAnchor} onPress={(e) => e.stopPropagation()}>
          <LiquidGlass intensity="strong" radius={glassUi.radius.lg} elevated contentStyle={styles.menuCard}>
            <View style={styles.profileBlock}>
              <View style={styles.avatar}>
                <Typography variant="medium16" style={styles.avatarText}>
                  {initials}
                </Typography>
                <View style={styles.onlineDot} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Typography variant="medium16" style={{ fontWeight: '700' }} numberOfLines={1}>
                  {displayName}
                </Typography>
                {email ? (
                  <Typography variant="small" muted numberOfLines={1}>
                    {email}
                  </Typography>
                ) : null}
              </View>
            </View>

            {attendanceItems.length > 0 ? (
              <>
                <View style={styles.divider} />
                <Typography variant="small" muted style={styles.sectionLabel}>
                  Attendance
                </Typography>
                {attendanceItems.map((item) => (
                  <MenuRow key={item.label} item={item} onSelect={onSelect} />
                ))}
              </>
            ) : null}

            <View style={styles.divider} />

            {navItems.map((item) => (
              <MenuRow key={item.label} item={item} onSelect={onSelect} />
            ))}
          </LiquidGlass>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 96,
    paddingRight: 14,
  },
  menuAnchor: {
    width: 280,
    maxWidth: '88%',
  },
  menuCard: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 2,
  },
  profileBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(110, 142, 251, 0.45)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  avatarText: {
    fontWeight: '800',
    color: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#141833',
  },
  sectionLabel: {
    marginHorizontal: 12,
    marginBottom: 4,
    marginTop: 2,
    letterSpacing: 1,
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: glassUi.border.subtle,
    marginVertical: 6,
    marginHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  rowPressed: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  rowDisabled: {
    opacity: 0.45,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
  },
  rowIconDanger: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
  },
});
