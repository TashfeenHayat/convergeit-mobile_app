import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button } from '@/components/ui/Button';
import { FilterButton } from '@/components/ui/FilterButton';
import { SearchBar } from '@/components/ui/SearchBar';
import { Typography } from '@/components/ui/Typography';
import { useAppTheme } from '@/theme';

export type FiltersSearchBarProps = {
  /** Controlled draft value shown in the search field. */
  value: string;
  onChange: (value: string) => void;
  /** Fired when Search is pressed or the keyboard search key is used. */
  onSearch: () => void;
  placeholder?: string;
  /** Show the funnel Filter control (default true). */
  showFilterButton?: boolean;
  /** Whether the filter panel is expanded / filter control is emphasized. */
  filtersOpen?: boolean;
  onFilterPress?: () => void;
  /** Marks Filters header + Filter button as active. */
  hasActiveFilters?: boolean;
  title?: string;
  /** Expanded filter panel content rendered under the toolbar. */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Shared dashboard Filters card: pill search + Search + Filter.
 * Use across list pages so search/filter UI stays consistent.
 */
export function FiltersSearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Search…',
  showFilterButton = true,
  filtersOpen = false,
  onFilterPress,
  hasActiveFilters = false,
  title = 'Filters',
  children,
  style,
}: FiltersSearchBarProps) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const filterActive = filtersOpen || hasActiveFilters;

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: theme.app.dashboard.cardBorder,
          backgroundColor: theme.app.dashboard.overlayLight,
        },
        style,
      ]}
    >
      <View style={styles.header}>
        <Ionicons name="options-outline" size={16} color={theme.app.text.secondary} />
        <Typography variant="medium" style={{ fontWeight: '700' }}>
          {title}
        </Typography>
        {hasActiveFilters ? (
          <View
            style={[
              styles.activeChip,
              { backgroundColor: `${accent}22`, borderColor: `${accent}55` },
            ]}
          >
            <Typography variant="small" style={{ fontWeight: '700', color: accent }}>
              Active
            </Typography>
          </View>
        ) : null}
      </View>

      <View style={styles.toolbar}>
        <View style={styles.searchField}>
          <SearchBar
            value={value}
            onChange={onChange}
            onSubmit={onSearch}
            placeholder={placeholder}
          />
        </View>
        <Button size="compact" variant="secondary" onPress={onSearch}>
          Search
        </Button>
        {showFilterButton && onFilterPress ? (
          <FilterButton active={filterActive} onPress={onFilterPress} />
        ) : null}
      </View>

      {children ? (
        <View
          style={[
            styles.body,
            { borderTopColor: theme.app.dashboard.cardBorder },
          ]}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  searchField: {
    flexGrow: 1,
    flexBasis: '55%',
    minWidth: 180,
  },
  body: {
    gap: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
