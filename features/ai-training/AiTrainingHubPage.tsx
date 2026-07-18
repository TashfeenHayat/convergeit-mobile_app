import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { MobileScreen } from "@/components/layout";
import { AppCard, Typography } from "@/components/ui";
import { useAppTheme } from "@/theme";
import { tokens } from "@/theme/tokens";

const PRODUCTS = [
  {
    title: "AI Assistant",
    description: "Train assistants with knowledge sources and behavior rules.",
    icon: "book-outline" as const,
    route: "/ai-training/index",
    accent: tokens.colors.accentBlue,
  },
  {
    title: "AI Chatbot",
    description: "Configure chatbot training, scraping, and test chat.",
    icon: "chatbubble-ellipses-outline" as const,
    route: "/ai-training/index",
    accent: tokens.colors.accentGreen,
  },
  {
    title: "Copilot",
    description: "Check copilot readiness across websites.",
    icon: "headset-outline" as const,
    route: "/ai-training/index",
    accent: tokens.colors.accentOrange,
  },
  {
    title: "Platform keys",
    description: "LLM provider configuration for the platform.",
    icon: "key-outline" as const,
    route: "/ai-training/index",
    accent: "#a78bfa",
  },
] as const;

/** Mobile AI training hub — product cards with web-deeplink hints. */
export function AiTrainingHubPage() {
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <MobileScreen>
      <View style={{ gap: theme.spacing.md }}>
        <View>
          <Typography variant="boldLarge">AI Training</Typography>
          <Typography variant="medium" muted style={{ marginTop: 4 }}>
            Train assistants, chatbots, and copilots. Full studio tools remain on web.
          </Typography>
        </View>

        <AppCard style={{ gap: 8 }}>
          <Typography variant="small" muted>
            Assistant, chatbot, and copilot products share website-scoped knowledge. Configure
            platform LLM keys before enabling training.
          </Typography>
        </AppCard>

        <View style={{ gap: theme.spacing.sm }}>
          {PRODUCTS.map((product) => (
            <Pressable
              key={product.title}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() =>
                router.push(product.route as never)
              }
            >
              <View style={[styles.iconBox, { backgroundColor: `${product.accent}22` }]}>
                <Ionicons name={product.icon} size={22} color={product.accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <Typography variant="medium16" style={{ fontWeight: "600" }}>
                  {product.title}
                </Typography>
                <Typography variant="small" muted>
                  {product.description}
                </Typography>
              </View>
              <Ionicons name="chevron-forward" size={16} color={tokens.colors.textMuted} />
            </Pressable>
          ))}
        </View>
      </View>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    backgroundColor: "rgba(26, 28, 36, 0.55)",
  },
  cardPressed: { opacity: 0.88 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
