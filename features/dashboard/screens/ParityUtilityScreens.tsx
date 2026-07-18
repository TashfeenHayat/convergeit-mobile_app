import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { MobileScreen } from '@/components/layout';
import { AppCard, Button, DashboardCard, InputField, Typography } from '@/components/ui';
import { useAppTheme } from '@/theme';
import {
  loadDashboardAppearanceFromStorage,
  saveDashboardAppearanceToStorage,
} from '@/lib/dashboard-appearance/persist';
import { defaultDashboardAppearance } from '@/lib/dashboard-appearance/defaults';

export function ThemeSettingsPage() {
  const theme = useAppTheme();
  const stored = loadDashboardAppearanceFromStorage();
  const [accent, setAccent] = useState(stored.accents?.navActiveIconHex || '#5865F2');

  return (
    <MobileScreen>
      <View style={{ gap: theme.spacing.md }}>
        <DashboardCard style={{ gap: theme.spacing.sm }}>
          <Typography variant="boldLarge">Theme</Typography>
          <Typography variant="medium" muted>
            Appearance accents for the mobile shell (synced storage is web-safe).
          </Typography>
        </DashboardCard>
        <AppCard style={{ gap: theme.spacing.md }}>
          <InputField label="Accent hex" value={accent} onChangeText={setAccent} placeholder="#5865F2" />
          <Button
            onPress={() => {
              const next = {
                ...defaultDashboardAppearance,
                ...stored,
                accents: {
                  ...defaultDashboardAppearance.accents,
                  ...stored.accents,
                  navActiveIconHex: accent.trim() || '#5865F2',
                },
              };
              saveDashboardAppearanceToStorage(next);
              Alert.alert('Saved', 'Theme preference stored.');
            }}
          >
            Save theme
          </Button>
        </AppCard>
      </View>
    </MobileScreen>
  );
}

export function RoleDashboardPage({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  const theme = useAppTheme();
  const router = useRouter();
  const links = [
    { label: 'Chat Operations', href: '/chat-operations' },
    { label: 'My Attendance', href: '/attendance/my-attendance' },
    { label: 'Apply Leave', href: '/leave/apply-leave' },
    { label: 'Notifications', href: '/notifications' },
    { label: 'Reports', href: '/reports' },
  ];

  return (
    <MobileScreen>
      <View style={{ gap: theme.spacing.md }}>
        <DashboardCard style={{ gap: theme.spacing.sm }}>
          <Typography variant="boldLarge">{title}</Typography>
          <Typography variant="medium" muted>
            {subtitle}
          </Typography>
        </DashboardCard>
        {links.map((l) => (
          <Button key={l.href} variant="outlined" onPress={() => router.push(l.href as never)}>
            {l.label}
          </Button>
        ))}
      </View>
    </MobileScreen>
  );
}

export function PayTokenPage() {
  const theme = useAppTheme();
  const { token } = useLocalSearchParams<{ token?: string }>();
  return (
    <MobileScreen>
      <AppCard style={{ gap: theme.spacing.md }}>
        <Typography variant="boldLarge">Payment link</Typography>
        <Typography variant="medium" muted>
          Token: {token || '—'}
        </Typography>
        <Typography variant="medium" muted>
          Open this link on the web checkout if native Stripe sheet is not configured for this build.
        </Typography>
        <Button
          onPress={() =>
            Alert.alert('Checkout', 'Continue payment in the hosted pay page when available.')
          }
        >
          Continue
        </Button>
      </AppCard>
    </MobileScreen>
  );
}

export function RatePage() {
  const theme = useAppTheme();
  const [score, setScore] = useState('5');
  const [note, setNote] = useState('');
  return (
    <MobileScreen>
      <AppCard style={{ gap: theme.spacing.md }}>
        <Typography variant="boldLarge">Rate your experience</Typography>
        <InputField label="Score (1-5)" value={score} onChangeText={setScore} />
        <InputField label="Note" value={note} onChangeText={setNote} />
        <Button onPress={() => Alert.alert('Thanks', 'Feedback submitted.')}>Submit</Button>
      </AppCard>
    </MobileScreen>
  );
}

export function OAuthCallbackPage() {
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const error = typeof params.error === 'string' ? params.error : null;
  return (
    <MobileScreen>
      <AppCard style={{ gap: theme.spacing.md }}>
        <Typography variant="boldLarge">{error ? 'Connection failed' : 'Connected'}</Typography>
        <Typography variant="medium" muted>
          {error
            ? error
            : 'OAuth completed. You can return to Integrations.'}
        </Typography>
        <Button onPress={() => router.replace('/integrations' as never)}>Back to Integrations</Button>
      </AppCard>
    </MobileScreen>
  );
}
