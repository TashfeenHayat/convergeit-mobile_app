import { useCallback, useState } from "react";
import { Alert, View } from "react-native";

import { MobileScreen } from "@/components/layout";
import { AppCard, Button, InputField, Typography } from "@/components/ui";
import {
  usePlatformEmailSettingsQuery,
  useResellerOwnMailSettingsQuery,
  useTestPlatformEmailSettingsMutation,
  useTestResellerOwnMailMutation,
} from "@/features/email/hooks/useEmailSettings";
import { useSmtpEmailAccess } from "@/features/email/hooks/useSmtpEmailAccess";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth";
import { useAppTheme } from "@/theme";

type TestTier = "platform" | "reseller" | "website";

export function EmailTestPage() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const { canView, canTest } = useSmtpEmailAccess();
  const isInternal = user?.userType === "Internal";
  const resellerId = user?.resellerId?.trim() ?? "";
  const [tier, setTier] = useState<TestTier>(isInternal ? "platform" : "reseller");
  const [toEmail, setToEmail] = useState("");

  const platformQuery = usePlatformEmailSettingsQuery({
    enabled: tier === "platform" && isInternal && canView,
  });
  const resellerQuery = useResellerOwnMailSettingsQuery(resellerId || null, {
    enabled: tier === "reseller" && Boolean(resellerId) && canView,
  });
  const testPlatformMutation = useTestPlatformEmailSettingsMutation();
  const testResellerMutation = useTestResellerOwnMailMutation(resellerId);

  const runTest = useCallback(async () => {
    if (!canTest) {
      Alert.alert("Permission", "You do not have permission to test email.");
      return;
    }
    try {
      const body = { toEmail: toEmail.trim() || undefined };
      const result =
        tier === "platform"
          ? await testPlatformMutation.mutateAsync(body)
          : await testResellerMutation.mutateAsync(body);
      Alert.alert(
        result.success ? "Test sent" : "Test failed",
        result.message || (result.success ? "Test email sent." : "Could not send test."),
      );
    } catch (err) {
      Alert.alert("Test failed", extractApiErrorMessage(err));
    }
  }, [canTest, tier, toEmail, testPlatformMutation, testResellerMutation]);

  if (!canView) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" muted>
            You need SMTP email permissions to test mail.
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  const ready =
    tier === "platform"
      ? Boolean(platformQuery.data?.emailProviderId)
      : tier === "reseller"
        ? Boolean(resellerQuery.data?.emailProviderId)
        : false;

  const lastStatus =
    tier === "platform"
      ? platformQuery.data?.lastTestStatus
      : resellerQuery.data?.lastTestStatus;
  const lastMessage =
    tier === "platform"
      ? platformQuery.data?.lastTestMessage
      : resellerQuery.data?.lastTestMessage;

  const testing = testPlatformMutation.isPending || testResellerMutation.isPending;

  return (
    <MobileScreen>
      <View style={{ gap: theme.spacing.md }}>
        <View>
          <Typography variant="boldLarge">Email test</Typography>
          <Typography variant="medium" muted style={{ marginTop: 4 }}>
            Send a test message using platform or reseller mail settings.
          </Typography>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {isInternal ? (
            <Button
              size="compact"
              variant={tier === "platform" ? "primary" : "outlined"}
              onPress={() => setTier("platform")}
            >
              Platform
            </Button>
          ) : null}
          <Button
            size="compact"
            variant={tier === "reseller" ? "primary" : "outlined"}
            onPress={() => setTier("reseller")}
          >
            Reseller
          </Button>
          <Button
            size="compact"
            variant={tier === "website" ? "primary" : "outlined"}
            onPress={() => setTier("website")}
          >
            Website
          </Button>
        </View>

        {tier === "website" ? (
          <AppCard>
            <Typography variant="medium" muted>
              Website-level test uses mail assigned per website. Configure distribution and SMTP
              under Email setup first.
            </Typography>
          </AppCard>
        ) : (
          <AppCard style={{ gap: 12 }}>
            {tier === "reseller" && !resellerId ? (
              <Typography variant="medium" muted>
                Your session has no reseller scope. Use platform test as an internal user, or open
                reseller mail setup.
              </Typography>
            ) : (
              <>
                <Typography variant="small" muted>
                  {ready
                    ? "Provider configured — ready to test."
                    : "Configure mail settings before testing."}
                </Typography>
                {lastStatus ? (
                  <Typography variant="small" muted>
                    Last test: {lastStatus}
                    {lastMessage ? ` — ${lastMessage}` : ""}
                  </Typography>
                ) : null}
                <InputField
                  label="Recipient email"
                  value={toEmail}
                  onChangeText={setToEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="you@company.com"
                />
                <Button
                  disabled={!ready || !canTest || testing}
                  loading={testing}
                  onPress={() => void runTest()}
                >
                  Send test email
                </Button>
              </>
            )}
          </AppCard>
        )}
      </View>
    </MobileScreen>
  );
}
