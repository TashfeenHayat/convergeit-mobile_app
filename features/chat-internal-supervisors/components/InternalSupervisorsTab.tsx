import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { extractApiErrorMessageForToast, publishAppToast } from "@/lib/notify";
import type { ChatScopeFilterState } from "@/features/chat-shared";
import { fetchInternalSupervisorsForParentCompany } from "@/services/chat/internal-supervisors.api";
import type { InternalSupervisorListRow } from "@/services/chat/internal-supervisors-list.types";
import { InvolvementTabToolbarCard } from "@/features/chat-involvement/components/InvolvementTabToolbarCard";
import {
  useInternalSupervisorListQuery,
  useSaveInternalSupervisorForUserMutation,
} from "../hooks/useInternalSupervisorLists";
import { InternalSupervisorAssignModal } from "./InternalSupervisorAssignModal";

function toListQuery(filters: ChatScopeFilterState, canFilterByResellerId: boolean, tableSearch: string) {
  return {
    all: true as const,
    resellerId: canFilterByResellerId ? filters.resellerId : undefined,
    parentCompanyId: filters.parentCompanyId || undefined,
    search: tableSearch.trim() || undefined,
  };
}

interface InternalSupervisorsTabProps {
  filters: ChatScopeFilterState;
  canFilterByResellerId: boolean;
  canEdit: boolean;
  apiEnabled: boolean;
}

export function InternalSupervisorsTab({
  filters,
  canFilterByResellerId,
  canEdit,
  apiEnabled,
}: InternalSupervisorsTabProps) {
  const [tableSearch, setTableSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const listQuery = useInternalSupervisorListQuery(toListQuery(filters, canFilterByResellerId, tableSearch), apiEnabled);
  const saveMutation = useSaveInternalSupervisorForUserMutation();
  const rows = listQuery.data ?? [];

  const removeRow = async (row: InternalSupervisorListRow) => {
    setRemovingId(row.id);
    try {
      const current = await fetchInternalSupervisorsForParentCompany(row.parentCompanyId);
      const remainingPoolIds = current
        .filter((r) => r.userId === row.userId && r.poolId !== row.poolId)
        .map((r) => r.poolId);
      await saveMutation.mutateAsync({ userId: row.userId, poolIds: remainingPoolIds });
      publishAppToast({ message: "Internal supervisor assignment removed.", variant: "success" });
    } catch (err) {
      publishAppToast({
        message: extractApiErrorMessageForToast(err, "Could not remove assignment."),
        variant: "error",
      });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <>
      <InvolvementTabToolbarCard
        icon={<Ionicons name="people-circle-outline" size={18} color={tokens.colors.accentBlue} />}
        title="Internal supervisors"
        description="Internal users supervising internal pools only."
        searchValue={tableSearch}
        onSearchChange={setTableSearch}
        searchPlaceholder="Parent, pool, supervisor, or email…"
        addLabel="Assign supervisor"
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
              <Typography variant="small" muted style={styles.center}>
                {listQuery.isError ? "Could not load." : "No rows in your scope yet."}
              </Typography>
            }
            renderItem={({ item: row }) => (
              <View style={styles.row}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="medium" style={{ fontWeight: "600" }} numberOfLines={1}>
                    {row.user.name?.trim() || row.user.email || row.userId.slice(0, 8)}
                  </Typography>
                  <Typography variant="small" muted numberOfLines={2}>
                    {row.parentCompany.parentCompanyName || row.parentCompanyId.slice(0, 8)} · {row.poolName} ·{" "}
                    {row.departmentName || "Internal"}
                  </Typography>
                </View>
                {canEdit ? (
                  <Pressable
                    onPress={() => void removeRow(row)}
                    disabled={saveMutation.isPending && removingId === row.id}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={18} color={tokens.colors.danger} />
                  </Pressable>
                ) : null}
              </View>
            )}
  showsVerticalScrollIndicator={false}/>
        )}
      </InvolvementTabToolbarCard>

      <InternalSupervisorAssignModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        canEdit={canEdit}
        saving={saveMutation.isPending}
        onSave={(userId, poolIds) => {
          saveMutation.mutate(
            { userId, poolIds },
            {
              onSuccess: () => {
                setAddOpen(false);
                publishAppToast({ message: "Internal supervisor saved.", variant: "success" });
              },
              onError: (err) => {
                publishAppToast({
                  message: extractApiErrorMessageForToast(err, "Could not save supervisor."),
                  variant: "error",
                });
              },
            },
          );
        }}
 />
    </>
  );
}

const styles = StyleSheet.create({
  center: { padding: tokens.space.lg, alignItems: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
    paddingVertical: tokens.space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.border,
  },
});
