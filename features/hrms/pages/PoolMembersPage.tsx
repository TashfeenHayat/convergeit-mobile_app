import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import { MobileScreen } from "@/components/layout";
import {
  AppCard,
  Button,
  ConfirmActionModal,
  FormModal,
  SelectField,
  Typography,
} from "@/components/ui";
import { extractApiErrorMessage } from "@/lib/api/errors";
import {
  useAddPoolMemberMutation,
  usePoolMembersListQuery,
  usePoolsListQuery,
  useRemovePoolMemberMutation,
} from "@/lib/hooks/query/hrms";
import { useUsersListQuery } from "@/lib/hooks/query/users";
import { isRecord, pickStr } from "@/lib/utils/core";
import { pickApiItems } from "@/lib/utils/admin-list";
import { useAppTheme } from "@/theme";

type MemberRow = {
  id: string;
  userId: string;
  userName: string;
};

function parseRows(data: unknown): MemberRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r) => {
      const user = isRecord(r.user) ? r.user : null;
      const userId = pickStr(r, ["userId"]) || pickStr(user, ["id"]);
      const id = pickStr(r, ["id"]) || userId;
      if (!id || !userId) return null;
      const first = pickStr(user, ["firstName"]);
      const last = pickStr(user, ["lastName"]);
      return {
        id,
        userId,
        userName:
          [first, last].filter(Boolean).join(" ") ||
          pickStr(user, ["email"]) ||
          pickStr(r, ["name"]) ||
          "—",
      };
    })
    .filter((x): x is MemberRow => x !== null);
}

export function PoolMembersPage() {
  const theme = useAppTheme();
  const [poolId, setPoolId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const poolsQuery = usePoolsListQuery({ page: 1, limit: 100, all: true });
  const membersQuery = usePoolMembersListQuery(
    poolId,
    { page: 1, limit: 100, all: true },
    { enabled: Boolean(poolId), scope: "pool-members-page" },
  );
  const addMutation = useAddPoolMemberMutation();
  const removeMutation = useRemovePoolMemberMutation();
  const usersQuery = useUsersListQuery({ page: 1, limit: 100 }, { enabled: modalOpen });

  const poolOptions = useMemo(
    () =>
      pickApiItems(poolsQuery.data)
        .filter(isRecord)
        .map((r) => {
          const id = pickStr(r, ["id"]);
          return id ? { value: id, label: pickStr(r, ["name"]) || id } : null;
        })
        .filter((x): x is { value: string; label: string } => x !== null),
    [poolsQuery.data],
  );
  const rows = useMemo(() => parseRows(membersQuery.data), [membersQuery.data]);
  const userOptions = useMemo(
    () =>
      pickApiItems(usersQuery.data)
        .filter(isRecord)
        .map((r) => {
          const id = pickStr(r, ["id"]);
          if (!id) return null;
          const name = [pickStr(r, ["firstName"]), pickStr(r, ["lastName"])].filter(Boolean).join(" ");
          return { value: id, label: name || pickStr(r, ["email"]) || id };
        })
        .filter((x): x is { value: string; label: string } => x !== null),
    [usersQuery.data],
  );

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Typography variant="boldLarge">Pool members</Typography>
        <Typography variant="medium" muted>
          Manage users assigned to a pool.
        </Typography>
        <SelectField
          label="Pool"
          value={poolId}
          onChange={setPoolId}
          options={
            poolOptions.length
              ? poolOptions
              : [{ value: "", label: poolsQuery.isLoading ? "Loading…" : "No pools" }]
          }
        />
        {poolId ? (
          <Button
            onPress={() => {
              setUserId("");
              setModalOpen(true);
            }}
          >
            Add member
          </Button>
        ) : null}
      </View>

      {!poolId ? (
        <AppCard>
          <Typography variant="medium" muted>
            Select a pool to view members.
          </Typography>
        </AppCard>
      ) : membersQuery.isLoading && !membersQuery.data ? (
        <ActivityIndicator color={theme.app.dashboard.accentBlue} />
      ) : membersQuery.isError ? (
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(membersQuery.error, "Could not load members.")}
          </Typography>
        </AppCard>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={membersQuery.isRefetching && !membersQuery.isLoading}
              onRefresh={() => void membersQuery.refetch()}
              tintColor={theme.app.dashboard.accentBlue}
            />
          }
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 24 }}
          ListEmptyComponent={
            <AppCard>
              <Typography variant="medium" muted>
                No members in this pool.
              </Typography>
            </AppCard>
          }
          renderItem={({ item }) => (
            <AppCard style={{ gap: 6 }}>
              <Typography variant="medium16" style={{ fontWeight: "600" }}>
                {item.userName}
              </Typography>
              <Button size="compact" variant="ghost" onPress={() => setDeleteUserId(item.userId)}>
                Remove
              </Button>
            </AppCard>
          )}
        />
      )}

      <FormModal
        open={modalOpen}
        title="Add pool member"
        onClose={() => setModalOpen(false)}
        onSave={async () => {
          if (!poolId.trim() || !userId.trim()) {
            Alert.alert("Validation", "Select a user.");
            return;
          }
          try {
            await addMutation.mutateAsync({ poolId, userId });
            setModalOpen(false);
          } catch (err) {
            Alert.alert("Add failed", extractApiErrorMessage(err));
          }
        }}
        primaryButtonLabel={addMutation.isPending ? "Saving…" : "Add"}
        primaryButtonDisabled={addMutation.isPending}
      >
        <SelectField
          label="User"
          value={userId}
          onChange={setUserId}
          options={userOptions.length ? userOptions : [{ value: "", label: "Loading…" }]}
        />
      </FormModal>

      <ConfirmActionModal
        open={Boolean(deleteUserId)}
        title="Remove pool member?"
        description="This user will be removed from the pool."
        confirmLabel="Remove"
        confirmButtonVariant="danger"
        isLoading={removeMutation.isPending}
        onDismiss={() => setDeleteUserId(null)}
        onConfirm={async () => {
          if (!deleteUserId || !poolId) return;
          try {
            await removeMutation.mutateAsync({ poolId, userId: deleteUserId });
            setDeleteUserId(null);
          } catch (err) {
            Alert.alert("Remove failed", extractApiErrorMessage(err));
          }
        }}
      />
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
});
