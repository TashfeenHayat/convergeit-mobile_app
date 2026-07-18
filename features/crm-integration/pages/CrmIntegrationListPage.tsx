import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { MobileScreen } from "@/components/layout";
import { AppCard, Button, SearchBar, TablePagination, Typography } from "@/components/ui";
import type { CrmIntegrationListItem } from "@/api/crm/crm-integration.api";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth";
import { OP } from "@/lib/permissions/operational-keys";
import { useAppTheme } from "@/theme";
import { useWebsiteAssignmentScopeFilters } from "@/features/website-assignments/hooks/useWebsiteAssignmentScopeFilters";
import {
  useCrmIntegrationsQuery,
  useDeleteCrmIntegrationMutation,
} from "../hooks/useCrmIntegrationQueries";

const PAGE_SIZE = 20;

/** Mobile CRM integrations list — search, scope filters, delete. */
export function CrmIntegrationListPage() {
  const theme = useAppTheme();
  const router = useRouter();
  const { hasOperational } = useAuth();
  const canCreate = hasOperational(OP.crmIntegration.create);
  const canDelete = hasOperational(OP.crmIntegration.delete);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const scope = useWebsiteAssignmentScopeFilters();

  const listQuery = useCrmIntegrationsQuery({
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
    resellerId: scope.filterResellerId.trim() || undefined,
    parentCompanyId: scope.filterParentCompanyId.trim() || undefined,
    childCompanyId: scope.filterChildCompanyId.trim() || undefined,
  });

  const deleteMutation = useDeleteCrmIntegrationMutation();
  const items = listQuery.data?.items ?? [];
  const totalPages = listQuery.data?.totalPages ?? 1;
  const total = listQuery.data?.total ?? 0;

  const onDelete = (row: CrmIntegrationListItem) => {
    Alert.alert("Delete integration?", `${row.platformName} · ${row.website}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          deleteMutation.mutate(row.id, {
            onError: (err) => Alert.alert("Delete failed", extractApiErrorMessage(err)),
          }),
      },
    ]);
  };

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Typography variant="boldLarge">CRM integrations</Typography>
        <Typography variant="medium" muted>
          Connect CRM platforms and map distribution fields.
        </Typography>
        <SearchBar value={search} onChange={setSearch} placeholder="Search integrations…" />
        {canCreate ? (
          <Button
            onPress={() =>
              Alert.alert(
                "Add CRM integration",
                "The full CRM setup wizard is available on the web dashboard.",
              )
            }
          >
            Add integration (web wizard)
          </Button>
        ) : null}
      </View>

      {listQuery.isLoading ? (
        <ActivityIndicator color={theme.app.dashboard.accentBlue} />
      ) : listQuery.isError ? (
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(listQuery.error, "Could not load CRM integrations.")}
          </Typography>
        </AppCard>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 24 }}
          ListEmptyComponent={
            <AppCard>
              <Typography variant="medium" muted>
                No CRM integrations yet.
              </Typography>
            </AppCard>
          }
          renderItem={({ item }) => (
            <AppCard style={{ gap: 6 }}>
              <Typography variant="medium16">{item.platformName}</Typography>
              <Typography variant="small" muted>
                {item.website} · {item.childCompany}
              </Typography>
              <Typography variant="small" muted>
                {item.connectionMethodLabel} · {item.mappingCount} mappings
              </Typography>
              {canDelete ? (
                <Button size="compact" variant="danger" onPress={() => onDelete(item)}>
                  Delete
                </Button>
              ) : null}
            </AppCard>
          )}
          ListFooterComponent={
            totalPages > 1 ? (
              <TablePagination page={page} pageCount={totalPages} onPageChange={setPage} />
            ) : null
          }
        />
      )}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
});
