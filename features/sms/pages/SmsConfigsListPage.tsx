import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from "react-native";

import { MobileScreen } from "@/components/layout";
import { AppCard, Button, SearchBar, TablePagination, Typography } from "@/components/ui";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useAppTheme } from "@/theme";
import { useWebsiteSmsConfigsQuery } from "../hooks/useSms";

const PAGE_SIZE = 25;

/** Mobile SMS configs list — Twilio setups per website. */
export function SmsConfigsListPage() {
  const theme = useAppTheme();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const listQuery = useWebsiteSmsConfigsQuery({
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
  });

  const items = listQuery.data?.items ?? [];
  const totalPages = listQuery.data?.totalPages ?? 1;
  const total = listQuery.data?.total ?? 0;

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Typography variant="boldLarge">SMS / Text Us</Typography>
        <Typography variant="medium" muted>
          Twilio configuration and text-us submissions by website.
        </Typography>
        <SearchBar value={search} onChange={setSearch} placeholder="Search websites…" />
        <Button
          variant="outlined"
          onPress={() =>
            Alert.alert("Configure SMS", "Full Twilio setup wizard is available on the web dashboard.")
          }
        >
          Add configuration (web)
        </Button>
      </View>

      {listQuery.isLoading ? (
        <ActivityIndicator color={theme.app.dashboard.accentBlue} />
      ) : listQuery.isError ? (
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(listQuery.error, "Could not load SMS configs.")}
          </Typography>
        </AppCard>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.websiteId}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 24 }}
          ListEmptyComponent={
            <AppCard>
              <Typography variant="medium" muted>
                No SMS configurations yet.
              </Typography>
            </AppCard>
          }
          renderItem={({ item }) => (
            <AppCard style={{ gap: 6 }}>
              <Typography variant="medium16">{item.website ?? item.websiteId}</Typography>
              <Typography variant="small" muted>
                {item.fromNumber ?? "No number"} · {item.isEnabled ? "Enabled" : "Disabled"}
              </Typography>
              <Typography variant="small" muted>
                {item.parentCompany} · {item.childCompany}
              </Typography>
            </AppCard>
          )}
          ListFooterComponent={
            totalPages > 1 ? (
              <TablePagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
            ) : null
          }
  showsVerticalScrollIndicator={false}/>
      )}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
});
