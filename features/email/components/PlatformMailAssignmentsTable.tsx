import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import {
  AppCard,
  Button,
  Checkbox,
  ConfirmActionModal,
  FormModal,
  SelectField,
  StatusChip,
  Typography,
} from "@/components/ui";
import {
  useDeletePlatformMailAssignmentMutation,
  usePlatformEmailSettingsQuery,
  usePlatformMailAssignmentListQuery,
  usePlatformMailAssignmentQuery,
  useUpdatePlatformMailAssignmentMutation,
} from "@/features/email/hooks/useEmailSettings";
import { useSmtpEmailAccess } from "@/features/email/hooks/useSmtpEmailAccess";
import { PROVIDER_CODE_LABELS } from "@/features/email/email.constants";
import type { PlatformMailAssignmentListItem } from "@/features/email/types";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { pickItemsArray, toIdNameOption } from "@/lib/companies/scope-tree-options";
import { useCompaniesSetupResellersQuery } from "@/lib/hooks/query/companies";
import { useAppTheme } from "@/theme";

function providerLabel(row: PlatformMailAssignmentListItem): string {
  return (
    row.providerName ??
    PROVIDER_CODE_LABELS[row.providerCode ?? ""] ??
    row.providerCode ??
    "—"
  );
}

export function PlatformMailAssignmentsTable() {
  const theme = useAppTheme();
  const { canView, canUpdate, canDelete } = useSmtpEmailAccess();
  const platformQuery = usePlatformEmailSettingsQuery({ enabled: canView });
  const listQuery = usePlatformMailAssignmentListQuery({ enabled: canView });
  const deleteMutation = useDeletePlatformMailAssignmentMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editResellerId, setEditResellerId] = useState("");
  const [editResellerLabel, setEditResellerLabel] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    resellerId: string;
    resellerName: string;
  } | null>(null);

  const rows = listQuery.data ?? [];
  const platformConfigured = Boolean(platformQuery.data?.emailProviderId);

  const openModal = useCallback((resellerId: string, resellerName?: string) => {
    setEditResellerId(resellerId);
    setEditResellerLabel(resellerName?.trim() ?? "");
    setModalOpen(true);
  }, []);

  if (!canView) return null;

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {!platformConfigured && !platformQuery.isLoading ? (
        <AppCard>
          <Typography variant="small" color={theme.app.dashboard.accentOrange}>
            Configure platform email before assigning resellers to platform mail.
          </Typography>
        </AppCard>
      ) : null}

      <View style={styles.header}>
        <View style={{ flex: 1, gap: 2 }}>
          <Typography variant="medium16" style={{ fontWeight: "600" }}>
            Resellers on platform mail
          </Typography>
          <Typography variant="small" muted>
            These resellers send using the global platform configuration.
          </Typography>
        </View>
        {canUpdate ? (
          <Button size="compact" disabled={!platformConfigured} onPress={() => openModal("")}>
            Assign
          </Button>
        ) : null}
      </View>

      {listQuery.isLoading && !listQuery.data ? (
        <ActivityIndicator color={theme.app.dashboard.accentBlue} />
      ) : listQuery.isError ? (
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(listQuery.error, "Could not load assignments.")}
          </Typography>
        </AppCard>
      ) : (
        <FlatList
          data={rows}
          scrollEnabled={false}
          keyExtractor={(item) => item.id || item.resellerId}
          refreshControl={
            <RefreshControl
              refreshing={listQuery.isRefetching && !listQuery.isLoading}
              onRefresh={() => void listQuery.refetch()}
              tintColor={theme.app.dashboard.accentBlue}
            />
          }
          contentContainerStyle={{ gap: theme.spacing.sm }}
          ListEmptyComponent={
            <AppCard>
              <Typography variant="medium" muted>
                {platformConfigured
                  ? "No resellers on platform mail yet."
                  : "Configure platform mail first."}
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
                {providerLabel(item)} ·{" "}
                {item.fromEmail || platformQuery.data?.fromEmail || "Platform sender"}
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
      )}

      <PlatformMailAssignmentModal
        open={modalOpen}
        resellerId={editResellerId}
        resellerLabel={editResellerLabel}
        lockReseller={Boolean(editResellerId.trim())}
        onClose={() => {
          setModalOpen(false);
          setEditResellerId("");
          setEditResellerLabel("");
        }}
        onSaved={() => void listQuery.refetch()}
      />

      <ConfirmActionModal
        open={Boolean(deleteTarget)}
        title="Remove platform mail assignment?"
        description={
          deleteTarget
            ? `"${deleteTarget.resellerName}" will no longer send using platform mail.`
            : ""
        }
        confirmLabel="Remove"
        confirmButtonVariant="danger"
        isLoading={deleteMutation.isPending}
        onDismiss={() => setDeleteTarget(null)}
        onConfirm={async () => {
          const rid = deleteTarget?.resellerId.trim();
          if (!rid) return;
          try {
            await deleteMutation.mutateAsync(rid);
            setDeleteTarget(null);
            Alert.alert("Removed", "Assignment removed.");
          } catch (err) {
            Alert.alert("Failed", extractApiErrorMessage(err));
          }
        }}
      />
    </View>
  );
}

