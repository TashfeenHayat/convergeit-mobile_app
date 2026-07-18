import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from "react-native";

import { MobileScreen } from "@/components/layout";
import { AppCard, Button, SearchBar, TablePagination, Typography } from "@/components/ui";
import type { DistributionSetupListItem } from "@/api/distribution/distribution-setup.api";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth";
import { OP } from "@/lib/permissions/operational-keys";
import { useAppTheme } from "@/theme";
import { useWebsiteAssignmentScopeFilters } from "@/features/website-assignments/hooks/useWebsiteAssignmentScopeFilters";
import { useDistributionSetupsQuery } from "../hooks/useDistributionSetups";
import { useDeleteDistributionSetupMutation } from "../hooks/useDistributionSetupMutations";

const PAGE_SIZE = 20;

/** Mobile distribution setups list — search, status, delete. */
export function DistributionListPage() {
  const theme = useAppTheme();
  const { hasOperational } = useAuth();
  const canCreate = hasOperational(OP.distributionSetup.create);
  const canDelete = hasOperational(OP.distributionSetup.delete);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const scope = useWebsiteAssignmentScopeFilters();

  const listIsActive =
    filterStatus === "active" ? true : filterStatus === "draft" ? false : undefined;

  const listQuery = useDistributionSetupsQuery({
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
    resellerId: scope.filterResellerId.trim() || undefined,
    parentCompanyId: scope.filterParentCompanyId.trim() || undefined,
    childCompanyId: scope.filterChildCompanyId.trim() || undefined,
    isActive: listIsActive,
  });

  const deleteMutation = useDeleteDistributionSetupMutation();
  const items = listQuery.data?.items ?? [];
  const totalPages = listQuery.data?.totalPages ?? 1;
  const total = listQuery.data?.total ?? 0;

  const onDelete = (row: DistributionSetupListItem) => {
    Alert.alert("Delete distribution?", row.website, [
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
        <Typography variant="boldLarge">Distribution setup</Typography>
        <Typography variant="medium" muted>
          Email distribution rules by website and department.
        </Typography>
        <SearchBar value={search} onChange={setSearch} placeholder="Search setups…" />
        <View style={styles.statusRow}>
          {(["", "active", "draft"] as const).map((s) => (
            <Button
              key={s || "all"}
              size="compact"
              variant={filterStatus === s ? "primary" : "outlined"}
              onPress={() => {
                setFilterStatus(s);
                setPage(1);
              }}
            >
              {s === "" ? "All" : s === "active" ? "Active" : "Draft"}
            </Button>
          ))}
        </View>
        {canCreate ? (
          <Button
            onPress={() =>
              Alert.alert(
                "Add distribution",
                "The full distribution wizard is available on the web dashboard.",
              )
            }
          >
            Add setup (web wizard)
          </Button>
        ) : null}
      </View>

      {listQuery.isLoading ? (
        <ActivityIndicator color={theme.app.dashboard.accentBlue} />
      ) : listQuery.isError ? (
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(listQuery.error, "Could not load distribution setups.")}
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
                No distribution setups found.
              </Typography>
            </AppCard>
          }
          renderItem={({ item }) => (
            <AppCard style={{ gap: 6 }}>
              <View style={styles.rowBetween}>
                <Typography variant="medium16">{item.website}</Typography>
                <Typography variant="small" color={item.isActive ? theme.app.dashboard.accentGreen : theme.app.dashboard.textMuted}>
                  {item.isActive ? "Active" : "Draft"}
                </Typography>
              </View>
              <Typography variant="small" muted>
                {item.disMethod} · {item.department}
              </Typography>
              <Typography variant="small" muted>
                {item.parentCompany} · {item.childCompany}
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
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
});
