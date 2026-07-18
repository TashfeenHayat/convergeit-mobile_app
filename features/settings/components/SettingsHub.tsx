import { Link, type Href } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { DashboardCard, Typography } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { PAGE } from "@/lib/permissions/permission-constants";
import { useAppTheme } from "@/theme";
import { tokens } from "@/theme/tokens";

type SettingsCard = {
  href: Href;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  visible: boolean;
};

/** Mobile settings hub — navigates to profile, logs, billing, and security. */
export function SettingsHub() {
  const theme = useAppTheme();
  const { hasPage, isPlatformAdmin, user } = useAuth();
  const isResellerAdmin = user?.wideResellerScope === true && !isPlatformAdmin;

  const cards: SettingsCard[] = [
    {
      href: "/settings/profile/index" as Href,
      title: "Profile",
      description: "Your name, email, and account details.",
      icon: "person-outline",
      visible: hasPage(PAGE.SETTINGS),
    },
    {
      href: "/security/index" as Href,
      title: "Security",
      description: "Sessions and security preferences.",
      icon: "shield-outline",
      visible: hasPage(PAGE.SETTINGS),
    },
    {
      href: "/settings/logs/index" as Href,
      title: "System logs",
      description: "Platform audit and analytics events.",
      icon: "list-outline",
      visible: isPlatformAdmin || hasPage(PAGE.OBSERVABILITY_LOGS),
    },
    {
      href: "/billing/index" as Href,
      title: "Billing & invoices",
      description: "Client invoices, contracts, and subscription.",
      icon: "card-outline",
      visible: hasPage(PAGE.BILLING),
    },
    {
      href: "/billing/index" as Href,
      title: "Payment setup",
      description: "Stripe keys and checkout configuration.",
      icon: "wallet-outline",
      visible: isPlatformAdmin || isResellerAdmin,
    },
  ].filter((c) => c.visible);

  return (
    <View style={{ gap: theme.spacing.md }}>
      <View>
        <Typography variant="boldLarge">Settings</Typography>
        <Typography variant="medium" muted style={{ marginTop: 4 }}>
          Account and platform configuration.
        </Typography>
      </View>

      <View style={styles.grid}>
        {cards.map((card) => (
          <Link key={card.title} href={card.href} asChild>
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              accessibilityRole="button"
            >
              <View style={styles.iconBox}>
                <Ionicons name={card.icon} size={20} color={tokens.colors.accentBlue} />
              </View>
              <Typography variant="medium16" style={{ fontWeight: "600" }}>
                {card.title}
              </Typography>
              <Typography variant="small" muted>
                {card.description}
              </Typography>
            </Pressable>
          </Link>
        ))}
      </View>

      {cards.length === 0 ? (
        <DashboardCard>
          <Typography variant="medium" muted>
            No settings sections are available for your role.
          </Typography>
        </DashboardCard>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: tokens.space.sm },
  card: {
    padding: tokens.space.md,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    backgroundColor: "rgba(26, 28, 36, 0.55)",
    gap: 6,
  },
  cardPressed: { opacity: 0.88, backgroundColor: "rgba(88, 101, 242, 0.1)" },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(88, 101, 242, 0.14)",
    marginBottom: 4,
  },
});
