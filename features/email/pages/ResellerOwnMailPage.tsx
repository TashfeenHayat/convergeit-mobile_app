import { useCallback, useEffect, useMemo, useState } from "react";
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
  StatusChip,
  Typography,
} from "@/components/ui";
import { OwnMailConfigModal } from "@/features/email/components/OwnMailConfigModal";
import { PROVIDER_CODE_LABELS } from "@/features/email/email.constants";
import {
  useDeleteResellerOwnMailMutation,
  useResellerOwnMailListQuery,
} from "@/features/email/hooks/useEmailSettings";
import { useSmtpEmailAccess } from "@/features/email/hooks/useSmtpEmailAccess";
import type { ResellerOwnMailListItem } from "@/features/email/types";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth";
import { useAppTheme } from "@/theme";

function providerLabel(row: ResellerOwnMailListItem): string {
  return (
    row.providerName ??
    row.provider ??
    PROVIDER_CODE_LABELS[row.providerCode ?? ""] ??
    row.providerCode ??
    "—"
  );
}

export function ResellerOwnMailPage() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const { canView, canUpdate, canDelete } = useSmtpEmailAccess();
  const fixedResellerId = user?.resellerId?.trim() || null;

  const listQuery = useResellerOwnMailListQuery({ enabled: canView && !fixedResellerId });
  const deleteMutation = useDeleteResellerOwnMailMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editResellerId, setEditResellerId] = useState("");
  const [editResellerLabel, setEditResellerLabel] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    resellerId: string;
    resellerName: string;
  } | null>(null);

  const rows = useMemo(() => {
    const list = listQuery.data ?? [];
    if (fixedResellerId) {
      const mine = list.filter((r) => r.resellerId === fixedResellerId);
      if (mine.length > 0) return mine;
      return [
        {
          resellerId: fixedResellerId,
          resellerName: "Your reseller",
          isEnabled: false,
        } as ResellerOwnMailListItem,
      ];
    }
    return list;
  }, [listQuery.data, fixedResellerId]);

  const openModal = useCallback((resellerId: string, resellerName?: string) => {
    setEditResellerId(resellerId);
    setEditResellerLabel(resellerName?.trim() ?? "");
    setModalOpen(true);
  }, []);

  useEffect(() => {
    if (fixedResellerId && canView) openModal(fixedResellerId);
  }, [fixedResellerId, canView, openModal]);

  const handleConfirmDelete = async () => {
    const rid = deleteTarget?.resellerId.trim();
    if (!rid) return;
    try {
      await deleteMutation.mutateAsync(rid);
      setDeleteTarget(null);
      Alert.alert("Removed", "Reseller mail settings removed.");
    } catch (err) {
      Alert.alert("Delete failed", extractApiErrorMessage(err));
    }
  };

  if (!canView) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" muted>
            You need SMTP email permissions to view reseller mail.
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  const showTable = !fixedResellerId;

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Typography variant="boldLarge">Own mail (SMTP / API)</Typography>
        <Typography variant="medium" muted>
          Per-reseller SMTP or API credentials, separate from platform mail.
        </Typography>
        {canUpdate && showTable ? (
          <Button onPress={() => openModal("")}>Add reseller mail</Button>
        ) : null}
      </View>

      {showTable ? (
        listQuery.isLoading && !listQuery.data ? (
          <ActivityIndicator color={theme.app.dashboard.accentBlue} />
        ) : listQuery.isError ? (
          <AppCard>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(listQuery.error, "Could not load list.")}
            </Typography>
          </AppCard>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(item) => item.resellerId}
            refreshControl={
              <RefreshControl
                refreshing={listQuery.isRefetching && !listQuery.isLoading}
                onRefresh={() => void listQuery.refetch()}
                tintColor={theme.app.dashboard.accentBlue}
              />
            }
            contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 24 }}
            ListEmptyComponent={
              <AppCard>
                <Typography variant="medium" muted>
                  No reseller mail configured yet.
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
                    label={item.isEnabled ? "Enabled" : "Disabled"}
                    tone={item.isEnabled ? "success" : "neutral"}
                  />
                </View>
                <Typography variant="small" muted>
                  {providerLabel(item)} · {item.fromEmail || "No from email"}
                </Typography>
                <View style={styles.actions}>
                  {canUpdate ? (
                    <Button
                      size="compact"
                      variant="outlined"
                      onPress={() => openModal(item.resellerId, item.resellerName)}
                    >
                      Edit
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button
                      size="compact"
                      variant="ghost"
                      onPress={() =>
                        setDeleteTarget({
                          resellerId: item.resellerId,
                          resellerName: item.resellerName,
                        })
                      }
                    >
                      Remove
                    </Button>
                  ) : null}
                </View>
              </AppCard>
            )}
          />
        )
      ) : null}

      <OwnMailConfigModal
        open={modalOpen}
        mode="reseller"
        resellerId={editResellerId}
        resellerLabel={editResellerLabel}
        lockedResellerId={fixedResellerId}
        onClose={() => {
          setModalOpen(false);
          setEditResellerId("");
          setEditResellerLabel("");
        }}
        onSaved={() => void listQuery.refetch()}
      />

      <ConfirmActionModal
        open={Boolean(deleteTarget)}
        title="Remove reseller mail settings?"
        description={
          deleteTarget
            ? `SMTP/API settings for "${deleteTarget.resellerName}" will be deleted.`
            : ""
        }
        confirmLabel="Remove"
        confirmButtonVariant="danger"
        isLoading={deleteMutation.isPending}
        onDismiss={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
  rowBetween: { flexDirection: "row", alignItems: "center", gap: 8 },
  actions: { flexDirection: "row", gap: 8, marginTop: 4 },
});
