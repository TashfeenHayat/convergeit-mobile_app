import { useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import type { ComponentProps } from 'react';

import {
  DashboardCard,
  DataTable,
  Dropdown,
  HeroMetricCard,
  LiquidGlass,
  MetricCard,
  SegmentedControl,
  TablePagination,
  Typography,
} from '@/components/ui';
import { fetchAuditLogs } from '@/api/observability/observability-logs.api';
import { usePlatformOverviewQuery } from '@/lib/hooks/query';
import type { DashboardWidgetFlags } from '@/lib/permissions/use-dashboard-widgets';
import { useAppTheme } from '@/theme';
import { tokens } from '@/theme/tokens';
import {
  formatCount,
  formatCurrency,
  mapAuditRow,
  trendAccentProgress,
  trendSubtitle,
  type ActivityLogRow,
} from '../utils/platform-overview-format';
import {
  ChatAnalyticsBarChartView,
  DepartmentPieChartView,
  RevenueLineChartView,
} from './PlatformOverviewCharts';
import { DashboardSectionHeader } from './DashboardSectionHeader';
import { DashboardMetricGrid } from './DashboardMetricGrid';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type PlatformDashboardBlock =
  | 'primary-metrics'
  | 'user-metrics'
  | 'revenue'
  | 'chat-charts'
  | 'status-metrics'
  | 'activity-log';

const ALL_PLATFORM_BLOCKS: readonly PlatformDashboardBlock[] = [
  'primary-metrics',
  'user-metrics',
  'revenue',
  'chat-charts',
  'status-metrics',
  'activity-log',
];

const DATE_RANGE_OPTIONS = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days'] as const;
const DATE_RANGE_DAYS: Record<(typeof DATE_RANGE_OPTIONS)[number], number> = {
  'Last 7 Days': 7,
  'Last 30 Days': 30,
  'Last 90 Days': 90,
};

export function blocksForWidgets(widgets: DashboardWidgetFlags): PlatformDashboardBlock[] {
  const blocks: PlatformDashboardBlock[] = [];
  if (widgets.orgSummary) blocks.push('primary-metrics');
  if (widgets.platformOverview) {
    blocks.push('user-metrics', 'chat-charts', 'status-metrics', 'activity-log');
  }
  if (widgets.revenue) blocks.push('revenue');
  return blocks;
}

type PlatformOverviewDashboardProps = {
  blocks?: readonly PlatformDashboardBlock[];
  showHeader?: boolean;
  showDateFilter?: boolean;
  /** Hide section chrome when nested inside home dashboard. */
  embedded?: boolean;
};

export function PlatformOverviewDashboard({
  blocks = ALL_PLATFORM_BLOCKS,
  showHeader = true,
  showDateFilter = true,
  embedded = false,
}: PlatformOverviewDashboardProps) {
  const theme = useAppTheme();
  const showBlock = (block: PlatformDashboardBlock) => blocks.includes(block);
  const showDateHeader =
    showDateFilter &&
    (showBlock('primary-metrics') ||
      showBlock('user-metrics') ||
      showBlock('revenue') ||
      showBlock('chat-charts') ||
      showBlock('status-metrics'));

  const [dateRangeValue, setDateRangeValue] =
    useState<(typeof DATE_RANGE_OPTIONS)[number]>('Last 30 Days');
  const [revenueGranularity, setRevenueGranularity] = useState<'weekly' | 'monthly' | 'today'>(
    'monthly',
  );
  const [chatAnalyticsWindow, setChatAnalyticsWindow] = useState<'7days' | 'monthly'>('7days');
  const [activityPage, setActivityPage] = useState(1);

  const days = DATE_RANGE_DAYS[dateRangeValue];
  const overviewQuery = usePlatformOverviewQuery({
    days,
    revenueGranularity,
    chatAnalyticsWindow,
  });
  const auditLogsQuery = useQuery({
    queryKey: ['dashboard', 'activity-log', activityPage],
    queryFn: () => fetchAuditLogs({ page: activityPage, limit: 10 }),
    enabled: showBlock('activity-log'),
    staleTime: 60_000,
  });

  const loading = overviewQuery.isLoading && !overviewQuery.data;
  const metrics = overviewQuery.data?.metrics;
  const currency = overviewQuery.data?.currency ?? 'USD';

  const activityRows = useMemo(
    () => (auditLogsQuery.data?.items ?? []).map(mapAuditRow),
    [auditLogsQuery.data?.items],
  );
  const activityPageCount = auditLogsQuery.data?.totalPages ?? 1;

  const departmentChartData =
    overviewQuery.data?.chatsByDepartment.length
      ? overviewQuery.data.chatsByDepartment
      : [{ name: 'No data', value: 1, color: 'rgba(255,255,255,0.2)' }];

  const activityColumns = useMemo(
    () => [
      { id: 'activityType', label: 'Activity', minWidth: 120 },
      { id: 'user', label: 'User', minWidth: 120 },
      { id: 'module', label: 'Module', minWidth: 100 },
      { id: 'date', label: 'Date', minWidth: 72, cellVariant: 'muted' as const },
      { id: 'time', label: 'Time', minWidth: 72, cellVariant: 'muted' as const },
    ],
    [],
  );

  if (overviewQuery.isError) {
    return (
      <DashboardCard>
        <Typography variant="medium" muted>
          Couldn’t load platform metrics. Pull to refresh.
        </Typography>
      </DashboardCard>
    );
  }

  return (
    <View style={{ gap: theme.spacing.lg }}>
      {showHeader ? (
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Typography variant="label" muted style={styles.eyebrow}>
              Platform administration
            </Typography>
            <Typography variant="boldLarge">Analytics</Typography>
          </View>
          {overviewQuery.isFetching ? (
            <ActivityIndicator size="small" color={tokens.colors.accentBlue} />
          ) : null}
        </View>
      ) : embedded ? null : (
        <DashboardSectionHeader
          title="Platform analytics"
          subtitle="Live metrics from your workspace"
          icon="analytics-outline"
          iconColor={tokens.colors.accentBlue}
          trailing={
            overviewQuery.isFetching ? (
              <ActivityIndicator size="small" color={tokens.colors.accentBlue} />
            ) : null
          }
        />
      )}

      {showDateHeader ? (
        <LiquidGlass intensity="subtle" radius={14} contentStyle={styles.filterChip}>
          <Ionicons name="options-outline" size={16} color={tokens.colors.textMuted} />
          <View style={styles.filterDropdown}>
            <Dropdown
              options={[...DATE_RANGE_OPTIONS]}
              value={dateRangeValue}
              onChange={(value) =>
                setDateRangeValue(value as (typeof DATE_RANGE_OPTIONS)[number])
              }
              variant="text"
            />
          </View>
        </LiquidGlass>
      ) : null}

      {showBlock('primary-metrics') ? (
        <View style={styles.metricSection}>
          <DashboardSectionHeader title="Overview" icon="grid-outline" iconColor="#0084FF" />
          <HeroMetricCard
            title="Today Total Chats"
            value={formatCount(metrics?.todayTotalChats.current, loading)}
            subtitle={trendSubtitle(metrics?.todayTotalChats, loading)}
            showTrendArrow={!loading && (metrics?.todayTotalChats.changePercent ?? 0) > 0}
            icon={<MetricIcon name="chatbubbles" color="#FFFFFF" />}
          />
          <DashboardMetricGrid>
            <MetricCard
              title="Total Companies"
              value={formatCount(metrics?.totalCompanies.current, loading)}
              subtitle={trendSubtitle(metrics?.totalCompanies, loading)}
              showTrendArrow={!loading && (metrics?.totalCompanies.changePercent ?? 0) > 0}
              accentProgress={trendAccentProgress(metrics?.totalCompanies, loading)}
              valueColor={tokens.colors.accentOrange}
              iconBgColor="rgba(249, 115, 22, 0.16)"
              icon={<MetricIcon name="business" color={tokens.colors.accentOrange} />}
            />
            <MetricCard
              title="Active Websites"
              value={formatCount(metrics?.totalActiveWebsites.current, loading)}
              subtitle={trendSubtitle(metrics?.totalActiveWebsites, loading)}
              showTrendArrow={!loading && (metrics?.totalActiveWebsites.changePercent ?? 0) > 0}
              accentProgress={trendAccentProgress(metrics?.totalActiveWebsites, loading)}
              iconBgColor="rgba(88, 101, 242, 0.18)"
              icon={<MetricIcon name="globe" color={tokens.colors.accentBlue} />}
            />
          </DashboardMetricGrid>
        </View>
      ) : null}

      {showBlock('user-metrics') ? (
        <MetricSection title="Users & chats" icon="people" iconColor={tokens.colors.accentPurple}>
          <MetricCard
            title="Active Users"
            value={formatCount(metrics?.totalActiveUsers.current, loading)}
            subtitle={trendSubtitle(metrics?.totalActiveUsers, loading)}
            showTrendArrow={!loading && (metrics?.totalActiveUsers.changePercent ?? 0) > 0}
            accentProgress={trendAccentProgress(metrics?.totalActiveUsers, loading)}
            valueColor={tokens.colors.accentPurple}
            iconBgColor="rgba(168, 85, 247, 0.16)"
            icon={<MetricIcon name="people" color={tokens.colors.accentPurple} />}
          />
          <MetricCard
            title="Live Chat"
            value={formatCount(metrics?.liveChats.current, loading)}
            subtitle={trendSubtitle(metrics?.liveChats, loading)}
            showTrendArrow={!loading && (metrics?.liveChats.changePercent ?? 0) > 0}
            accentProgress={trendAccentProgress(metrics?.liveChats, loading)}
            valueColor={tokens.colors.accentPink}
            iconBgColor="rgba(236, 72, 153, 0.18)"
            icon={<MetricIcon name="headset" color={tokens.colors.accentPink} />}
          />
          <MetricCard
            title="Closed Today"
            value={formatCount(metrics?.todayClosedChats.current, loading)}
            subtitle={trendSubtitle(metrics?.todayClosedChats, loading)}
            showTrendArrow={!loading && (metrics?.todayClosedChats.changePercent ?? 0) > 0}
            accentProgress={trendAccentProgress(metrics?.todayClosedChats, loading)}
            valueColor={tokens.colors.accentGreen}
            iconBgColor="rgba(34, 197, 94, 0.16)"
            icon={<MetricIcon name="checkmark-circle" color={tokens.colors.accentGreen} />}
          />
        </MetricSection>
      ) : null}

      {showBlock('revenue') ? (
        <View style={styles.revenueSection}>
          <MetricSection title="Revenue" icon="cash-outline" iconColor={tokens.colors.accentPink}>
            <MetricCard
              title="Monthly Revenue"
              value={formatCurrency(metrics?.monthlyRevenue.current, currency, loading)}
              subtitle={trendSubtitle(metrics?.monthlyRevenue, loading)}
              showTrendArrow={!loading && (metrics?.monthlyRevenue.changePercent ?? 0) > 0}
              accentProgress={trendAccentProgress(metrics?.monthlyRevenue, loading)}
              valueColor={tokens.colors.accentPink}
              iconBgColor="rgba(236, 72, 153, 0.18)"
              icon={<MetricIcon name="cash" color={tokens.colors.accentPink} />}
            />
            <MetricCard
              title="Today Revenue"
              value={formatCurrency(metrics?.todayRevenue.current, currency, loading)}
              subtitle={trendSubtitle(metrics?.todayRevenue, loading)}
              showTrendArrow={!loading && (metrics?.todayRevenue.changePercent ?? 0) > 0}
              accentProgress={trendAccentProgress(metrics?.todayRevenue, loading)}
              iconBgColor="rgba(0, 132, 255, 0.2)"
              icon={<MetricIcon name="today" color="#0084FF" />}
            />
          </MetricSection>

          <DashboardCard style={styles.chartCard}>
            <View style={styles.chartHeaderRow}>
              <ChartCardHeader
                title="Revenue overview"
                icon="trending-up-outline"
                iconColor={tokens.colors.accentPink}
              />
              <SegmentedControl
                options={[
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'today', label: 'Today' },
                ]}
                value={revenueGranularity}
                onChange={(value) =>
                  setRevenueGranularity(value as 'weekly' | 'monthly' | 'today')
                }
                style={styles.segmented}
              />
            </View>
            <RevenueLineChartView data={overviewQuery.data?.revenueChart ?? []} />
          </DashboardCard>
        </View>
      ) : null}

      {showBlock('chat-charts') ? (
        <View style={styles.chartStack}>
          <DashboardCard style={styles.chartCard}>
            <View style={styles.chartHeaderRow}>
              <ChartCardHeader
                title="Chat analytics"
                icon="bar-chart-outline"
                iconColor={tokens.colors.accentBlue}
              />
              <SegmentedControl
                options={[
                  { value: 'monthly', label: 'Monthly' },
                  { value: '7days', label: '7 days' },
                ]}
                value={chatAnalyticsWindow}
                onChange={(value) => setChatAnalyticsWindow(value as '7days' | 'monthly')}
                style={styles.segmented}
              />
            </View>
            <ChatAnalyticsBarChartView data={overviewQuery.data?.chatAnalytics ?? []} />
          </DashboardCard>

          <DashboardCard style={styles.chartCard}>
            <ChartCardHeader
              title="Chats by department"
              icon="ellipse-outline"
              iconColor={tokens.colors.accentPurple}
            />
            <DepartmentPieChartView data={departmentChartData} />
          </DashboardCard>
        </View>
      ) : null}

      {showBlock('status-metrics') ? (
        <MetricSection title="System status" icon="pulse-outline" iconColor={tokens.colors.accentGreen}>
          <MetricCard
            title="Agents Online"
            value={
              loading ? '—' : `${metrics?.agentsOnline ?? 0}/${metrics?.agentsTotal ?? 0}`
            }
            subtitle="Agents accepting chats"
            showTrendArrow={false}
            valueColor={tokens.colors.accentCyan}
            iconBgColor="rgba(103, 232, 249, 0.14)"
            icon={<MetricIcon name="person" color={tokens.colors.accentCyan} />}
          />
          <MetricCard
            title="License Missing"
            value={formatCount(metrics?.licensesMissing, loading)}
            subtitle="Companies without license"
            showTrendArrow={false}
            valueColor={tokens.colors.accentRed}
            subtitleColor={tokens.colors.accentRed}
            iconBgColor="rgba(239, 68, 68, 0.16)"
            icon={<MetricIcon name="warning" color={tokens.colors.accentRed} />}
          />
          <MetricCard
            title="Platform Fees"
            value={formatCurrency(metrics?.platformFeesReceived.current, currency, loading)}
            subtitle={trendSubtitle(metrics?.platformFeesReceived, loading)}
            showTrendArrow={!loading && (metrics?.platformFeesReceived.changePercent ?? 0) > 0}
            accentProgress={trendAccentProgress(metrics?.platformFeesReceived, loading)}
            iconBgColor="rgba(0, 132, 255, 0.2)"
            icon={<MetricIcon name="card" color="#0084FF" />}
          />
          <MetricCard
            title="System Status"
            value={
              loading
                ? '—'
                : metrics?.systemStatus === 'operational'
                  ? 'Operational'
                  : 'Degraded'
            }
            subtitle={metrics?.systemStatusDetail ?? 'Checking services'}
            showTrendArrow={false}
            valueColor={tokens.colors.accentGreen}
            iconBgColor="rgba(34, 197, 94, 0.16)"
            icon={<MetricIcon name="checkmark-circle" color={tokens.colors.accentGreen} />}
          />
        </MetricSection>
      ) : null}

      {showBlock('activity-log') ? (
        <DashboardCard style={styles.chartCard}>
          <ChartCardHeader
            title="Recent activity"
            icon="list-outline"
            iconColor={tokens.colors.accentCyan}
          />
          <DataTable<ActivityLogRow>
            columns={activityColumns}
            rows={activityRows}
            getRowId={(row) => row.id}
            isLoading={auditLogsQuery.isLoading}
            minWidth={560}
            emptyState={{
              title: 'No activity found',
              description: 'Audit events will appear here as users interact with the platform.',
              icon: 'time-outline',
            }}
          />
          {activityPageCount > 1 ? (
            <View style={styles.pagination}>
              <TablePagination
                page={activityPage}
                pageCount={activityPageCount}
                onPageChange={setActivityPage}
              />
            </View>
          ) : null}
        </DashboardCard>
      ) : null}
    </View>
  );
}

