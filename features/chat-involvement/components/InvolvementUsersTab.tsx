import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { extractApiErrorMessageForToast, publishAppToast } from "@/lib/notify";
import type { ChatScopeFilterState } from "@/features/chat-shared";
import { fetchInvolvementUsers } from "@/services/chat/involvement-roster.api";
import type { InvolvementListRow } from "@/services/chat/involvement-list.types";
import { useInvolvementListQuery, useSaveInvolvementWebsiteMutation } from "../hooks/useInvolvementLists";
import { InvolvementAddSupervisorsModal } from "./InvolvementAddSupervisorsModal";
import { InvolvementTabToolbarCard } from "./InvolvementTabToolbarCard";

function toListQuery(filters: ChatScopeFilterState, canFilterByResellerId: boolean, tableSearch: string) {
  return {
    all: true as const,
    resellerId: canFilterByResellerId ? filters.resellerId : undefined,
    parentCompanyId: filters.parentCompanyId || undefined,
    childCompanyId: filters.childCompanyId || undefined,
    websiteId: filters.websiteId || undefined,
    search: tableSearch.trim() || undefined,
  };
}

interface InvolvementUsersTabProps {
  filters: ChatScopeFilterState;
  canFilterByResellerId: boolean;
  canEdit: boolean;
  apiEnabled: boolean;
}

export function InvolvementUsersTab({ filters, canFilterByResellerId, canEdit, apiEnabled }: InvolvementUsersTabProps) {
  const [tableSearch, setTableSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const listQuery = useInvolvementListQuery(toListQuery(filters, canFilterByResellerId, tableSearch), apiEnabled);
  const saveMutation = useSaveInvolvementWebsiteMutation();

  const rows = listQuery.data ?? [];

  const removeRow = async (row: InvolvementListRow) => {
    setRemovingId(row.id);
    try {
      const current = await fetchInvolvementUsers(row.websiteId);
      const items = current
        .filter((r) => !(r.departmentId === row.departmentId && r.userId === row.userId))
        .map((r, index) => ({ departmentId: r.departmentId, userId: r.userId, sortOrder: index }));
      await saveMutation.mutateAsync({ websiteId: row.websiteId, items });
      publishAppToast({ message: "Involvement user removed.", variant: "success" });
    } catch (err) {
      publishAppToast({ message: extractApiErrorMessageForToast(err, "Could not remove involvement user."), variant: "error" });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <InvolvementTabToolbarCard
      icon={<Ionicons name="people-outline" size={18} color={tokens.colors.accentBlue} />}
      title="Involvement users"
      description="Rows respect the filters above. Add opens one modal (website → external department → users)."
      searchValue={tableSearch}
      onSearchChange={setTableSearch}
      searchPlaceholder="Website, department, user, or email…"
      addLabel="Add users"
      onAdd={() => setAddOpen(true)}
      canAdd={canEdit}
    >
      {listQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={tokens.colors.accentBlue} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Typography variant="small" muted>
                {listQuery.isError ? "Could not load. Check permissions and try again." : "No rows in your scope yet. Use Add users."}
              </Typography>
            </View>
          }
          renderItem={({ item: row }) => (
            <View style={styles.row}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.titleLine}>
                  <Typography variant="medium" style={{ fontWeight: "600" }} numberOfLines={1}>
                    {row.user.name?.trim() || row.user.email || row.userId.slice(0, 8)}
                  </Typography>
                  <View style={styles.pill}>
                    <Typography variant="small" style={{ fontSize: 10, fontWeight: "700" }}>
                      External
                    </Typography>
                  </View>
                </View>
                <Typography variant="small" muted numberOfLines={1}>
                  {row.user.email || "—"}
                </Typography>
                <Typography variant="small" muted numberOfLines={1} style={{ marginTop: 4 }}>
                  {(row.website.websiteName || row.website.websiteUrl || row.websiteId.slice(0, 8))} · {row.departmentName}
                </Typography>
                <Typography variant="small" muted numberOfLines={1}>
                  {[row.website.resellerName, row.website.parentCompanyName, row.website.childCompanyName].filter((v) => v && v !== "").join(" · ") || "—"}
                </Typography>
              </View>
              {canEdit ? (
                <Pressable
                  onPress={() => void removeRow(row)}
                  disabled={saveMutation.isPending}
                  hitSlop={8}
                  style={styles.removeButton}
                  accessibilityLabel="Remove involvement user"
                >
                  {removingId === row.id ? (
                    <ActivityIndicator size="small" color={tokens.colors.danger} />
                  ) : (
                    <FontAwesome name="trash-o" size={16} color={tokens.colors.danger} />
                  )}
                </Pressable>
              ) : null}
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <InvolvementAddSupervisorsModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        canEdit={canEdit}
        saving={saveMutation.isPending}
        onSave={(websiteId, items) => {
          saveMutation.mutate(
            { websiteId, items },
            {
              onSuccess: () => {
                publishAppToast({ message: "Involvement users saved.", variant: "success" });
                setAddOpen(false);
              },
              onError: (err) => {
                publishAppToast({ message: extractApiErrorMessageForToast(err, "Could not save."), variant: "error" });
              },
            },
          );
        }}
      />
    </InvolvementTabToolbarCard>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 32, alignItems: "center" },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 10 },
  titleLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  pill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
  },
  removeButton: { padding: 6 },
  separator: { height: 1, backgroundColor: tokens.colors.cardBorder },
});
