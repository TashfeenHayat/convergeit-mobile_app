import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { MetricCard } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type UsersStatsCardsProps = {
  totalUsers: number;
  internalCount: number;
  externalCount: number;
  showInternal?: boolean;
};

export function UsersStatsCards({
  totalUsers,
  internalCount,
  externalCount,
  showInternal = true,
}: UsersStatsCardsProps) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;

  return (
    <View style={styles.row}>
      <View style={styles.cell}>
        <MetricCard
          title="Total"
          value={String(totalUsers)}
          subtitle="All users"
          showTrendArrow={false}
          valueColor={accent}
          iconBgColor={`${accent}28`}
          icon={<Ionicons name="people-outline" size={20} color={accent} />}
        />
      </View>
      {showInternal ? (
        <View style={styles.cell}>
          <MetricCard
            title="Internal"
            value={String(internalCount)}
            subtitle="Platform"
            showTrendArrow={false}
            valueColor={accent}
            iconBgColor={`${accent}28`}
            icon={<Ionicons name="shield-outline" size={20} color={accent} />}
          />
        </View>
      ) : null}
      <View style={styles.cell}>
        <MetricCard
          title="External"
          value={String(externalCount)}
          subtitle="Clients"
          showTrendArrow={false}
          valueColor={accent}
          iconBgColor={`${accent}28`}
          icon={<Ionicons name="business-outline" size={20} color={accent} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 140,
  },
});
