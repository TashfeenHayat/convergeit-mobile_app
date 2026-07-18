import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import { LiquidGlass, Typography } from '@/components/ui';
import { webHrefToMobile } from '@/constants/navigation';
import { glassUi } from '@/lib/theme/glass-ui';
import { tokens } from '@/theme/tokens';

import { DashboardMetricGrid } from './DashboardMetricGrid';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type QuickActionItem = {
  label: string;
  href: string;
  icon: IconName;
  tint: string;
};

type DashboardQuickActionGridProps = {
  items: QuickActionItem[];
};

function QuickActionCard({ item }: { item: QuickActionItem }) {
  return (
    <View style={styles.shell}>
      <Link href={webHrefToMobile(item.href) as Href} asChild>
        <Pressable
          style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={item.label}
        >
          <LiquidGlass intensity="medium" radius={glassUi.radius.md} elevated contentStyle={styles.cardInner}>
            <View style={[styles.iconWell, { backgroundColor: `${item.tint}22` }]}>
              <Ionicons name={item.icon} size={20} color={item.tint} />
            </View>
            <Typography variant="small" style={styles.label} numberOfLines={2}>
              {item.label}
            </Typography>
            <View style={[styles.accentLine, { backgroundColor: item.tint }]} />
          </LiquidGlass>
        </Pressable>
      </Link>
    </View>
  );
}

export function DashboardQuickActionGrid({ items }: DashboardQuickActionGridProps) {
  return (
    <DashboardMetricGrid columns={2}>
      {items.map((item) => (
        <QuickActionCard key={item.href} item={item} />
      ))}
    </DashboardMetricGrid>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    minWidth: 0,
  },
  pressable: {
    width: '100%',
  },
  cardInner: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
    minHeight: 96,
  },
  iconWell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  label: {
    fontWeight: '600',
    color: tokens.colors.textPrimary,
    lineHeight: 17,
  },
  accentLine: {
    height: 3,
    width: '42%',
    borderRadius: 999,
    opacity: 0.75,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
