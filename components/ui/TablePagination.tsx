import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Typography } from '@/components/ui/Typography';
import { tokens } from '@/theme/tokens';

export type TablePaginationProps = {
  page: number;
  pageCount: number;
  onPageChange?: (page: number) => void;
  style?: StyleProp<ViewStyle>;
};

type PageItem = number | 'dots';

/** Compact page list with ellipsis (web-parity). */
function getPageItems(page: number, pageCount: number, siblingCount = 1): PageItem[] {
  if (pageCount <= 1) return pageCount === 1 ? [1] : [];

  const totalNumbers = siblingCount * 2 + 5;
  if (pageCount <= totalNumbers) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(page - siblingCount, 1);
  const rightSibling = Math.min(page + siblingCount, pageCount);
  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < pageCount - 1;

  if (!showLeftDots && showRightDots) {
    const leftRange = Array.from({ length: 3 + siblingCount * 2 }, (_, i) => i + 1);
    return [...leftRange, 'dots', pageCount];
  }

  if (showLeftDots && !showRightDots) {
    const rightRange = Array.from(
      { length: 3 + siblingCount * 2 },
      (_, i) => pageCount - (2 + siblingCount * 2) + i,
    );
    return [1, 'dots', ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSibling - leftSibling + 1 },
    (_, i) => leftSibling + i,
  );
  return [1, 'dots', ...middleRange, 'dots', pageCount];
}

/** Circular page chips + chevrons — matches web TablePagination. */
export function TablePagination({ page, pageCount, onPageChange, style }: TablePaginationProps) {
  const safeCount = Math.max(pageCount, 1);
  const safePage = Math.min(Math.max(page, 1), safeCount);
  const canGoPrev = safePage > 1 && Boolean(onPageChange);
  const canGoNext = safePage < safeCount && Boolean(onPageChange);
  const pages = getPageItems(safePage, safeCount);

  const handleChange = (nextPage: number) => {
    if (!onPageChange) return;
    if (nextPage < 1 || nextPage > safeCount || nextPage === safePage) return;
    onPageChange(nextPage);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, style]} showsVerticalScrollIndicator={false}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous page"
        disabled={!canGoPrev}
        onPress={() => handleChange(safePage - 1)}
        style={[styles.edgeButton, !canGoPrev && styles.disabled]}
      >
        <Ionicons name="chevron-back" size={16} color={tokens.colors.textMuted} />
      </Pressable>

      {pages.map((item, idx) => {
        if (item === 'dots') {
          return (
            <View key={`dots-${idx}`} style={styles.dots}>
              <Typography variant="small" muted>
                …
              </Typography>
            </View>
          );
        }

        const active = item === safePage;
        return (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityLabel={`Page ${item}`}
            disabled={!onPageChange}
            onPress={() => handleChange(item)}
            style={[
              styles.pageButton,
              active && styles.pageButtonActive,
              !onPageChange && styles.disabled,
            ]}
          >
            <Typography
              variant="small"
              color={active ? tokens.colors.textPrimary : tokens.colors.textMuted}
              style={styles.pageLabel}
            >
              {item}
            </Typography>
          </Pressable>
        );
      })}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next page"
        disabled={!canGoNext}
        onPress={() => handleChange(safePage + 1)}
        style={[styles.edgeButton, !canGoNext && styles.disabled]}
      >
        <Ionicons name="chevron-forward" size={16} color={tokens.colors.textMuted} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  edgeButton: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageButton: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pageButtonActive: {
    borderColor: tokens.colors.accentBlue,
    backgroundColor: 'rgba(88, 101, 242, 0.24)',
  },
  pageLabel: {
    fontWeight: '600',
    fontSize: 13,
  },
  dots: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});
