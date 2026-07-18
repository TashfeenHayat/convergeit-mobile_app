import { Linking, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Typography } from '@/components/ui';
import type { PocListRow } from '@/features/users/poc-list/types';
import { pocInitials } from '@/features/users/poc-list/utils/unwrap-poc-list';
import { glassUi } from '@/lib/theme/glass-ui';
import { useAppTheme } from '@/theme';

export function PocListFlatList({ rows }: { rows: PocListRow[] }) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;

  if (rows.length === 0) return null;

  return (
    <View style={{ gap: 8 }}>
      {rows.map((row) => {
        const email = row.pocEmail.trim();
        const hasEmail = email.length > 0 && email !== '—';
        return (
          <View
            key={row.companyContactId}
            style={[
              styles.row,
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
                {pocInitials(row.pocName)}
              </Typography>
            </View>
            <View style={styles.body}>
              <Typography variant="medium16" style={{ fontWeight: '700' }} numberOfLines={1}>
                {row.pocName}
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
              <Typography variant="small" muted numberOfLines={2}>
                {[row.childCompanyName, row.parentCompanyName, row.resellerName]
                  .filter((v) => v && v !== '—')
                  .join(' · ') || '—'}
              </Typography>
              {row.departmentName !== '—' ? (
                <Typography variant="small" muted numberOfLines={1}>
                  {row.departmentName}
                  {row.designationTitle !== '—' ? ` · ${row.designationTitle}` : ''}
                </Typography>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});
