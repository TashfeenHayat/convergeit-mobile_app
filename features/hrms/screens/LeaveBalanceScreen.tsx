import { useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { MobileScreen } from '@/components/layout';
import {
  AppCard,
  DataTable,
  ListTableCard,
  StatusChip,
  Typography,
  type DataTableColumn,
} from '@/components/ui';
import { getLeaveQuotaSummary } from '@/api/hrms/leave-applications.api';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { parseLeaveQuotaSummaryRows } from '@/lib/utils/hrms/leave-quota-display';
import { useAppTheme } from '@/theme';
import { tokens } from '@/theme/tokens';

type QuotaRow = {
  id: string;
  name: string;
  yearlyMax: string;
  approvedDays: string;
  pendingDays: string;
  remainingDays: string;
  usagePct: number;
};

export function LeaveBalanceScreen() {
  const theme = useAppTheme();
  const year = new Date().getFullYear();

  const query = useQuery({
    queryKey: ['hrms', 'leave-quota', year],
    queryFn: () => getLeaveQuotaSummary({ year }),
    staleTime: 5 * 60_000,
  });

  const rows = useMemo((): QuotaRow[] => {
    return parseLeaveQuotaSummaryRows(query.data).map((item) => ({
      id: item.id,
      name: item.name,
      yearlyMax: item.yearlyMax == null ? '—' : String(item.yearlyMax),
      approvedDays: String(item.approvedDays),
      pendingDays: String(item.pendingDays),
      remainingDays: item.remainingDays == null ? '—' : String(item.remainingDays),
      usagePct: item.usagePct,
    }));
  }, [query.data]);

  const columns: DataTableColumn<QuotaRow>[] = useMemo(
    () => [
      { id: 'name', label: 'Leave type', minWidth: 140 },
      { id: 'yearlyMax', label: 'Max', minWidth: 70, align: 'center', cellVariant: 'muted' },
      { id: 'approvedDays', label: 'Approved', minWidth: 90, align: 'center' },
      {
        id: 'pendingDays',
        label: 'Pending',
        minWidth: 90,
        align: 'center',
        render: (value) => {
          const n = Number(value);
          return (
            <StatusChip
              label={String(value ?? '0')}
              tone={n > 0 ? 'warning' : 'neutral'}
            />
          );
        },
      },
      {
        id: 'remainingDays',
        label: 'Remaining',
        minWidth: 100,
        align: 'center',
        render: (value) => (
          <Typography variant="medium16" color={tokens.colors.accentGreen} style={{ fontWeight: '700' }}>
            {String(value ?? '—')}
          </Typography>
        ),
      },
      {
        id: 'usagePct',
        label: 'Usage',
        minWidth: 120,
        render: (_value, row) => (
          <View style={styles.usageCell}>
            <View style={[styles.track, { backgroundColor: theme.app.dashboard.surfaceElevated }]}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${Math.min(100, Math.max(0, row.usagePct))}%`,
                    backgroundColor: theme.app.dashboard.accentBlue,
                  },
                ]}
              />
            </View>
            <Typography variant="small" muted>
              {Math.round(row.usagePct)}%
            </Typography>
          </View>
        ),
      },
    ],
    [theme.app.dashboard.accentBlue, theme.app.dashboard.surfaceElevated],
  );

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: theme.spacing.screen }]}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isLoading}
            onRefresh={() => void query.refetch()}
            tintColor={theme.app.dashboard.accentBlue}
          />
        }
      >
        <View style={{ gap: theme.spacing.md }}>
          <View style={{ gap: theme.spacing.xs }}>
            <Typography variant="boldLarge">Leave Balance</Typography>
            <Typography variant="medium" muted>
              Quota summary for {year}.
            </Typography>
          </View>

          {query.isError ? (
            <AppCard>
              <Typography variant="medium" color={theme.app.danger}>
                {extractApiErrorMessage(query.error, 'Could not load leave balance.')}
              </Typography>
            </AppCard>
          ) : (
            <ListTableCard
              title="Leave quotas"
              subtitle={`${rows.length} leave type${rows.length === 1 ? '' : 's'} · ${year}`}
              icon="wallet-outline"
              footer={
                <Typography variant="small" muted>
                  {rows.length === 0 ? 'No quota data' : `${rows.length} types configured`}
                </Typography>
              }
            >
              {query.isLoading && !query.data ? (
                <View style={styles.centered}>
                  <ActivityIndicator color={theme.app.dashboard.accentBlue} />
                </View>
              ) : (
                <DataTable
                  columns={columns}
                  rows={rows}
                  getRowId={(row) => row.id}
                  minWidth={620}
                  size="medium"
                  emptyState={{
                    title: 'No leave quota data',
                    description: 'No leave types are configured for this year yet.',
                    icon: 'wallet-outline',
                  }}
                />
              )}
            </ListTableCard>
          )}
        </View>
      </ScrollView>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
  scroll: { paddingBottom: 32 },
  centered: { minHeight: 120, alignItems: 'center', justifyContent: 'center' },
  usageCell: { gap: 4, width: 100 },
  track: { height: 6, borderRadius: 999, overflow: 'hidden', width: '100%' },
  fill: { height: '100%', borderRadius: 999 },
});
