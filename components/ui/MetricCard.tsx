import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { DashboardCard } from '@/components/ui/DashboardCard';
import { Typography } from '@/components/ui/Typography';
import { tokens } from '@/theme/tokens';

export type MetricCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  iconBgColor: string;
  valueColor?: string;
  subtitleColor?: string;
  showTrendArrow?: boolean;
  accentProgress?: number;
  style?: StyleProp<ViewStyle>;
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  iconBgColor,
  valueColor = tokens.colors.accentBlue,
  subtitleColor = tokens.colors.textMuted,
  showTrendArrow = true,
  accentProgress = 62,
  style,
}: MetricCardProps) {
  const barWidth = Math.max(12, Math.min(100, accentProgress));

  return (
    <View style={[styles.shell, style]}>
      <DashboardCard contentStyle={styles.card}>
        <View style={styles.header}>
          <Typography variant="small" muted style={styles.label} numberOfLines={2}>
            {title}
          </Typography>
          <View style={[styles.iconWell, { backgroundColor: iconBgColor }]}>{icon}</View>
        </View>

        <Typography
          variant="boldLarge"
          color={valueColor}
          style={styles.value}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {value}
        </Typography>

        {subtitle ? (
          <View style={styles.subtitleRow}>
            {showTrendArrow ? (
              <View style={styles.trendPill}>
                <Ionicons name="arrow-up" size={10} color="#4ADE80" />
                <Typography variant="small" style={styles.trendText} numberOfLines={1}>
                  {subtitle}
                </Typography>
              </View>
            ) : (
              <Typography variant="small" color={subtitleColor} numberOfLines={2}>
                {subtitle}
              </Typography>
            )}
          </View>
        ) : null}

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${barWidth}%`, backgroundColor: valueColor }]} />
        </View>
      </DashboardCard>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    minWidth: 0,
  },
  card: {
    padding: 16,
    gap: 10,
    minHeight: 128,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  label: {
    flex: 1,
    minWidth: 0,
    lineHeight: 16,
    fontWeight: '500',
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  value: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitleRow: {
    minHeight: 22,
  },
  trendPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.28)',
    maxWidth: '100%',
  },
  trendText: {
    color: '#86EFAC',
    fontWeight: '600',
    fontSize: 11,
    flexShrink: 1,
  },
  track: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginTop: 2,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    opacity: 0.85,
  },
});
