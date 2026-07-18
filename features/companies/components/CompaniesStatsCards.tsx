import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { MetricCard } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type CompaniesStatsCardsProps = {
  resellerCount: number;
  parentCompanyCount: number;
  childCompanyCount: number;
};

/** Theme-aware overview metrics — mirrors web CompaniesStatsCards. */
export function CompaniesStatsCards({
  resellerCount,
  parentCompanyCount,
  childCompanyCount,
}: CompaniesStatsCardsProps) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;

  return (
    <View style={styles.row}>
      <View style={styles.cell}>
        <MetricCard
          title="Resellers"
          value={String(resellerCount)}
          subtitle="Total"
          showTrendArrow={false}
          valueColor={accent}
          iconBgColor={`${accent}28`}
          icon={<Ionicons name="briefcase-outline" size={20} color={accent} />}
        />
      </View>
      <View style={styles.cell}>
        <MetricCard
          title="Parents"
          value={String(parentCompanyCount)}
          subtitle="Total"
          showTrendArrow={false}
          valueColor={accent}
          iconBgColor={`${accent}28`}
          icon={<Ionicons name="business-outline" size={20} color={accent} />}
        />
      </View>
      <View style={styles.cell}>
        <MetricCard
          title="Children"
          value={String(childCompanyCount)}
          subtitle="Total"
          showTrendArrow={false}
          valueColor={accent}
          iconBgColor={`${accent}28`}
          icon={<Ionicons name="globe-outline" size={20} color={accent} />}
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
