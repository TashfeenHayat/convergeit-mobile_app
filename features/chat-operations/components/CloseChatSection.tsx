import { useState } from "react";
import { StyleSheet, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Button, ConfirmActionModal, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { CloseChatPanel } from "../styles/chat-operations.styled";

interface CloseChatSectionProps {
  visitorName: string;
  conversationId: string | null;
  disabled?: boolean;
  onCloseChat: () => void | Promise<void>;
}

export function CloseChatSection({ visitorName, conversationId, disabled = false, onCloseChat }: CloseChatSectionProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  if (!conversationId) return null;

  const handleConfirm = async () => {
    setClosing(true);
    try {
      await onCloseChat();
      setConfirmOpen(false);
    } finally {
      setClosing(false);
    }
  };

  return (
    <>
      <CloseChatPanel>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: tokens.space.sm }}>
          <View style={styles.iconBox}>
            <FontAwesome name="times" size={16} color={tokens.colors.danger} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography variant="medium" style={{ fontWeight: "600" }}>
              Close chat
            </Typography>
            <Typography variant="small" muted style={{ marginTop: 3, lineHeight: 17 }}>
              End the live session with {visitorName}. The conversation leaves your active inbox and may be reassigned.
            </Typography>
          </View>
        </View>
        <Button variant="secondary" disabled={disabled || closing} onPress={() => setConfirmOpen(true)} style={{ marginTop: tokens.space.md }}>
          Close conversation
        </Button>
      </CloseChatPanel>

      <ConfirmActionModal
        open={confirmOpen}
        title="Close this chat?"
        description={`You are about to close the conversation with ${visitorName}. Unread messages will be cleared from your queue.`}
        confirmLabel={closing ? "Closing…" : "Yes, close chat"}
        cancelLabel="Cancel"
        onDismiss={() => !closing && setConfirmOpen(false)}
        onConfirm={() => void handleConfirm()}
        isLoading={closing}
        confirmButtonVariant="danger"
      />
    </>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.28)",
  },
});
