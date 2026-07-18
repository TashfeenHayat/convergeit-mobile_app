import { StyleSheet, View } from 'react-native';

import { Button, SelectField, Typography } from '@/components/ui';
import { useAppTheme } from '@/theme';
import type { WebsiteAssignmentScopeFilterState } from '../hooks/useWebsiteAssignmentScopeFilters';

export type WebsiteAssignmentScopeFilterPanelProps = Pick<
  WebsiteAssignmentScopeFilterState,
  | 'canFilterByResellerId'
  | 'filterResellerId'
  | 'setFilterResellerId'
  | 'filterParentCompanyId'
  | 'setFilterParentCompanyId'
  | 'filterChildCompanyId'
  | 'setFilterChildCompanyId'
  | 'resellerFilterOptions'
  | 'parentCompanyFilterOptions'
  | 'childCompanyFilterOptions'
  | 'hasScopeFilters'
> & {
  onClearAll: () => void;
  onClose?: () => void;
};

/** Reseller / parent / child scope filters for website assignment lists. */
export function WebsiteAssignmentScopeFilterPanel({
  canFilterByResellerId,
  filterResellerId,
  setFilterResellerId,
  filterParentCompanyId,
  setFilterParentCompanyId,
  filterChildCompanyId,
  setFilterChildCompanyId,
  resellerFilterOptions,
  parentCompanyFilterOptions,
  childCompanyFilterOptions,
  hasScopeFilters,
  onClearAll,
  onClose,
}: WebsiteAssignmentScopeFilterPanelProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.panel,
        {
          gap: theme.spacing.sm,
          borderColor: theme.app.dashboard.cardBorder,
          backgroundColor: 'rgba(255,255,255,0.03)',
        },
      ]}
    >
      <View style={styles.header}>
        <Typography variant="medium16" style={{ fontWeight: '700', flex: 1 }}>
          Company scope
        </Typography>
        {hasScopeFilters ? (
          <Typography variant="small" color={theme.app.dashboard.accentBlue} style={{ fontWeight: '600' }}>
            Active
          </Typography>
        ) : null}
      </View>
      <Typography variant="small" muted>
        Narrow by reseller and company hierarchy.
      </Typography>

      {canFilterByResellerId ? (
        <SelectField
          label="Reseller"
          value={filterResellerId}
          onChange={setFilterResellerId}
          options={resellerFilterOptions}
          searchable
          dense
        />
      ) : null}

      <SelectField
        label="Parent company"
        value={filterParentCompanyId}
        onChange={setFilterParentCompanyId}
        options={parentCompanyFilterOptions}
        searchable
        dense
      />

      <SelectField
        label="Child company"
        value={filterChildCompanyId}
        onChange={setFilterChildCompanyId}
        options={childCompanyFilterOptions}
        searchable
        dense
        disabled={!filterParentCompanyId.trim()}
      />

      <View style={styles.actions}>
        <Button variant="outlined" size="compact" disabled={!hasScopeFilters} onPress={onClearAll}>
          Clear scope
        </Button>
        {onClose ? (
          <Button size="compact" onPress={onClose}>
            Done
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
});
