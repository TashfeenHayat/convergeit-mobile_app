import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { AppCard, Button, Typography } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useAppTheme } from "@/theme";
import { tokens } from "@/theme/tokens";

/** Profile summary panel — mirrors web settings profile card on mobile. */
export function SettingsProfilePanel() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user, logout, isPlatformAdmin, pagePermissions, operationalPermissions } = useAuth();

  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Signed in user";
  const roleName =
    typeof user?.role === "string"
      ? user.role
      : user?.role && typeof user.role === "object" && "name" in user.role
        ? String(user.role.name || "—")
        : "—";

  const onLogout = () => {
    Alert.alert("Sign out?", "You will need to log in again to use the app.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          void (async () => {
            await logout();
            router.replace("/login");
          })();
        },
      },
    ]);
  };

  return (
    <View style={{ gap: theme.spacing.md }}>
      <Typography variant="boldLarge">Profile</Typography>
      <Typography variant="medium" muted>
        Your account details and sign-out.
      </Typography>
      <AppCard style={{ gap: theme.spacing.md }}>
        <Field label="Name" value={name} />
        <Field label="Email" value={user?.email || "—"} />
        <Field label="Role" value={roleName} />
        <Field label="User type" value={user?.userType || "—"} />
        <Field label="Platform admin" value={isPlatformAdmin ? "Yes" : "No"} />
        <Field label="Page permissions" value={String(pagePermissions.length)} />
        <Field label="Operational permissions" value={String(operationalPermissions.length)} />
        <Button fullWidth variant="danger" onPress={onLogout}>
          Sign out
        </Button>
      </AppCard>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Typography variant="small" muted>
        {label}
      </Typography>
      <Typography variant="medium16">{value}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 2 },
});
