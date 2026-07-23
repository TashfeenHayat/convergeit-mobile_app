import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import {
  AppCard,
  Button,
  ListTableCard,
  SelectField,
  Typography,
} from '@/components/ui';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useLeaveQuotaSummaryQuery } from '@/lib/hooks/query/hrms';
import {
  formatLeaveDayCount,
  parseLeaveQuotaSummaryRows,
} from '@/lib/utils/hrms/leave-quota-display';
import { useAppTheme } from '@/theme';

function buildYearOptions(centerYear: number) {
  const years: number[] = [];
  for (let y = centerYear - 2; y <= centerYear + 1; y += 1) {
    years.push(y);
  }
  return years.map((y) => ({ value: String(y), label: String(y) }));
}

/**
 * Leave Balance — quota summary for selected year.
 * Network: GET /hrms/leave-applications/quota-summary?year=
 */
export function LeaveBalanceScreen() {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  /** GET /hrms/leave-applications/quota-summary?year=… */
  const query = useLeaveQuotaSummaryQuery(
    { year },
    { enabled: true, scope: 'leave-balance' },
  );

  const rows = useMemo(
    () => parseLeaveQuotaSummaryRows(query.data),
    [query.data],
  );

  const yearOptions = useMemo(
    () => buildYearOptions(currentYear),
    [currentYear],
  );

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isLoading}
            onRefresh={() => void query.refetch()}
            tintColor={accent}
          />
        } showsVerticalScrollIndicator={false}>
        <DashboardPageIntro subtitle="View approved leave counts and remaining quota for the selected year." />

        {query.isError ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(
                query.error,
                'Could not load leave balance.',
              )}
            </Typography>
            <Button
              size="compact"
              variant="outlined"
              onPress={() => void query.refetch()}
            >
              Retry
            </Button>
          </AppCard>
        ) : (
          <ListTableCard
            title="Quota summary"
            subtitle="Approved leave days counted against your yearly limits."
            icon="calendar-outline"
            toolbar={
              <View style={styles.yearField}>
                <SelectField
                  label="Year"
                  value={String(year)}
                  onChange={(v) => {
                    const n = Number(v);
                    if (Number.isFinite(n)) setYear(n);
                  }}
                  options={yearOptions}
 />
              </View>
            }
          >
            {query.isLoading && !query.data ? (
              <View style={styles.centered}>
                <ActivityIndicator color={accent} />
                <Typography variant="small" muted>
                  Loading…
                </Typography>
              </View>
            ) : rows.length === 0 ? (
              <View style={styles.empty}>
                <View
                  style={[
                    styles.emptyIcon,
                    {
                      backgroundColor: `${accent}22`,
                      borderColor: theme.app.dashboard.cardBorder,
                    },
                  ]}
                >
                  <Ionicons name="calendar-outline" size={28} color={accent} />
                </View>
                <Typography variant="medium" style={{ fontWeight: '700' }}>
                  No quota data
                </Typography>
                <Typography variant="small" muted style={{ textAlign: 'center' }}>
                  No leave types are configured for {year} yet.
                </Typography>
              </View>
            ) : (
              <View style={{ gap: 14 }}>
                {rows.map((row) => {
                  const usedLabel = formatLeaveDayCount(row.approvedDays);
                  const maxLabel =
                    row.yearlyMax == null
                      ? '—'
                      : formatLeaveDayCount(row.yearlyMax);
                  return (
                    <View
                      key={row.id}
                      style={[
                        styles.quotaBlock,
                        {
                          borderColor: theme.app.dashboard.cardBorder,
                          backgroundColor: theme.app.dashboard.overlayLight,
                        },
                      ]}
                    >
                      <View style={styles.quotaHeader}>
                        <Typography
                          variant="medium16"
                          style={{ fontWeight: '700', flex: 1 }}
                          numberOfLines={2}
                        >
                          {row.name}
                        </Typography>
                        <Typography variant="small" muted>
                          {usedLabel} / {maxLabel}
                        </Typography>
                      </View>

                      <View
                        style={[
                          styles.track,
                          {
                            backgroundColor:
                              theme.app.dashboard.surfaceElevated,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.fill,
                            {
                              width: `${Math.min(100, Math.max(0, row.usagePct))}%`,
                              backgroundColor: accent,
                            },
                          ]}
 />
                      </View>

                      <View style={styles.statsGrid}>
                        <StatCell
                          label="Approved leaves"
                          value={formatLeaveDayCount(row.approvedDays)}
 />
                        <StatCell
                          label="Pending"
                          value={formatLeaveDayCount(row.pendingDays)}
 />
                        <StatCell
                          label="Remaining"
                          value={
                            row.remainingDays == null
                              ? '—'
                              : formatLeaveDayCount(row.remainingDays)
                          }
 />
                        <StatCell
                          label="Yearly limit"
                          value={
                            row.yearlyMax == null
                              ? '—'
                              : formatLeaveDayCount(row.yearlyMax)
                          }
 />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ListTableCard>
        )}
      </ScrollView>
    </MobileScreen>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCell}>
      <Typography variant="small" muted>
        {label}
      </Typography>
      <Typography variant="medium" style={{ fontWeight: '600' }}>
        {value}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12, paddingHorizontal: 8 },
  scroll: { paddingBottom: 32 },
  yearField: { minWidth: 110, maxWidth: 140 },
  centered: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  empty: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  quotaBlock: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  quotaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  track: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
  },
  fill: { height: '100%', borderRadius: 999 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCell: {
    width: '47%',
    flexGrow: 1,
    gap: 2,
  },
});
