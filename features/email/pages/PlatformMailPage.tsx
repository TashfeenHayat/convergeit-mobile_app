import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { MobileScreen } from "@/components/layout";
import { AppCard, Button, StatusChip, Typography } from "@/components/ui";
import { OwnMailConfigModal } from "@/features/email/components/OwnMailConfigModal";
import { PlatformMailAssignmentsTable } from "@/features/email/components/PlatformMailAssignmentsTable";
import { PROVIDER_CODE_LABELS } from "@/features/email/email.constants";
import { usePlatformEmailSettingsQuery } from "@/features/email/hooks/useEmailSettings";
import { useSmtpEmailAccess } from "@/features/email/hooks/useSmtpEmailAccess";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth";
import { useAppTheme } from "@/theme";

export function PlatformMailPage() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { canView, canUpdate } = useSmtpEmailAccess();
  const [modalOpen, setModalOpen] = useState(false);
  const settingsQuery = usePlatformEmailSettingsQuery({ enabled: canView });

  useEffect(() => {
    if (user && user.userType !== "Internal") {
      router.replace("/email/setup/reseller" as never);
    }
  }, [user, router]);

  if (!canView) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" muted>
            You need SMTP email permissions to view platform mail.
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  const settings = settingsQuery.data;
  const providerLabel =
    settings?.providerName ??
    PROVIDER_CODE_LABELS[settings?.providerCode ?? ""] ??
    settings?.providerCode ??
    "Not configured";

  return (
    <MobileScreen>
      <View style={{ gap: theme.spacing.md }}>
        <View>
          <Typography variant="boldLarge">Platform mail</Typography>
          <Typography variant="medium" muted style={{ marginTop: 4 }}>
            Global SMTP/API used when resellers are assigned to platform mail.
          </Typography>
        </View>

        <AppCard style={{ gap: 8 }}>
          <View style={styles.rowBetween}>
            <Typography variant="medium16" style={{ fontWeight: "600" }}>
              Connection
            </Typography>
            {settings?.emailProviderId ? (
              <StatusChip
                label={settings.isEnabled ? "Enabled" : "Disabled"}
                tone={settings.isEnabled ? "success" : "neutral"}
              />
            ) : (
              <StatusChip label="Not set" tone="neutral" />
            )}
          </View>

          {settingsQuery.isLoading ? (
            <ActivityIndicator color={theme.app.dashboard.accentBlue} />
          ) : settingsQuery.isError ? (
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(settingsQuery.error, "Could not load settings.")}
            </Typography>
          ) : (
            <>
              <Typography variant="small" muted>
                Provider: {providerLabel}
              </Typography>
              <Typography variant="small" muted>
                From: {settings?.fromName ? `${settings.fromName} · ` : ""}
                {settings?.fromEmail || "—"}
              </Typography>
              {settings?.lastTestStatus ? (
                <Typography variant="small" muted>
                  Last test: {settings.lastTestStatus}
                  {settings.lastTestMessage ? ` — ${settings.lastTestMessage}` : ""}
                </Typography>
              ) : null}
            </>
          )}

          {canUpdate ? (
            <Button onPress={() => setModalOpen(true)}>
              {settings?.emailProviderId ? "Edit platform mail" : "Configure platform mail"}
            </Button>
          ) : null}
        </AppCard>

        <PlatformMailAssignmentsTable />
      </View>

      <OwnMailConfigModal
        open={modalOpen}
        mode="platform"
        onClose={() => setModalOpen(false)}
        onSaved={() => void settingsQuery.refetch()}
      />
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
});
