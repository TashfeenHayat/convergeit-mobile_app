import Ionicons from "@expo/vector-icons/Ionicons";

import { MetricCard } from "@/components/ui";
import { DashboardMetricGrid } from "@/features/dashboard/components/DashboardMetricGrid";
import { useAppTheme } from "@/theme";

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
    <DashboardMetricGrid>
      <MetricCard
        title="Resellers"
        value={String(resellerCount)}
        subtitle="Total"
        showTrendArrow={false}
        valueColor={accent}
        iconBgColor={`${accent}28`}
        icon={<Ionicons name="briefcase-outline" size={20} color={accent} />}
      />
      <MetricCard
        title="Parents"
        value={String(parentCompanyCount)}
        subtitle="Total"
        showTrendArrow={false}
        valueColor={accent}
        iconBgColor={`${accent}28`}
        icon={<Ionicons name="business-outline" size={20} color={accent} />}
      />
      <MetricCard
        title="Children"
        value={String(childCompanyCount)}
        subtitle="Total"
        showTrendArrow={false}
        valueColor={accent}
        iconBgColor={`${accent}28`}
        icon={<Ionicons name="globe-outline" size={20} color={accent} />}
      />
    </DashboardMetricGrid>
  );
}
