import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import { MobileScreen } from '@/components/layout';
import { AppCard, Typography } from '@/components/ui';
import { webHrefToMobile } from '@/constants/navigation';
import { useAppTheme } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const LINKS: { label: string; href: string; icon: IconName; hint: string }[] = [
  { label: 'Departments', href: '/dashboard/departments', icon: 'business-outline', hint: 'Org structure' },
  { label: 'Designations', href: '/dashboard/designations', icon: 'ribbon-outline', hint: 'Job titles' },
  { label: 'Pools', href: '/dashboard/pools', icon: 'people-outline', hint: 'Agent pools' },
  { label: 'Shifts', href: '/dashboard/shifts', icon: 'time-outline', hint: 'Shift definitions' },
  { label: 'Leave types', href: '/dashboard/leave/leave-type', icon: 'calendar-outline', hint: 'Leave catalog' },
  { label: 'Mark attendance', href: '/dashboard/attendance/mark-attendance', icon: 'finger-print-outline', hint: 'Check in / out' },
  { label: 'My attendance', href: '/dashboard/attendance/my-attendance', icon: 'today-outline', hint: 'Your log' },
  { label: 'Apply leave', href: '/dashboard/leave/apply-leave', icon: 'airplane-outline', hint: 'New request' },
  { label: 'Approve leave', href: '/dashboard/leave/approve-leave', icon: 'checkmark-done-outline', hint: 'Team inbox' },
];

/** HRMS module hub — links to live mobile screens. */
export function HrmsHubScreen() {
  const theme = useAppTheme();

  return (
    <MobileScreen>
      <View style={{ gap: theme.spacing.md }}>
        <View>
          <Typography variant="boldLarge">HRMS</Typography>
          <Typography variant="medium" muted style={{ marginTop: 4 }}>
            Attendance, leave, departments, pools, and shifts.
          </Typography>
        </View>

        {LINKS.map((item) => (
          <Link key={item.href} href={webHrefToMobile(item.href) as Href} asChild>
            <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.88 }]}>
              <AppCard style={styles.card}>
                <View style={styles.iconWrap}>
                  <Ionicons name={item.icon} size={20} color={theme.app.dashboard.accentBlue} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Typography variant="medium16" style={{ fontWeight: '600' }}>
                    {item.label}
                  </Typography>
                  <Typography variant="small" muted>
                    {item.hint}
                  </Typography>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.app.dashboard.textMuted} />
              </AppCard>
            </Pressable>
          </Link>
        ))}
      </View>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  row: {},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 132, 255, 0.15)',
  },
});
