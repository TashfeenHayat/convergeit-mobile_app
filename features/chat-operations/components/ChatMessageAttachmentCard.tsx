import { Linking, Pressable, StyleSheet, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

type ChatMessageAttachmentCardProps = {
  href: string;
  title: string;
  subtitle?: string;
  formKind?: "distribution" | "close" | "setup" | string;
};

function formKindLabel(kind: string | undefined): string {
  if (kind === "distribution") return "Distribution form";
  if (kind === "setup") return "Distribution setup";
  if (kind === "close") return "Distribution form";
  return "Form";
}

export function ChatMessageAttachmentCard({ href, title, subtitle, formKind }: ChatMessageAttachmentCardProps) {
  return (
    <Pressable
      onPress={() => {
        if (/^https?:\/\//i.test(href)) void Linking.openURL(href);
      }}
      style={styles.card}
      accessibilityRole="link"
    >
      <View style={styles.header}>
        <FontAwesome name="file-text-o" size={14} color={tokens.colors.accentBlue} />
        <Typography variant="small" color={tokens.colors.accentBlue} style={{ fontWeight: "700", letterSpacing: 0.5 }}>
          {formKindLabel(formKind).toUpperCase()}
        </Typography>
      </View>
      <View style={styles.body}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Typography variant="medium" style={{ fontWeight: "600" }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="small" muted style={{ marginTop: 2 }}>
              {subtitle}
            </Typography>
          ) : null}
        </View>
        <FontAwesome name="external-link" size={14} color={tokens.colors.accentBlue} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 6,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(88, 101, 242, 0.35)",
    backgroundColor: "rgba(88, 101, 242, 0.06)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(88, 101, 242, 0.12)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(88, 101, 242, 0.2)",
  },
  body: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 10,
  },
});
