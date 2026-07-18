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
  { label: 'Reseller mail', href: '/dashboard/email/setup/reseller', icon: 'mail-outline', hint: 'Own SMTP / API' },
  { label: 'Platform mail', href: '/dashboard/email/setup/platform', icon: 'server-outline', hint: 'Global connection' },
  { label: 'Use platform mail', href: '/dashboard/email/setup/assignment', icon: 'people-outline', hint: 'Assign resellers' },
  { label: 'Email test', href: '/dashboard/email/test', icon: 'flask-outline', hint: 'Send a test message' },
  { label: 'Email designs', href: '/dashboard/email/design', icon: 'color-palette-outline', hint: 'Reseller templates' },
  { label: 'Email forms', href: '/dashboard/email/forms', icon: 'document-text-outline', hint: 'Visitor forms list' },
  { label: 'Distribution', href: '/dashboard/distribution-setup', icon: 'git-network-outline', hint: 'Routing tables' },
  { label: 'Feedback', href: '/dashboard/feedback', icon: 'chatbox-outline', hint: 'Agent feedback' },
];

/** Email & comms hub — routes to live list screens. */
export function EmailHubScreen() {
  const theme = useAppTheme();

  return (
    <MobileScreen>
      <View style={{ gap: theme.spacing.md }}>
        <View>
          <Typography variant="boldLarge">Email & comms</Typography>
          <Typography variant="medium" muted style={{ marginTop: 4 }}>
            SMTP setup, designs, forms, and distribution.
          </Typography>
        </View>

        {LINKS.map((item) => (
          <Link key={item.href} href={webHrefToMobile(item.href) as Href} asChild>
            <Pressable style={({ pressed }) => [pressed && { opacity: 0.88 }]}>
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
