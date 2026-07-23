import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Typography } from '@/components/ui/Typography';
import { tokens } from '@/theme/tokens';

import { dataTableStyles as styles } from './DataTable.styles';
import type { DataTableProps } from './DataTable.types';

const DEFAULT_COL_MIN = 120;
const DEFAULT_ACTION_WIDTH = 96;

function resolveWidth(
  col: { width?: number; minWidth?: number },
  fallback = DEFAULT_COL_MIN,
): number {
  if (typeof col.width === 'number') return col.width;
  if (typeof col.minWidth === 'number') return col.minWidth;
  return fallback;
}

function cellValue(row: object, columnId: string): string {
  const value = (row as Record<string, unknown>)[columnId];
  if (value === undefined || value === null || value === '') return '—';
  return String(value);
}

function alignStyle(align?: 'left' | 'center' | 'right') {
  if (align === 'center') return { alignItems: 'center' as const, textAlign: 'center' as const };
  if (align === 'right') return { alignItems: 'flex-end' as const, textAlign: 'right' as const };
  return { alignItems: 'flex-start' as const, textAlign: 'left' as const };
}

/**
 * Professional data table (web-parity API).
 * Wide tables scroll horizontally; empty / loading / selection match SaaS dashboard language.
 */
export function DataTable<T extends object>({
  columns,
  rows,
  getRowId = (_, index) => index,
  actionColumn,
  isLoading = false,
  loadingRowCount = 6,
  minWidth,
  size = 'small',
  style,
  containerStyle,
  selectedRowId = null,
  onRowClick,
  emptyState,
}: DataTableProps<T>) {
  const sizeCell = size === 'medium' ? styles.cellMedium : styles.cellSmall;

  const computedMinWidth = useMemo(() => {
    if (typeof minWidth === 'number') return minWidth;
    const cols = columns.reduce((sum, col) => sum + resolveWidth(col), 0);
    const action = actionColumn ? (actionColumn.width ?? DEFAULT_ACTION_WIDTH) : 0;
    return Math.max(cols + action, 320);
  }, [actionColumn, columns, minWidth]);

  const hasRows = rows.length > 0;
  const showEmpty = !isLoading && !hasRows;
  const skeletonRows = isLoading ? Array.from({ length: loadingRowCount }) : [];
  const emptyIcon = emptyState?.icon ?? 'time-outline';

  return (
    <View style={[styles.container, containerStyle]}>
      {showEmpty ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconWell}>
            <Ionicons name={emptyIcon} size={26} color={tokens.colors.textMuted} />
          </View>
          <Typography variant="medium16" style={styles.emptyTitle}>
            {emptyState?.title ?? 'No records yet'}
          </Typography>
          <Typography variant="small" muted style={styles.emptyDescription}>
            {emptyState?.description ?? 'There is no data available for the current filter.'}
          </Typography>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          style={style}
          contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.table, { minWidth: computedMinWidth }]}>
            <View style={styles.headerRow}>
              {columns.map((col) => {
                const width = resolveWidth(col);
                const align = alignStyle(col.align);
                return (
                  <View
                    key={col.id}
                    style={[styles.cell, sizeCell, { width, minWidth: width }, align]}
                  >
                    {col.headerRender ? (
                      col.headerRender()
                    ) : (
                      <Typography style={[styles.headerText, { textAlign: align.textAlign }]}>
                        {col.label}
                      </Typography>
                    )}
                  </View>
                );
              })}
              {actionColumn ? (
                <View
                  style={[
                    styles.cell,
                    sizeCell,
                    styles.actionCell,
                    {
                      width: actionColumn.width ?? DEFAULT_ACTION_WIDTH,
                      minWidth: actionColumn.width ?? DEFAULT_ACTION_WIDTH,
                    },
                    alignStyle(actionColumn.align ?? 'right'),
                  ]}
                >
                  <Typography
                    style={[
                      styles.headerText,
                      { textAlign: alignStyle(actionColumn.align ?? 'right').textAlign },
                    ]}
                  >
                    {actionColumn.label}
                  </Typography>
                </View>
              ) : null}
            </View>

            {(isLoading ? skeletonRows : rows).map((row, idx) => {
              const rowId = String(isLoading ? `skeleton-${idx}` : getRowId(row as T, idx));
              const selected =
                !isLoading &&
                onRowClick &&
                selectedRowId != null &&
                selectedRowId !== '' &&
                rowId === String(selectedRowId);
              const isLast = idx === (isLoading ? skeletonRows : rows).length - 1;

              const rowContent = (
                <>
                  {columns.map((col, colIdx) => {
                    const width = resolveWidth(col);
                    const align = alignStyle(col.align);
                    const muted = col.cellVariant === 'muted';
                    return (
                      <View
                        key={col.id}
                        style={[styles.cell, sizeCell, { width, minWidth: width }, align]}
                      >
                        {isLoading ? (
                          <View
                            style={[
                              styles.skeletonBlock,
                              { width: Math.max(40, width * (0.55 - colIdx * 0.06)) },
                            ]}
 />
                        ) : col.render ? (
                          col.render(
                            (row as Record<string, unknown>)[col.id],
                            row as T,
                            idx,
                          )
                        ) : (
                          <Typography
                            numberOfLines={col.nowrap === false ? undefined : 1}
                            style={[
                              muted ? styles.cellTextMuted : styles.cellText,
                              { textAlign: align.textAlign },
                            ]}
                          >
                            {cellValue(row as object, col.id)}
                          </Typography>
                        )}
                      </View>
                    );
                  })}
                  {actionColumn ? (
                    <View
                      style={[
                        styles.cell,
                        sizeCell,
                        styles.actionCell,
                        {
                          width: actionColumn.width ?? DEFAULT_ACTION_WIDTH,
                          minWidth: actionColumn.width ?? DEFAULT_ACTION_WIDTH,
                        },
                        alignStyle(actionColumn.align ?? 'right'),
                      ]}
                    >
                      {isLoading ? (
                        <View style={[styles.skeletonBlock, { width: 72, height: 28 }]} />
                      ) : (
                        actionColumn.render(row as T, idx)
                      )}
                    </View>
                  ) : null}
                </>
              );

              if (isLoading || !onRowClick) {
                return (
                  <View
                    key={rowId}
                    style={[styles.bodyRow, isLast && styles.bodyRowLast, selected && styles.bodyRowSelected]}
                  >
                    {rowContent}
                  </View>
                );
              }

              return (
                <Pressable
                  key={rowId}
                  onPress={() => onRowClick(row as T, idx)}
                  style={({ pressed }) => [
                    styles.bodyRow,
                    isLast && styles.bodyRowLast,
                    selected && styles.bodyRowSelected,
                    pressed && styles.bodyRowPressed,
                  ]}
                  accessibilityRole="button"
                >
                  {rowContent}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
