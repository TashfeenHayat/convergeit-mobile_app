import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Typography } from '@/components/ui/Typography';
import { useThemeColors } from '@/lib/theme/use-theme-colors';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type DataCardGridEmptyState = {
  title?: string;
  description?: string;
  icon?: IconName;
  action?: ReactNode;
};

export type DataCardGridProps = {
  children: ReactNode;
  /** Column count — default 2 (card-directory parity). */
  columns?: 1 | 2;
  gap?: number;
  isLoading?: boolean;
  empty?: boolean;
  emptyState?: DataCardGridEmptyState;
  /** Left footer text, e.g. "Showing 1 to 10 of 21 entries". */
  showingLabel?: string;
  /** Right footer (usually `TablePagination`). */
  footerRight?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Card-form table shell: multi-column grid + optional showing/pagination footer.
 * Pair with `EntityListCard` (or any card) as children.
 */
export function DataCardGrid({
  children,
  columns = 2,
  gap = 12,
  isLoading = false,
  empty = false,
  emptyState,
  showingLabel,
  footerRight,
  style,
  contentStyle,
}: DataCardGridProps) {
  const colors = useThemeColors();
  const showFooter = Boolean(showingLabel) || footerRight != null;
  const items = normalizeChildren(children);

  if (isLoading) {
    return (
      <View style={[styles.centered, style]}>
        <ActivityIndicator color={colors.accentBlue} />
        <Typography variant="small" muted>
          Loading…
        </Typography>
      </View>
    );
  }

  if (empty) {
    return (
      <View style={[styles.empty, style]}>
        <View
          style={[
            styles.emptyIcon,
            {
              backgroundColor: `${colors.accentBlue}22`,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Ionicons
            name={emptyState?.icon ?? 'grid-outline'}
            size={28}
            color={colors.accentBlue}
          />
        </View>
        <Typography variant="medium16" style={styles.emptyTitle}>
          {emptyState?.title ?? 'No records'}
        </Typography>
        {emptyState?.description ? (
          <Typography variant="small" muted style={styles.emptyDescription}>
            {emptyState.description}
          </Typography>
        ) : null}
        {emptyState?.action}
      </View>
    );
  }

  return (
    <View style={[styles.root, style]}>
      <View
        style={[
          styles.grid,
          {
            gap,
            ...(columns === 1
              ? { flexDirection: 'column' as const }
              : {
                  flexDirection: 'row' as const,
                  flexWrap: 'wrap' as const,
                  justifyContent: 'space-between' as const,
                }),
          },
          contentStyle,
        ]}
      >
        {items.map((child, index) => (
          <View key={index} style={columns === 1 ? styles.cellFull : styles.cellHalf}>
            {child}
          </View>
        ))}
      </View>

      {showFooter ? (
        <View style={styles.footer}>
          {showingLabel ? (
            <Typography variant="small" muted style={styles.showing}>
              {showingLabel}
            </Typography>
          ) : (
            <View />
          )}
          {footerRight}
        </View>
      ) : null}
    </View>
  );
}

function normalizeChildren(children: ReactNode): ReactNode[] {
  if (children == null || typeof children === 'boolean') return [];
  if (Array.isArray(children)) {
    return children.flatMap((c) => normalizeChildren(c));
  }
  return [children];
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    gap: 14,
  },
  grid: {
    width: '100%',
  },
  cellFull: {
    width: '100%',
  },
  cellHalf: {
    width: '48%',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 4,
  },
  showing: {
    flexShrink: 1,
  },
  centered: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  empty: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  emptyTitle: {
    fontWeight: '700',
  },
  emptyDescription: {
    textAlign: 'center',
  },
});
