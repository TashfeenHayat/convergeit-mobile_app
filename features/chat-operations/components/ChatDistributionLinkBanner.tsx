import { StyleSheet, View } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { ChatMessageAttachmentCard } from "./ChatMessageAttachmentCard";

export function ChatDistributionLinkBanner({
  href,
  submitted,
  embedded = false,
  hint = "Chat closed. Open the distribution form to send the transcript to a department.",
  buttonLabel = "Open distribution form",
  submittedHint = "Distribution already submitted for this chat.",
}: {
  href: string;
  submitted?: boolean;
  embedded?: boolean;
  hint?: string;
  buttonLabel?: string;
  submittedHint?: string;
}) {
  const formKind = buttonLabel.toLowerCase().includes("wrap") || hint.toLowerCase().includes("wrap-up") ? "close" : "distribution";

  if (submitted) {
    return (
      <Typography variant="small" muted style={{ fontSize: 12 }}>
        {submittedHint}
      </Typography>
    );
  }

  if (embedded) {
    return <ChatMessageAttachmentCard href={href} title={buttonLabel} subtitle={hint} formKind={formKind} />;
  }

  return (
    <View style={styles.banner}>
      <Typography variant="small" muted style={{ fontSize: 11, marginBottom: 8 }}>
        {hint}
      </Typography>
      <ChatMessageAttachmentCard href={href} title={buttonLabel} formKind={formKind} />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: tokens.space.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(88, 101, 242, 0.3)",
    backgroundColor: "rgba(88, 101, 242, 0.08)",
  },
});