function MetricSection({
  title,
  icon,
  iconColor,
  children,
}: {
  title: string;
  icon: IconName;
  iconColor: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.metricSection}>
      <DashboardSectionHeader title={title} icon={icon} iconColor={iconColor} />
      <DashboardMetricGrid>{children}</DashboardMetricGrid>
    </View>
  );
}

function ChartCardHeader({
  title,
  icon,
  iconColor,
}: {
  title: string;
  icon: IconName;
  iconColor: string;
}) {
  return (
    <View style={styles.chartTitleRow}>
      <View style={[styles.chartIconWell, { backgroundColor: `${iconColor}22` }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Typography variant="medium16" style={styles.chartTitle}>
        {title}
      </Typography>
    </View>
  );
}

function MetricIcon({ name, color }: { name: IconName; color: string }) {
  return <Ionicons name={name} size={20} color={color} />;
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontWeight: '600',
    marginBottom: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  filterDropdown: {
    flex: 1,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  chartIconWell: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTitle: {
    fontWeight: '700',
    flex: 1,
  },
  metricSection: {
    gap: 8,
  },
  revenueSection: {
    gap: 12,
  },
  chartStack: {
    gap: 12,
  },
  chartCard: {
    gap: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chartHeaderRow: {
    gap: 14,
  },
  segmented: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pagination: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
});
