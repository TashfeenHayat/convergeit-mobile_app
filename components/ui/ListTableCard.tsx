import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import { Typography } from '@/components/ui/Typography';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { tokens } from '@/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type ListTableCardProps = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  /** Right-side toolbar (search, filters, CTA) */
  toolbar?: ReactNode;
  /** Footer (count + pagination) */
  footer?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Canonical list chrome: icon tile + title + optional toolbar → table → footer.
 * Mirrors web DashboardCard + table-card header pattern.
 */
export function ListTableCard({
  title,
  subtitle,
  icon = 'grid-outline',
  toolbar,
  footer,
  children,
  style,
}: ListTableCardProps) {
  return (
    <DashboardCard style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconTile}>
            <Ionicons name={icon} size={18} color={tokens.colors.accentBlue} />
          </View>
          <View style={styles.titleBlock}>
            <Typography variant="label" style={styles.title}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="small" muted numberOfLines={2}>
                {subtitle}
              </Typography>
            ) : null}
          </View>
        </View>
        {toolbar ? <View style={styles.toolbar}>{toolbar}</View> : null}
      </View>

      <View style={styles.body}>{children}</View>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    gap: 0,
  },
  header: {
    paddingHorizontal: tokens.space.lg,
    paddingTop: tokens.space.lg,
    paddingBottom: tokens.space.md,
    gap: tokens.space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.14)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(88, 101, 242, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontWeight: '700',
  },
  toolbar: {
    gap: tokens.space.sm,
  },
  body: {
    paddingHorizontal: tokens.space.sm,
    paddingVertical: tokens.space.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.14)',
  },
});