function PlatformMailAssignmentModal({
  open,
  resellerId: initialResellerId,
  resellerLabel,
  lockReseller,
  onClose,
  onSaved,
}: {
  open: boolean;
  resellerId: string;
  resellerLabel?: string;
  lockReseller: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { canUpdate } = useSmtpEmailAccess();
  const [resellerId, setResellerId] = useState(initialResellerId);
  const [isEnabled, setIsEnabled] = useState(true);
  const activeId = resellerId.trim();

  useEffect(() => {
    if (open) setResellerId(initialResellerId);
  }, [open, initialResellerId]);

  const platformQuery = usePlatformEmailSettingsQuery({ enabled: open });
  const assignmentQuery = usePlatformMailAssignmentQuery(activeId, {
    enabled: open && Boolean(activeId),
  });
  const updateMutation = useUpdatePlatformMailAssignmentMutation(activeId);

  useEffect(() => {
    const a = assignmentQuery.data;
    if (a) setIsEnabled(Boolean(a.isEnabled));
  }, [assignmentQuery.data]);

  const resellersQuery = useCompaniesSetupResellersQuery({
    enabled: open && !lockReseller,
  });
  const resellerOptions = useMemo(
    () =>
      pickItemsArray(resellersQuery.data)
        .map((row) => toIdNameOption(row))
        .filter((x): x is { label: string; value: string } => x !== null),
    [resellersQuery.data],
  );

  return (
    <FormModal
      open={open}
      title={lockReseller ? "Edit platform mail assignment" : "Assign platform mail"}
      description="This reseller sends using your platform connection."
      onClose={onClose}
      onSave={async () => {
        if (!canUpdate || !activeId) return;
        try {
          await updateMutation.mutateAsync({ isEnabled });
          Alert.alert("Saved", "Platform mail assignment saved.");
          onSaved?.();
          onClose();
        } catch (err) {
          Alert.alert("Save failed", extractApiErrorMessage(err));
        }
      }}
      primaryButtonLabel={updateMutation.isPending ? "Saving…" : "Save"}
      primaryButtonDisabled={updateMutation.isPending || !canUpdate || !activeId}
    >
      <View style={{ gap: 12 }}>
        {lockReseller ? (
          <Typography variant="small" muted>
            Reseller: {resellerLabel?.trim() || activeId}
          </Typography>
        ) : (
          <SelectField
            label="Reseller"
            value={resellerId}
            onChange={setResellerId}
            options={
              resellerOptions.length
                ? resellerOptions
                : [{ value: "", label: resellersQuery.isLoading ? "Loading…" : "No resellers" }]
            }
          />
        )}

        {activeId ? (
          <>
            <AppCard style={{ gap: 4 }}>
              <Typography variant="small" muted>
                Platform sender
              </Typography>
              <Typography variant="medium">
                {platformQuery.data?.fromName || "—"} &lt;{platformQuery.data?.fromEmail || "—"}&gt;
              </Typography>
            </AppCard>
            <Checkbox checked={isEnabled} onChange={setIsEnabled} label="Enabled" />
          </>
        ) : (
          <Typography variant="small" muted>
            Select a reseller to continue.
          </Typography>
        )}
      </View>
    </FormModal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  rowBetween: { flexDirection: "row", alignItems: "center", gap: 8 },
  actions: { flexDirection: "row", gap: 8, marginTop: 4 },
});
