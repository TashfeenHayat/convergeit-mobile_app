import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { apiClient } from "@/api/http/axios-instance";
import { unwrapApiData } from "@/api/email/unwrap-api-data";
import { MobileScreen } from "@/components/layout";
import { AppCard, Button, SearchBar, StatusChip, TablePagination, Typography } from "@/components/ui";
import { useEmailTemplateAccess } from "@/features/email/hooks/useEmailTemplateAccess";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useAppTheme } from "@/theme";

type CatalogRow = {
  resellerId: string;
  resellerName: string;
  templateMode: string;
  usesPlatformDefault: boolean;
  hasPublished: boolean;
  publishedAt: string | null;
  previewTemplateId: string | null;
};

async function fetchDesignCatalog(search: string, page: number) {
  const { data } = await apiClient.get("/email/reseller-design-catalog", {
    params: { page, limit: 10, search: search || undefined },
  });
  return unwrapApiData<{
    items: CatalogRow[];
    total: number;
    totalPages: number;
  }>(data);
}

function formatPublishedAt(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function EmailDesignHubPage() {
  const theme = useAppTheme();
  const router = useRouter();
  const { canView, canUpdate } = useEmailTemplateAccess();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const catalogQuery = useQuery({
    queryKey: ["email", "design-catalog", page, search],
    queryFn: () => fetchDesignCatalog(search.trim(), page),
    enabled: canView,
  });

  const rows = catalogQuery.data?.items ?? [];
  const totalPages = Math.max(1, catalogQuery.data?.totalPages ?? 1);
  const total = catalogQuery.data?.total ?? 0;

  if (!canView) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" muted>
            You need email template permissions to view designs.
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Typography variant="boldLarge">Reseller email designs</Typography>
        <Typography variant="medium" muted>
          Resellers use the platform template by default. Custom designs can be edited on web.
        </Typography>
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search reseller…"
        />
        {canUpdate ? (
          <Button
            variant="outlined"
            onPress={() =>
              Alert.alert(
                "Add design",
                "Creating a custom reseller design studio is available on the web dashboard.",
              )
            }
          >
            Add reseller design (web)
          </Button>
        ) : null}
      </View>

      {catalogQuery.isLoading && !catalogQuery.data ? (
        <ActivityIndicator color={theme.app.dashboard.accentBlue} />
      ) : catalogQuery.isError ? (
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(catalogQuery.error, "Could not load designs.")}
          </Typography>
        </AppCard>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.resellerId}
          refreshControl={
            <RefreshControl
              refreshing={catalogQuery.isRefetching && !catalogQuery.isLoading}
              onRefresh={() => void catalogQuery.refetch()}
              tintColor={theme.app.dashboard.accentBlue}
            />
          }
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 24 }}
          ListEmptyComponent={
            <AppCard>
              <Typography variant="medium" muted>
                No custom reseller designs yet.
              </Typography>
            </AppCard>
          }
          renderItem={({ item }) => (
            <AppCard style={{ gap: 6 }}>
              <View style={styles.rowBetween}>
                <Typography variant="medium16" style={{ flex: 1, fontWeight: "600" }}>
                  {item.resellerName}
                </Typography>
                <StatusChip
                  label={item.usesPlatformDefault ? "Platform" : "Custom"}
                  tone={item.usesPlatformDefault ? "neutral" : "info"}
                />
              </View>
              <Typography variant="small" muted>
                Published: {formatPublishedAt(item.publishedAt)}
              </Typography>
              <View style={styles.actions}>
                <Button
                  size="compact"
                  variant="outlined"
                  onPress={() =>
                    router.push(`/email/design/reseller/${item.resellerId}` as never)
                  }
                >
                  Open
                </Button>
              </View>
            </AppCard>
          )}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={{ marginTop: 8 }}>
                <Typography variant="small" muted>
                  {total} resellers
                </Typography>
                <TablePagination page={page} pageCount={totalPages} onPageChange={setPage} />
              </View>
            ) : null
          }
        />
      )}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
  rowBetween: { flexDirection: "row", alignItems: "center", gap: 8 },
  actions: { flexDirection: "row", gap: 8, marginTop: 4 },
});
