import { StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui';
import type {
  DashboardChatAnalyticsPoint,
  DashboardDepartmentSlice,
  DashboardRevenueChartPoint,
} from '@/api/dashboard';
import { tokens } from '@/theme/tokens';

function ChartLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <View style={styles.legend}>
      {items.map((item) => (
        <View key={item.label} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
          <Typography variant="small" muted>
            {item.label}
          </Typography>
        </View>
      ))}
    </View>
  );
}
type SimpleBarChartProps = {
  data: DashboardChatAnalyticsPoint[];
  emptyLabel?: string;
};

export function ChatAnalyticsBarChartView({
  data,
  emptyLabel = 'No chat analytics yet',
}: SimpleBarChartProps) {
  if (!data.length) {
    return (
      <Typography variant="medium" muted>
        {emptyLabel}
      </Typography>
    );
  }

  const max = Math.max(...data.map((point) => point.value), 1);

  return (
    <View style={styles.barChart}>
      {data.map((point) => {
        const heightPct = Math.max(6, (point.value / max) * 100);
        const fill =
          point.fill === 'second' ? tokens.colors.accentPink : tokens.colors.accentBlue;
        return (
          <View key={point.name} style={styles.barColumn}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { height: `${heightPct}%`, backgroundColor: fill },
                ]}
              />
            </View>
            <Typography variant="small" muted numberOfLines={1} style={styles.barLabel}>
              {point.name}
            </Typography>
            <Typography variant="small" style={styles.barValue}>
              {point.value}
            </Typography>
          </View>
        );
      })}
    </View>
  );
}

type RevenueChartProps = {
  data: DashboardRevenueChartPoint[];
  emptyLabel?: string;
};

export function RevenueLineChartView({
  data,
  emptyLabel = 'No revenue data yet',
}: RevenueChartProps) {
  if (!data.length) {
    return (
      <Typography variant="medium" muted>
        {emptyLabel}
      </Typography>
    );
  }

  const max = Math.max(...data.map((point) => Math.max(point.value, point.value2)), 1);

  return (
    <View style={styles.revenueWrap}>
      <ChartLegend
        items={[
          { color: tokens.colors.accentBlue, label: 'Primary' },
          { color: tokens.colors.accentPurple, label: 'Secondary' },
        ]}
      />
      <View style={styles.revenueChart}>
        {data.map((point) => {
          const primaryPct = Math.max(4, (point.value / max) * 100);
          const secondaryPct = Math.max(4, (point.value2 / max) * 100);
          return (
            <View key={`${point.day}-${point.label}`} style={styles.revenueColumn}>
              <View style={styles.revenueBars}>
                <View
                  style={[
                    styles.revenueBar,
                    { height: `${primaryPct}%`, backgroundColor: tokens.colors.accentBlue },
                  ]}
                />
                <View
                  style={[
                    styles.revenueBar,
                    { height: `${secondaryPct}%`, backgroundColor: tokens.colors.accentPurple },
                  ]}
                />
              </View>
              <Typography variant="small" muted numberOfLines={1} style={styles.barLabel}>
                {point.label || String(point.day)}
              </Typography>
            </View>
          );
        })}
      </View>
    </View>
  );
}
type DepartmentChartProps = {
  data: DashboardDepartmentSlice[];
};

export function DepartmentPieChartView({ data }: DepartmentChartProps) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0) || 1;

  return (
    <View style={styles.deptList}>
      {data.map((slice) => {
        const pct = Math.round((slice.value / total) * 100);
        return (
          <View key={slice.name} style={styles.deptRow}>
            <View style={[styles.deptDot, { backgroundColor: slice.color || tokens.colors.accentBlue }]} />
            <View style={styles.deptCopy}>
              <Typography variant="medium" style={styles.deptName} numberOfLines={1}>
                {slice.name}
              </Typography>
              <View style={styles.deptTrack}>
                <View
                  style={[
                    styles.deptFill,
                    {
                      width: `${pct}%`,
                      backgroundColor: slice.color || tokens.colors.accentBlue,
                    },
                  ]}
                />
              </View>
            </View>
            <Typography variant="medium" muted style={styles.deptPct}>
              {pct}%
            </Typography>
            <Typography variant="medium" style={styles.deptValue}>
              {slice.value}
            </Typography>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    minHeight: 160,
    paddingTop: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  barTrack: {
    width: '100%',
    height: 120,
    justifyContent: 'flex-end',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  barLabel: {    textAlign: 'center',
    fontSize: 10,
  },
  barValue: {
    fontWeight: '700',
    fontSize: 11,
  },
  revenueWrap: {
    gap: 10,
  },
  revenueChart: {
    flexDirection: 'row',    alignItems: 'flex-end',
    gap: 6,
    minHeight: 140,
  },
  revenueColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  revenueBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 110,
    width: '100%',
    justifyContent: 'center',
  },
  revenueBar: {
    flex: 1,
    maxWidth: 14,
    borderRadius: 6,
    minHeight: 4,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deptList: {
    gap: 12,
  },
  deptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deptCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  deptTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  deptFill: {
    height: '100%',
    borderRadius: 999,
  },
  deptDot: {    width: 10,
    height: 10,
    borderRadius: 5,
  },
  deptName: {
    minWidth: 0,
  },
  deptPct: {    width: 36,
    textAlign: 'right',
  },
  deptValue: {
    width: 32,
    textAlign: 'right',
    fontWeight: '700',
  },
});
