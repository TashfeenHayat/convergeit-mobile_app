import { StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

import { AppCard, Button, Typography } from "@/components/ui";
import { useAppTheme } from "@/theme";

import { PayPageShell } from "./PayPageShell";

export function PayCancelledPageClient() {
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <PayPageShell title="Payment cancelled">
      <AppCard style={styles.card}>
        <Ionicons
          name="close-circle-outline"
          size={56}
          color={theme.app.dashboard.accentOrange}
          style={styles.icon}
        />
        <Typography variant="boldLarge" style={styles.headline}>
          Payment cancelled
        </Typography>
        <Typography variant="medium" muted style={styles.description}>
          No charge was made. Return to your invoice link and try again when you are ready.
        </Typography>
        <Button variant="outlined" onPress={() => router.back()}>
          Go back
        </Button>
        <Button onPress={() => router.push("/billing" as never)}>Back to billing</Button>
      </AppCard>
    </PayPageShell>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 24,
  },
  icon: {
    marginBottom: 4,
  },
  headline: {
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: 8,
  },
});
