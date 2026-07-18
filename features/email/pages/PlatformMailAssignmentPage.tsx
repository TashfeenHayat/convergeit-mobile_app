import { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";

import { MobileScreen } from "@/components/layout";
import { AppCard, Typography } from "@/components/ui";
import { PlatformMailAssignmentsTable } from "@/features/email/components/PlatformMailAssignmentsTable";
import { useSmtpEmailAccess } from "@/features/email/hooks/useSmtpEmailAccess";
import { useAuth } from "@/lib/auth";
import { useAppTheme } from "@/theme";

export function PlatformMailAssignmentPage() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { canView } = useSmtpEmailAccess();

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
            You need SMTP email permissions to manage platform mail assignments.
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <View style={{ gap: theme.spacing.md }}>
        <Typography variant="boldLarge">Use platform mail</Typography>
        <Typography variant="medium" muted>
          Assign resellers to send via the global platform connection.
        </Typography>
        <PlatformMailAssignmentsTable />
      </View>
    </MobileScreen>
  );
}
