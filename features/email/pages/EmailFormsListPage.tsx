import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { MobileScreen } from "@/components/layout";
import { AppCard, Button, ConfirmActionModal, SearchBar, TablePagination, Typography } from "@/components/ui";
import { deleteEmailForm, listEmailForms, type EmailFormListItem } from "@/api/email/email-forms.api";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useAppTheme } from "@/theme";

const PAGE_SIZE = 30;

/** Mobile email forms list — grouped cards with delete. */
export function EmailFormsListPage() {
  const theme = useAppTheme();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<EmailFormListItem | null>(null);

  const listQuery = useQuery({
    queryKey: ["email-forms", page, search],
    queryFn: () =>
      listEmailForms({ page, limit: PAGE_SIZE, search: search.trim() || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEmailForm(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["email-forms"] }),
  });

  const items = listQuery.data?.items ?? [];
  const totalPages = listQuery.data?.totalPages ?? 1;
  const total = listQuery.data?.total ?? items.length;

  const handleConfirmDelete = async () => {
    const id = deleteTarget?.id.trim();
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteTarget(null);
    } catch (err) {
      Alert.alert("Delete failed", extractApiErrorMessage(err));
    }
  };

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Typography variant="boldLarge">Email forms</Typography>
        <Typography variant="medium" muted>
          Standard and custom visitor forms per website.
        </Typography>
        <SearchBar value={search} onChange={setSearch} placeholder="Search forms…" />
        <Button
          variant="outlined"
          onPress={() =>
            Alert.alert("Edit forms", "The visual form builder is available on the web dashboard.")
          }
        >
          Open builder (web)
        </Button>
      </View>

      {listQuery.isLoading ? (
        <ActivityIndicator color={theme.app.dashboard.accentBlue} />
      ) : listQuery.isError ? (
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(listQuery.error, "Could not load email forms.")}
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
                No email forms configured yet.
              </Typography>
            </AppCard>
          }
          renderItem={({ item }) => (
            <AppCard style={{ gap: 6 }}>
              <Typography variant="medium16">{item.formName ?? "Untitled form"}</Typography>
              <Typography variant="small" muted>
                {item.website} · {item.formType}
              </Typography>
              <Typography variant="small" muted>
                {item.fieldCount} fields · {item.resellerName}
              </Typography>
              <View style={styles.actions}>
                <Button
                  size="compact"
                  variant="outlined"
                  onPress={() =>
                    Alert.alert(
                      item.formName ?? "Form",
                      `${item.fieldCount} fields on ${item.website}. Edit on web.`,
                    )
                  }
                >
                  View
                </Button>
                <Button size="compact" variant="danger" onPress={() => setDeleteTarget(item)}>
                  Delete
                </Button>
              </View>
            </AppCard>
          )}
          ListFooterComponent={
            totalPages > 1 ? (
              <TablePagination page={page} pageCount={totalPages} onPageChange={setPage} />
            ) : null
          }
        />
      )}

      <ConfirmActionModal
        open={Boolean(deleteTarget)}
        title="Remove form?"
        description={`Delete the form for ${deleteTarget?.website ?? "this website"}?`}
        confirmLabel="Delete"
        confirmButtonVariant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
        onDismiss={() => setDeleteTarget(null)}
      />
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
  actions: { flexDirection: "row", gap: 8, marginTop: 4 },
});
