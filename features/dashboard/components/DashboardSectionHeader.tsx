import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import { Typography } from '@/components/ui';
import { tokens } from '@/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

type DashboardSectionHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconColor?: string;
  trailing?: ReactNode;
};

export function DashboardSectionHeader({
  title,
  subtitle,
  icon,
  iconColor = tokens.colors.accentBlue,
  trailing,
}: DashboardSectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.leading}>
        {icon ? (
          <View style={[styles.iconWell, { backgroundColor: `${iconColor}22` }]}>
            <Ionicons name={icon} size={16} color={iconColor} />
          </View>
        ) : null}
        <View style={styles.text}>
          <Typography variant="medium16" style={styles.title}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="small" muted>
              {subtitle}
            </Typography>
          ) : null}
        </View>
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  iconWell: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
