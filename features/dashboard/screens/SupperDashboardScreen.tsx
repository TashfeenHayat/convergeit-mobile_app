import { RefreshControl } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { MobileScreen } from '@/components/layout';
import { usePlatformOverviewQuery } from '@/lib/hooks/query';
import { useDashboardWidgets } from '@/lib/permissions/use-dashboard-widgets';
import { tokens } from '@/theme/tokens';
import {
  PlatformOverviewDashboard,
  blocksForWidgets,
} from '../components/PlatformOverviewDashboard';

/** Full platform admin dashboard — all overview APIs wired like web SupperDashboardOverview. */
export function SupperDashboardScreen() {
  const queryClient = useQueryClient();
  const widgets = useDashboardWidgets();
  const overviewQuery = usePlatformOverviewQuery();

  const blocks = blocksForWidgets(widgets);
  const visibleBlocks =
    blocks.length > 0
      ? blocks
      : ([
          'primary-metrics',
          'user-metrics',
          'revenue',
          'chat-charts',
          'status-metrics',
          'activity-log',
        ] as const);

  const onRefresh = () => {
    void overviewQuery.refetch();
    void queryClient.invalidateQueries({ queryKey: ['dashboard', 'activity-log'] });
  };

  return (
    <MobileScreen
      refreshControl={
        <RefreshControl
          refreshing={Boolean(overviewQuery.isRefetching)}
          onRefresh={onRefresh}
          tintColor={tokens.colors.accentBlue}
        />
      }
    >
      <PlatformOverviewDashboard blocks={visibleBlocks} />
    </MobileScreen>
  );
}
