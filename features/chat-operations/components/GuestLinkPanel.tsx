import { StyleSheet, View } from "react-native";
import { Button, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { ChatSideToolCard } from "@/features/chat-shared";
import { useGuestLinkActions } from "../hooks/useGuestLinkActions";
import type { GuestLinkSendTarget } from "@/services/chat/guest.types";

interface GuestLinkPanelProps {
  conversationId: string | null;
  hasOperational: (p: string) => boolean;
  disabled?: boolean;
}

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function matchedViaLabel(via: GuestLinkSendTarget["matchedVia"]): string {
  if (via === "inquiry_external_topic") return "Inquire topic → external dept";
  if (via === "conversation_department") return "Chat department";
  return "Manual override";
}

export function GuestLinkPanel({ conversationId, hasOperational, disabled = false }: GuestLinkPanelProps) {
  const guest = useGuestLinkActions(conversationId, hasOperational);

  if (!conversationId || !guest.enabled) return null;

  const target = guest.target;

  return (
    <ChatSideToolCard
      accent="guest"
      title="Send involvement link"
      subtitle="Emails involvement supervisors for this chat's inquire topic (external department)."
    >
      <View style={styles.targetBox}>
        {guest.targetLoading ? (
          <Typography variant="small" muted>
            Checking target department…
          </Typography>
        ) : target ? (
          <>
            {target.topicLabel ? (
              <Typography variant="small" style={{ marginBottom: 4 }}>
                <Typography variant="small" style={{ fontWeight: "700" }}>
                  Inquire topic:{" "}
                </Typography>
                {target.topicLabel}
              </Typography>
            ) : null}
            <Typography variant="small" style={{ marginBottom: 4 }}>
              <Typography variant="small" style={{ fontWeight: "700" }}>
                Involvement department:{" "}
              </Typography>
              {target.departmentName}
            </Typography>
            {target.conversationDepartmentName && target.chatRoutedElsewhere ? (
              <Typography variant="small" muted style={{ marginBottom: 4, fontSize: 10 }}>
                Chat routed to: {target.conversationDepartmentName} (agents)
              </Typography>
            ) : null}
            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Typography variant="small" style={{ fontSize: 10 }}>
                  {matchedViaLabel(target.matchedVia)}
                </Typography>
              </View>
              <View style={[styles.chip, target.canSend ? styles.chipSuccess : styles.chipWarning]}>
                <Typography variant="small" style={{ fontSize: 10 }}>
                  {target.canSend ? `${target.supervisorCount} supervisor${target.supervisorCount === 1 ? "" : "s"}` : "No supervisors"}
                </Typography>
              </View>
            </View>
            {target.hint ? (
              <Typography variant="small" style={{ marginTop: 6, fontSize: 10, color: tokens.colors.accentOrange }}>
                {target.hint}
              </Typography>
            ) : null}
          </>
        ) : (
          <Typography variant="small" muted style={{ fontSize: 11 }}>
            Could not load send target. Refresh or check chat routing.
          </Typography>
        )}
      </View>

      <Button variant="primary" disabled={disabled || guest.sendDisabled} onPress={() => void guest.sendLink()} fullWidth>
        {guest.busy ? "Sending…" : "Send involvement link"}
      </Button>

      {guest.links.length > 0 ? (
        <View style={{ marginTop: 12 }}>
          <Typography variant="small" style={{ fontWeight: "700", marginBottom: 6 }}>
            Recent links
          </Typography>
          {guest.links.slice(0, 5).map((link) => {
            const revoked = Boolean(link.revokedAt);
            const opened = Boolean(link.firstOpenedAt);
            const label = revoked ? "Revoked" : opened ? "Opened" : "Pending";
            return (
              <View key={link.id} style={styles.linkRow}>
                <View style={styles.chip}>
                  <Typography variant="small" style={{ fontSize: 10 }}>
                    {label}
                  </Typography>
                </View>
                <Typography variant="small" style={{ fontSize: 11, marginTop: 4 }}>
                  {link.recipientEmail}
                </Typography>
                <Typography variant="small" muted style={{ fontSize: 10 }}>
                  {link.department?.name ?? "Dept"} · expires {formatWhen(link.expiresAt)}
                  {link.firstOpenedByEmail ? ` · opened by ${link.firstOpenedByEmail}` : ""}
                </Typography>
              </View>
            );
          })}
        </View>
      ) : null}
    </ChatSideToolCard>
  );
}

const styles = StyleSheet.create({
  targetBox: {
    marginTop: 4,
    marginBottom: tokens.space.sm,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
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
  linkRow: {
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
});
