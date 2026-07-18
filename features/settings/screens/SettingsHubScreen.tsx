import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { MobileScreen } from '@/components/layout';
import { DashboardCard, Typography } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useAppTheme } from '@/theme';
import { tokens } from '@/theme/tokens';

const SETTINGS_LINKS = [
  {
    label: 'Profile',
    href: '/settings/profile/index' as const,
    icon: 'person-outline' as const,
    hint: 'Name, email, and account details',
  },
  {
    label: 'Notifications',
    href: '/notifications/index' as const,
    icon: 'notifications-outline' as const,
    hint: 'Alerts and unread updates',
  },
] as const;

export function SettingsHubScreen() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Account';

  return (
    <MobileScreen>
      <View style={{ gap: theme.spacing.md }}>
        <DashboardCard style={{ gap: theme.spacing.sm }}>
          <Typography variant="small" muted style={styles.eyebrow}>
            Account
          </Typography>
          <Typography variant="boldLarge">Settings</Typography>
          <Typography variant="medium" muted>
            Preferences for {name}.
          </Typography>
        </DashboardCard>

        <View style={{ gap: theme.spacing.sm }}>
          {SETTINGS_LINKS.map((item) => (
            <Link key={item.href} href={item.href as Href} asChild>
              <Pressable
                style={({ pressed }) => [styles.linkRow, pressed && styles.linkPressed]}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={styles.linkIcon}>
                  <Ionicons name={item.icon} size={18} color={tokens.colors.accentBlue} />
                </View>
                <View style={styles.linkText}>
                  <Typography variant="medium16" style={{ fontWeight: '600' }}>
                    {item.label}
                  </Typography>
                  <Typography variant="small" muted>
                    {item.hint}
                  </Typography>
                </View>
                <Ionicons name="chevron-forward" size={16} color={tokens.colors.textMuted} />
              </Pressable>
            </Link>
          ))}
        </View>
      </View>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    backgroundColor: 'rgba(26, 28, 36, 0.55)',
  },
  linkPressed: {
    opacity: 0.88,
    backgroundColor: 'rgba(88, 101, 242, 0.1)',
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(88, 101, 242, 0.14)',
  },
  linkText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
