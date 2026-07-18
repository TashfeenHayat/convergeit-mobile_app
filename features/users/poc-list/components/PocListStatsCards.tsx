import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { MetricCard } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type PocListStatsCardsProps = {
  totalContacts: number;
  uniqueResellers: number;
  uniqueOrganizations: number;
  filteredCount: number;
  isFiltering: boolean;
};

export function PocListStatsCards({
  totalContacts,
  uniqueResellers,
  uniqueOrganizations,
  filteredCount,
  isFiltering,
}: PocListStatsCardsProps) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;

  return (
    <View style={styles.row}>
      <View style={styles.cell}>
        <MetricCard
          title="Active contacts"
          value={String(isFiltering ? filteredCount : totalContacts)}
          subtitle={isFiltering ? `/ ${totalContacts} total` : '/ linked'}
          showTrendArrow={false}
          valueColor={accent}
          iconBgColor={`${accent}28`}
          icon={<Ionicons name="people-outline" size={20} color={accent} />}
        />
      </View>
      <View style={styles.cell}>
        <MetricCard
          title="Resellers"
          value={String(uniqueResellers)}
          subtitle="/ with POC"
          showTrendArrow={false}
          valueColor={accent}
          iconBgColor={`${accent}28`}
          icon={<Ionicons name="storefront-outline" size={20} color={accent} />}
        />
      </View>
      <View style={styles.cell}>
        <MetricCard
          title="Child companies"
          value={String(uniqueOrganizations)}
          subtitle="/ covered"
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
