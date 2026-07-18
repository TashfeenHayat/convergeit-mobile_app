import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { useGuestLinkActions } from "../hooks/useGuestLinkActions";

interface GuestLinkHeaderActionProps {
  conversationId: string | null;
  hasOperational: (p: string) => boolean;
  serviceChannel?: string | null;
  disabled?: boolean;
}

export function GuestLinkHeaderAction({ conversationId, hasOperational, serviceChannel = null, disabled = false }: GuestLinkHeaderActionProps) {
  const guest = useGuestLinkActions(conversationId, hasOperational, serviceChannel);
  const [open, setOpen] = useState(false);

  if (!guest.enabled) return null;

  const target = guest.target;

  return (
    <>
      <Pressable
        disabled={disabled || guest.busy}
        onPress={() => setOpen(true)}
        style={[styles.chipButton, (disabled || guest.busy) && styles.disabled]}
        accessibilityRole="button"
        accessibilityLabel="Involve supervisor"
      >
        <Ionicons name="people-outline" size={14} color={tokens.colors.accentBlue} />
        <Typography variant="small" color={tokens.colors.accentBlue} style={{ fontWeight: "700" }}>
          Involve
        </Typography>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.card} onPress={() => undefined}>
            <Typography variant="mediumLarge" style={{ marginBottom: 10 }}>
              Involve supervisor
            </Typography>

            {guest.targetLoading ? (
              <Typography variant="small" muted>
                Loading…
              </Typography>
            ) : target ? (
              <View style={styles.chipRow}>
                {target.topicLabel ? (
                  <View style={styles.chip}>
                    <Typography variant="small" style={{ fontSize: 10 }}>
                      {target.topicLabel}
                    </Typography>
                  </View>
                ) : null}
                <View style={styles.chip}>
                  <Typography variant="small" style={{ fontSize: 10 }}>
                    {target.departmentName}
                  </Typography>
                </View>
                <View style={[styles.chip, target.canSend ? styles.chipSuccess : styles.chipWarning]}>
                  <Typography variant="small" style={{ fontSize: 10 }}>
                    {target.canSend ? `${target.supervisorCount} supervisor${target.supervisorCount === 1 ? "" : "s"}` : "No supervisors"}
                  </Typography>
                </View>
              </View>
            ) : (
              <Typography variant="small" muted>
                Could not load target.
              </Typography>
            )}

            <View style={styles.actions}>
              <Button variant="secondary" style={{ flex: 1 }} onPress={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                style={{ flex: 1 }}
                disabled={disabled || guest.sendDisabled}
                onPress={() => {
                  void guest.sendLink().then((ok) => {
                    if (ok) setOpen(false);
                  });
                }}
              >
                {guest.busy ? "Sending…" : "Send link"}
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
    borderColor: "rgba(88, 101, 242, 0.45)",
    backgroundColor: "rgba(88, 101, 242, 0.1)",
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
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: tokens.radius.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  chipSuccess: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
  },
  chipWarning: {
    backgroundColor: "rgba(249, 115, 22, 0.2)",
  },
  actions: {
    flexDirection: "row",
    gap: tokens.space.sm,
    marginTop: 4,
  },
});
