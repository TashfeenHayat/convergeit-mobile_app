import { useEffect, useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Button, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { ChatMessageList } from "@/features/chat-operations/components/ChatMessageList";
import { parseVisitorInfo } from "@/features/chat-operations/utils/visitor-info";
import { extractVisitorPresentation } from "@/services/chat/visitor-presentation";
import { useConversationTypingEntries } from "@/lib/hooks/chat/useConversationTyping";
import { useGuestChatSession } from "../hooks/useGuestChatSession";
import { GuestSupervisorActions } from "./GuestSupervisorActions";
import { chatGuestStyles as styles } from "../styles/chat-guest.styles";

export function GuestChatPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; e?: string }>();
  const emailToken = params.token?.trim() || null;
  const supervisorEmail = params.e?.trim() || null;

  const guest = useGuestChatSession(emailToken, supervisorEmail);

  useEffect(() => {
    if (!emailToken || guest.phase !== "ready") return;
    router.setParams({ token: undefined, e: undefined });
  }, [emailToken, guest.phase, router]);

  const vp =
    guest.transcript && typeof guest.transcript === "object"
      ? extractVisitorPresentation(guest.transcript as Record<string, unknown>)
      : null;
  const visitorInfo = parseVisitorInfo(
    guest.transcript?.visitor ?? null,
    guest.transcript as Record<string, unknown> | undefined,
  );
  const title = vp?.inboxTitle || vp?.displayName || visitorInfo.displayName;
  const remoteTypingEntries = useConversationTypingEntries(guest.session?.conversationId ?? null, {
    excludeUserId: guest.session?.involvementUserId ?? null,
  });
  const visitorIsTyping = useMemo(
    () => remoteTypingEntries.some((e) => e.kind === "visitor" && e.draft.trim().length > 0),
    [remoteTypingEntries],
  );
  const subtitle = vp
    ? [vp.originLabel, vp.locationLabel].filter(Boolean).join(" · ")
    : guest.session?.websiteLabel ?? null;
  const transcriptStatus = String(
    guest.transcript?.status ?? (guest.transcript?.conversationStatus as string | undefined) ?? "",
  )
    .trim()
    .toLowerCase();
  const isChatClosed =
    Boolean(guest.transcript?.chatCompleted) ||
    transcriptStatus === "closed" ||
    transcriptStatus === "completed" ||
    transcriptStatus === "resolved";

  return (
    <View style={styles.root}>
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <FontAwesome name="lock" size={18} color={tokens.colors.accentBlue} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Typography variant="mediumLarge" style={{ fontWeight: "700" }}>
              Secure chat view
            </Typography>
            <Typography variant="small" muted style={{ lineHeight: 17 }}>
              One supervisor per link — view transcript, whisper, or take over without signing in.
            </Typography>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        {guest.phase === "loading" ? (
          <View style={styles.centerFill}>
            <ActivityIndicator color={tokens.colors.accentBlue} />
            <Typography variant="small" muted>
              Opening secure session…
            </Typography>
          </View>
        ) : null}

        {(guest.phase === "error" || guest.phase === "no_access") && guest.error ? (
          <View style={styles.centerFill}>
            <Typography style={{ textAlign: "center" }}>{guest.error}</Typography>
            {/chat monitor/i.test(guest.error) ? (
              <Button
                variant="primary"
                size="compact"
                onPress={() => router.push("/auth/login" as Href)}
              >
                Sign in to Chat Monitor
              </Button>
            ) : null}
            {guest.session?.urlStrictSingleOpen ? (
              <Typography variant="small" muted style={{ textAlign: "center" }}>
                Only one supervisor can use the guest link per send. Others should sign in to Monitor.
              </Typography>
            ) : null}
          </View>
        ) : null}

        {guest.phase === "ready" && guest.session ? (
          <>
            <View style={styles.banner}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Typography variant="small" muted style={{ fontSize: 11 }}>
                  Read-only transcript{isChatClosed ? " · chat completed" : ""}
                </Typography>
                {!isChatClosed ? (
                  <View
                    style={[
                      styles.livePill,
                      {
                        backgroundColor: guest.isConnected ? "rgba(34,197,94,0.12)" : "rgba(34,211,238,0.12)",
                        borderWidth: 1,
                        borderColor: guest.isConnected ? "rgba(34,197,94,0.28)" : tokens.colors.accentCyan,
                      },
                    ]}
                  >
                    <Typography
                      variant="small"
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: guest.isConnected ? tokens.colors.accentGreen : tokens.colors.accentCyan,
                      }}
                    >
                      {guest.isConnected ? "Live" : "Syncing…"}
                    </Typography>
                  </View>
                ) : null}
              </View>
              <Button variant="secondary" size="compact" onPress={guest.signOutGuest}>
                End session
              </Button>
            </View>

            <View style={styles.threadHeader}>
              <View style={styles.avatar}>
                <Typography style={{ fontWeight: "700" }}>{visitorInfo.initials}</Typography>
              </View>
              <View style={{ flex: 1 }}>
                <Typography style={{ fontWeight: "700" }}>{title}</Typography>
                {subtitle ? (
                  <Typography variant="small" muted>
                    {subtitle}
                  </Typography>
                ) : null}
              </View>
              {guest.session.departmentName ? (
                <View style={styles.livePill}>
                  <Typography variant="small">{guest.session.departmentName}</Typography>
                </View>
              ) : null}
            </View>

            <View style={{ flex: 1, minHeight: 0 }}>
              <ChatMessageList
                conversationId={guest.session.conversationId}
                messages={guest.messages}
                visitorInitials={visitorInfo.initials}
                visitorTyping={visitorIsTyping}
                visitorDisplayName={title}
                agentDisplayName="Agent"
                showEmptyPlaceholder={guest.messages.length === 0}
 />
            </View>

            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator={false}>
              <GuestSupervisorActions
                session={guest.session}
                supervisorControlUserId={
                  typeof guest.transcript?.supervisorControlUserId === "string"
                    ? guest.transcript.supervisorControlUserId
                    : null
                }
                assignedAgentId={
                  typeof guest.transcript?.agentId === "string" ? guest.transcript.agentId : null
                }
                chatCompleted={isChatClosed}
                onOptimisticAgentMessage={guest.appendOptimisticMessage}
                onLiveTyping={guest.emitLiveTyping}
                onActionComplete={() => void guest.refreshTranscript()}
                guestSocket={guest.guestSocket}
 />
            </ScrollView>
          </>
        ) : null}
      </View>
    </View>
  );
}
