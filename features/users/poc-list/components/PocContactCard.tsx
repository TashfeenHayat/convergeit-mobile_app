import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui';
import type { PocListRow } from '@/features/users/poc-list/types';
import { pocInitials } from '@/features/users/poc-list/utils/unwrap-poc-list';
import { glassUi } from '@/lib/theme/glass-ui';
import { useAppTheme } from '@/theme';

function DetailChip({ label }: { label: string }) {
  const theme = useAppTheme();
  const text = label.trim() || '—';
  if (text === '—') return null;
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: theme.app.dashboard.overlayLight,
          borderColor: theme.app.dashboard.cardBorder,
        },
      ]}
    >
      <Typography variant="small" numberOfLines={1}>
        {text}
      </Typography>
    </View>
  );
}

export function PocContactCard({ contact }: { contact: PocListRow }) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const email = contact.pocEmail.trim();
  const hasEmail = email.length > 0 && email !== '—';

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: theme.app.dashboard.cardBorder,
          backgroundColor: theme.app.dashboard.overlayLight,
        },
      ]}
    >
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: `${accent}22`,
            borderColor: glassUi.border.subtle,
          },
        ]}
      >
        <Typography variant="small" style={{ fontWeight: '800', color: accent }}>
          {pocInitials(contact.pocName)}
        </Typography>
      </View>
      <View style={styles.body}>
        <Typography variant="medium16" style={{ fontWeight: '700' }} numberOfLines={1}>
          {contact.pocName}
        </Typography>
        {hasEmail ? (
          <Pressable onPress={() => void Linking.openURL(`mailto:${email}`)}>
            <Typography variant="small" color={accent} numberOfLines={1}>
              {email}
            </Typography>
          </Pressable>
        ) : (
          <Typography variant="small" muted>
            No email
          </Typography>
        )}
        <View style={styles.chips}>
          <DetailChip label={contact.designationTitle} />
          <DetailChip label={contact.departmentName} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '100%',
  },
});
