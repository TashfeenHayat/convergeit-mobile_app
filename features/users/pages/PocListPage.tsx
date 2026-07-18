import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import { AppCard, Button, PermissionDeniedPanel, Typography } from '@/components/ui';
import { PocHierarchySection } from '@/features/users/poc-list/components/PocHierarchySection';
import { PocListStatsCards } from '@/features/users/poc-list/components/PocListStatsCards';
import {
  matchesPocSearch,
  unwrapPocListItems,
} from '@/features/users/poc-list/utils/unwrap-poc-list';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import { useCompanyPocDirectoryQuery } from '@/lib/hooks/query/companies';
import { PAGE } from '@/lib/permissions/permission-constants';
import { useAppTheme } from '@/theme';

export function PocListPage() {
  const theme = useAppTheme();
  const { hasPage } = useAuth();
  const canView = hasPage(PAGE.USERS_POC_LIST) || hasPage(PAGE.USERS);

  const [search, setSearch] = useState('');
  const query = useCompanyPocDirectoryQuery({ all: true }, { enabled: canView });

  const allRows = useMemo(() => unwrapPocListItems(query.data), [query.data]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRows.filter((r) => matchesPocSearch(r, q));
  }, [allRows, search]);

  const stats = useMemo(() => {
    const resellerIds = new Set<string>();
    const childIds = new Set<string>();
    for (const row of allRows) {
      if (row.resellerId) resellerIds.add(row.resellerId);
      if (row.childCompanyId) childIds.add(row.childCompanyId);
    }
    return {
      uniqueResellers: resellerIds.size,
      uniqueOrganizations: childIds.size,
    };
  }, [allRows]);

  const errorMessage = query.isError
    ? extractApiErrorMessage(query.error, 'Could not load POC directory.')
    : null;

  const isFiltering = search.trim().length > 0;

  if (!canView) {
    return (
      <MobileScreen>
        <PermissionDeniedPanel
          title="POC directory not available"
          description="You do not have permission to view the points of contact directory."
        />
      </MobileScreen>
    );
  }

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isLoading}
            onRefresh={() => void query.refetch()}
            tintColor={theme.app.dashboard.accentBlue}
          />
        }
      >
        <DashboardPageIntro subtitle="Browse by reseller and company — multiple POCs grouped under each child company." />

        {query.isError && !query.data ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {errorMessage}
            </Typography>
            <Button size="compact" variant="outlined" onPress={() => void query.refetch()}>
              Retry
            </Button>
          </AppCard>
        ) : (
          <>
            <PocListStatsCards
              totalContacts={allRows.length}
              uniqueResellers={stats.uniqueResellers}
              uniqueOrganizations={stats.uniqueOrganizations}
              filteredCount={filteredRows.length}
              isFiltering={isFiltering}
            />

            <PocHierarchySection
              search={search}
              onSearchChange={setSearch}
              rows={filteredRows}
              allRowsCount={allRows.length}
              isLoading={query.isLoading && !query.data}
              errorMessage={errorMessage}
            />
          </>
        )}
      </ScrollView>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 28 },
});
