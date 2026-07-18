import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from "react-native";

import { MobileScreen } from "@/components/layout";
import { AppCard, Button, SearchBar, TablePagination, Typography } from "@/components/ui";
import type { IpBlockListItem } from "@/api/ip-block/ip-block.api";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth";
import { OP } from "@/lib/permissions/operational-keys";
import { useAppTheme } from "@/theme";
import { useWebsiteAssignmentScopeFilters } from "@/features/website-assignments/hooks/useWebsiteAssignmentScopeFilters";
import { useIpBlocksQuery } from "../hooks/useIpBlocksQuery";
import { useDeleteIpBlockMutation } from "../hooks/useIpBlockMutations";

const PAGE_SIZE = 25;

function formatBlockedDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** Mobile IP block list — search, unblock, add via web wizard. */
export function IpBlockListPage() {
  const theme = useAppTheme();
  const { hasOperational } = useAuth();
  const canCreate = hasOperational(OP.ipBlocklist.create);
  const canDelete = hasOperational(OP.ipBlocklist.delete);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const scope = useWebsiteAssignmentScopeFilters();

  const listIsActive =
    filterStatus === "active" ? true : filterStatus === "inactive" ? false : undefined;

  const listQuery = useIpBlocksQuery({
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
    resellerId: scope.filterResellerId.trim() || undefined,
    parentCompanyId: scope.filterParentCompanyId.trim() || undefined,
    childCompanyId: scope.filterChildCompanyId.trim() || undefined,
    isActive: listIsActive,
  });

  const deleteMutation = useDeleteIpBlockMutation();
  const items = listQuery.data?.items ?? [];
  const totalPages = listQuery.data?.totalPages ?? 1;
  const total = listQuery.data?.total ?? 0;

  const onUnblock = (row: IpBlockListItem) => {
    Alert.alert("Unblock IP?", `${row.ipAddress} on ${row.website}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unblock",
        style: "destructive",
        onPress: () =>
          deleteMutation.mutate(row.id, {
            onError: (err) => Alert.alert("Unblock failed", extractApiErrorMessage(err)),
          }),
      },
    ]);
  };

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Typography variant="boldLarge">IP blocklist</Typography>
        <Typography variant="medium" muted>
          Block visitor IPs by website.
        </Typography>
        <SearchBar value={search} onChange={setSearch} placeholder="Search IP, website…" />
        <View style={styles.statusRow}>
          {(["", "active", "inactive"] as const).map((s) => (
            <Button
              key={s || "all"}
              size="compact"
              variant={filterStatus === s ? "primary" : "outlined"}
              onPress={() => {
                setFilterStatus(s);
                setPage(1);
              }}
            >
              {s === "" ? "All" : s === "active" ? "Active" : "Inactive"}
            </Button>
          ))}
        </View>
        {canCreate ? (
          <Button
            onPress={() =>
              Alert.alert("Block IP", "The IP block wizard is available on the web dashboard.")
            }
          >
            Block IP (web wizard)
          </Button>
        ) : null}
      </View>

      {listQuery.isLoading ? (
        <ActivityIndicator color={theme.app.dashboard.accentBlue} />
      ) : listQuery.isError ? (
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(listQuery.error, "Could not load IP blocks.")}
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
                No blocked IPs match your filters.
              </Typography>
            </AppCard>
          }
          renderItem={({ item }) => (
            <AppCard style={{ gap: 6 }}>
              <View style={styles.rowBetween}>
                <Typography variant="medium16">{item.ipAddress}</Typography>
                <Typography
                  variant="small"
                  color={item.isActive ? theme.app.dashboard.accentGreen : theme.app.dashboard.textMuted}
                >
                  {item.isActive ? "Active" : "Inactive"}
                </Typography>
              </View>
              <Typography variant="small" muted>
                {item.website} · {item.childCompany}
              </Typography>
              <Typography variant="small" muted>
                Blocked {formatBlockedDate(item.blockedDate)} · {item.blockedBy}
              </Typography>
              {item.reason ? (
                <Typography variant="small">{item.reason}</Typography>
              ) : null}
              {canDelete && item.isActive ? (
                <Button size="compact" variant="danger" onPress={() => onUnblock(item)}>
                  Unblock
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
