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
  useAssignPoolHeadMutation,
  usePoolHeadsListQuery,
  usePoolsListQuery,
  useRemovePoolHeadMutation,
} from "@/lib/hooks/query/hrms";
import { useUsersListQuery } from "@/lib/hooks/query/users";
import { isRecord, pickStr } from "@/lib/utils/core";
import { pickApiItems } from "@/lib/utils/admin-list";
import { useAppTheme } from "@/theme";

type HeadRow = {
  id: string;
  userName: string;
  poolName: string;
};

function parseRows(data: unknown): HeadRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r) => {
      const id = pickStr(r, ["id"]);
      if (!id) return null;
      const user = isRecord(r.user) ? r.user : null;
      const pool = isRecord(r.pool) ? r.pool : null;
      const first = pickStr(user, ["firstName"]);
      const last = pickStr(user, ["lastName"]);
      return {
        id,
        userName:
          [first, last].filter(Boolean).join(" ") ||
          pickStr(user, ["email"]) ||
          pickStr(r, ["userName", "name"]) ||
          "—",
        poolName: pickStr(pool, ["name"]) || pickStr(r, ["poolName"]) || "—",
      };
    })
    .filter((x): x is HeadRow => x !== null);
}

export function PoolHeadsPage() {
  const theme = useAppTheme();
  const query = usePoolHeadsListQuery({ page: 1, limit: 50, all: true }, { scope: "pool-heads-page" });
  const assignMutation = useAssignPoolHeadMutation();
  const removeMutation = useRemovePoolHeadMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [poolId, setPoolId] = useState("");
  const [userId, setUserId] = useState("");

  const poolsQuery = usePoolsListQuery({ page: 1, limit: 100, all: true }, { enabled: modalOpen });
  const usersQuery = useUsersListQuery({ page: 1, limit: 100 }, { enabled: modalOpen });

  const rows = useMemo(() => parseRows(query.data), [query.data]);
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
        <Typography variant="boldLarge">Pool heads</Typography>
        <Typography variant="medium" muted>
          Assign a head user for each pool.
        </Typography>
        <Button
          onPress={() => {
            setPoolId("");
            setUserId("");
            setModalOpen(true);
          }}
        >
          Assign head
        </Button>
      </View>

      {query.isLoading && !query.data ? (
        <ActivityIndicator color={theme.app.dashboard.accentBlue} />
      ) : query.isError ? (
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(query.error, "Could not load pool heads.")}
          </Typography>
        </AppCard>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isLoading}
              onRefresh={() => void query.refetch()}
              tintColor={theme.app.dashboard.accentBlue}
            />
          }
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 24 }}
          ListEmptyComponent={
            <AppCard>
              <Typography variant="medium" muted>
                No pool heads assigned yet.
              </Typography>
            </AppCard>
          }
          renderItem={({ item }) => (
            <AppCard style={{ gap: 6 }}>
              <Typography variant="medium16" style={{ fontWeight: "600" }}>
                {item.userName}
              </Typography>
              <Typography variant="small" muted>
                {item.poolName}
              </Typography>
              <Button size="compact" variant="ghost" onPress={() => setDeleteId(item.id)}>
                Remove
              </Button>
            </AppCard>
          )}
        />
      )}

      <FormModal
        open={modalOpen}
        title="Assign pool head"
        onClose={() => setModalOpen(false)}
        onSave={async () => {
          if (!poolId.trim() || !userId.trim()) {
            Alert.alert("Validation", "Select pool and user.");
            return;
          }
          try {
            await assignMutation.mutateAsync({ poolId, userId });
            setModalOpen(false);
          } catch (err) {
            Alert.alert("Assign failed", extractApiErrorMessage(err));
          }
        }}
        primaryButtonLabel={assignMutation.isPending ? "Saving…" : "Assign"}
        primaryButtonDisabled={assignMutation.isPending}
      >
        <View style={{ gap: 12 }}>
          <SelectField
            label="Pool"
            value={poolId}
            onChange={setPoolId}
            options={poolOptions.length ? poolOptions : [{ value: "", label: "Loading…" }]}
          />
          <SelectField
            label="User"
            value={userId}
            onChange={setUserId}
            options={userOptions.length ? userOptions : [{ value: "", label: "Loading…" }]}
          />
        </View>
      </FormModal>

      <ConfirmActionModal
        open={Boolean(deleteId)}
        title="Remove pool head?"
        description="This user will no longer be the pool head."
        confirmLabel="Remove"
        confirmButtonVariant="danger"
        isLoading={removeMutation.isPending}
        onDismiss={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await removeMutation.mutateAsync(deleteId);
            setDeleteId(null);
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
