import { Children, isValidElement, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type DashboardMetricGridProps = {
  children: ReactNode;
  columns?: 2 | 3;
};

/**
 * Stable multi-column grid for dashboard KPI cards.
 * Avoids percentage-width + flex bugs that collapse cards on narrow rows.
 */
export function DashboardMetricGrid({ children, columns = 2 }: DashboardMetricGridProps) {
  const items = Children.toArray(children).filter(isValidElement);
  const spanLastOdd = columns === 2 && items.length % 2 === 1;

  return (
    <View style={styles.grid}>
      {items.map((child, index) => {
        const isFullWidth = spanLastOdd && index === items.length - 1;
        return (
          <View
            key={child.key ?? `metric-${index}`}
            style={[
              columns === 2 ? styles.cellTwoUp : styles.cellThreeUp,
              isFullWidth && styles.cellFull,
            ]}
          >
            {child}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cellTwoUp: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: '48%',
    maxWidth: '48%',
    minWidth: 0,
  },
  cellThreeUp: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: '31%',
    maxWidth: '31%',
    minWidth: 0,
  },
  cellFull: {
    flexBasis: '100%',
    maxWidth: '100%',
  },
});
