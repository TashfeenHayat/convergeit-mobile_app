import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

import { LiquidGlass } from '@/components/ui/LiquidGlass';
import { Typography } from '@/components/ui/Typography';
import { glassUi } from '@/lib/theme/glass-ui';

export type HeroMetricCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  showTrendArrow?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function HeroMetricCard({
  title,
  value,
  subtitle,
  icon,
  showTrendArrow = true,
  style,
}: HeroMetricCardProps) {
  return (
    <LiquidGlass intensity="strong" radius={glassUi.radius.lg} elevated style={style} contentStyle={styles.shell}>
      <LinearGradient
        colors={[...glassUi.gradient.hero]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.28)', 'transparent', 'rgba(0,0,0,0.10)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        <View style={styles.topRow}>
          <Typography variant="small" style={styles.label} numberOfLines={2}>
            {title}
          </Typography>
          {icon ? <View style={styles.iconWell}>{icon}</View> : null}
        </View>

        <Typography variant="boldLarge" style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Typography>

        {subtitle ? (
          <View style={styles.subtitleRow}>
            {showTrendArrow ? (
              <View style={styles.trendPill}>
                <Ionicons name="arrow-up" size={10} color="#DCFCE7" />
                <Typography variant="small" style={styles.trendText} numberOfLines={1}>
                  {subtitle}
                </Typography>
              </View>
            ) : (
              <Typography variant="small" style={styles.subtitlePlain} numberOfLines={2}>
                {subtitle}
              </Typography>
            )}
          </View>
        ) : null}

        <View style={styles.sparkline}>
          {[0.35, 0.55, 0.42, 0.68, 0.5, 0.82, 0.62, 0.9].map((h, i) => (
            <View key={i} style={[styles.sparkBar, { height: `${h * 100}%` }]} />
          ))}
        </View>
      </LinearGradient>
    </LiquidGlass>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    padding: 0,
  },
  gradient: {
    padding: 18,
    gap: 8,
    minHeight: 148,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    minWidth: 0,
  },
  label: {
    flex: 1,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '600',
    lineHeight: 17,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  value: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  subtitleRow: {
    minHeight: 24,
  },
  trendPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    maxWidth: '100%',
  },
  trendText: {
    color: '#F0FDF4',
    fontWeight: '600',
    fontSize: 11,
    flexShrink: 1,
  },
  subtitlePlain: {
    color: 'rgba(255,255,255,0.78)',
  },
  sparkline: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    width: 108,
    height: 44,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    opacity: 0.55,
  },
  sparkBar: {
    flex: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.65)',
    minHeight: 6,
  },
});
