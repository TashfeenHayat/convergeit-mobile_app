import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { ScopeSelectField } from "@/features/chat-shared";
import { useTransferChat } from "../hooks/useTransferChat";

interface TransferChatHeaderActionProps {
  conversationId: string | null;
  disabled?: boolean;
}

export function TransferChatHeaderAction({ conversationId, disabled = false }: TransferChatHeaderActionProps) {
  const transfer = useTransferChat(conversationId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!transfer.enabled) return null;

  const openDialog = () => {
    setConfirmOpen(true);
    void transfer.loadTargets();
  };

  return (
    <>
      <Pressable
        disabled={disabled || transfer.busy}
        onPress={openDialog}
        style={[styles.chipButton, (disabled || transfer.busy) && styles.disabled]}
        accessibilityRole="button"
        accessibilityLabel="Transfer chat"
      >
        <Ionicons name="arrow-redo-outline" size={14} color={tokens.colors.accentOrange} />
        <Typography variant="small" color={tokens.colors.accentOrange} style={{ fontWeight: "700" }}>
          Transfer
        </Typography>
      </Pressable>

      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => !transfer.busy && setConfirmOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => !transfer.busy && setConfirmOpen(false)}>
          <Pressable style={styles.card} onPress={() => undefined}>
            <Typography variant="mediumLarge" style={{ marginBottom: 6 }}>
              Transfer chat
            </Typography>
            <Typography variant="small" muted style={{ marginBottom: 14, lineHeight: 18 }}>
              Choose an agent assigned to this website. They will receive this chat in their inbox.
            </Typography>

            <ScopeSelectField
              label="Agent"
              value={transfer.selectedUserId}
              onChange={transfer.setSelectedUserId}
              options={transfer.targets.map((t) => ({ value: t.userId, label: t.name }))}
              disabled={transfer.loadingTargets}
              placeholder={transfer.loadingTargets ? "Loading agents…" : "Select agent"}
            />

            {!transfer.loadingTargets && transfer.targets.length === 0 ? (
              <Typography variant="small" style={{ marginTop: 10, color: tokens.colors.accentOrange }}>
                No other agents are assigned to this website.
              </Typography>
            ) : null}

            <View style={styles.actions}>
              <Button variant="secondary" style={{ flex: 1 }} disabled={transfer.busy} onPress={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                style={{ flex: 1 }}
                disabled={disabled || transfer.busy || !transfer.selectedUserId.trim() || transfer.loadingTargets}
                onPress={() => {
                  void transfer.transfer().then((ok) => {
                    if (ok) setConfirmOpen(false);
                  });
                }}
              >
                {transfer.busy ? "Transferring…" : "Transfer"}
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.45)",
    backgroundColor: "rgba(249, 115, 22, 0.1)",
  },
  disabled: {
    opacity: 0.5,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.space.lg,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    backgroundColor: tokens.colors.surfaceElevated,
    padding: tokens.space.lg,
  },
  actions: {
    flexDirection: "row",
    gap: tokens.space.sm,
    marginTop: tokens.space.lg,
  },
});
