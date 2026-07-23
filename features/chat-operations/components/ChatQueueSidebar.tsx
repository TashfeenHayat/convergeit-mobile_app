import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { LiquidGlass, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { ConversationSummary } from "@/services/chat/chat.types";
import { getInboxRowLabels } from "@/services/chat/visitor-presentation";
import { useSidebarTypingPreviews } from "@/lib/hooks/chat/useConversationTyping";
import { getConversationPreview } from "../utils/conversation-preview";
import { formatRelativeQueueTime } from "../utils/format-message-time";
import { resolveQueueFormActionHint, resolveQueueFormStatusLabel } from "../utils/chat-close-outcome";
import { ConnectionStatusBar } from "./ConnectionStatusBar";

export type ChatQueueTab = "active" | "pending" | "completed" | "spam";

interface ChatQueueSidebarProps {
  queueTab: ChatQueueTab;
  onQueueTabChange: (tab: ChatQueueTab) => void;
  conversations: ConversationSummary[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  activeCount: number;
  pendingCount: number;
  completedCount: number;
  spamCount: number;
  connected: boolean;
  hasToken: boolean;
}

const TABS: Array<{ id: ChatQueueTab; label: string; short: string }> = [
  { id: "active", label: "Active", short: "Active" },
  { id: "pending", label: "Form pending", short: "Pending" },
  { id: "completed", label: "Meaningful", short: "Done" },
  { id: "spam", label: "Spam", short: "Spam" },
];

const AVATAR_COLORS = ["#0084FF", "#A855F7", "#EC4899", "#22C55E", "#F97316", "#06B6D4"];

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i) * 17) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function ChatQueueSidebar({
  queueTab,
  onQueueTabChange,
  conversations,
  selectedConversationId,
  onSelectConversation,
  activeCount,
  pendingCount,
  completedCount,
  spamCount,
  connected,
  hasToken,
}: ChatQueueSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const sidebarTypingMap = useSidebarTypingPreviews();
  const counts: Record<ChatQueueTab, number> = {
    active: activeCount,
    pending: pendingCount,
    completed: completedCount,
    spam: spamCount,
  };

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const { title, subtitle } = getInboxRowLabels(c);
      const haystack = [title, subtitle ?? "", String(c.id)].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [conversations, searchQuery]);

  const endedTab = queueTab === "pending" || queueTab === "completed" || queueTab === "spam";
  const previewFallback =
    queueTab === "pending"
      ? "Open distribution form to finish"
      : queueTab === "completed"
        ? "Meaningful chat"
        : queueTab === "spam"
          ? "Spam chat"
          : "No messages yet";
  const emptyQueueMessage =
    queueTab === "pending"
      ? "No chats waiting on a distribution form"
      : queueTab === "completed"
        ? "No meaningful chats in this queue"
        : queueTab === "spam"
          ? "No spam chats in this queue"
          : "No conversations in this queue";

  return (
    <View style={styles.column}>
      <View style={styles.toolbar}>
        <View>
          <Typography variant="boldLarge" style={{ fontSize: 26, lineHeight: 32 }}>
            Messages
          </Typography>
          <Typography variant="small" muted>
            Your inbox
          </Typography>
        </View>
        <ConnectionStatusBar connected={connected} hasToken={hasToken} compact />
      </View>

      <View style={styles.searchOuter}>
        <LiquidGlass intensity="subtle" radius={22} contentStyle={styles.searchWrap}>
          <FontAwesome name="search" size={14} color={tokens.colors.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search"
            placeholderTextColor={tokens.colors.textPlaceholder}
            style={styles.searchInput}
 />
        </LiquidGlass>
      </View>

      <View style={styles.tabsScroll}>
        {TABS.map((tab) => {
          const active = queueTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onQueueTabChange(tab.id)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Typography
                variant="small"
                color={active ? "#fff" : tokens.colors.textMuted}
                style={{ fontWeight: active ? "700" : "600", fontSize: 12 }}
                numberOfLines={1}
              >
                {tab.short} {counts[tab.id] > 0 ? counts[tab.id] : ""}
              </Typography>
            </Pressable>
          );
        })}
      </View>

      {queueTab === "pending" ? (
        <Typography variant="small" muted style={styles.tabHint}>
          Chats closed — complete the distribution form to send the transcript.
        </Typography>
      ) : queueTab === "completed" ? (
        <Typography variant="small" muted style={styles.tabHint}>
          Chats where the distribution form was sent.
        </Typography>
      ) : null}

      <FlatList
        data={filteredConversations}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingVertical: 4, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <FontAwesome name="comments" size={28} color="rgba(0,132,255,0.7)" />
            </View>
            <Typography variant="medium" muted style={{ textAlign: "center" }}>
              {searchQuery.trim() ? "No results" : emptyQueueMessage}
            </Typography>
          </View>
        }
        renderItem={({ item: conversation }) => {
          const { title, subtitle, initials } = getInboxRowLabels(conversation);
          const selected = conversation.id === selectedConversationId;
          const unread =
            typeof conversation.unreadCount === "number" && conversation.unreadCount > 0
              ? conversation.unreadCount
              : 0;
          const time = formatRelativeQueueTime(
            typeof conversation.lastMessageAt === "string" ? conversation.lastMessageAt : undefined,
          );
          const preview = getConversationPreview(conversation, previewFallback);
          const formStatusLabel = endedTab ? resolveQueueFormStatusLabel(conversation) : null;
          const formActionHint = endedTab ? resolveQueueFormActionHint(conversation) : null;
          const transferLabel =
            queueTab === "active" &&
            conversation.lastTransferFrom &&
            typeof conversation.lastTransferFrom.label === "string"
              ? conversation.lastTransferFrom.label.trim()
              : "";
          const liveTyping = !endedTab ? sidebarTypingMap.get(conversation.id.toLowerCase()) : undefined;
          const liveDraft = liveTyping?.draft?.trim() ?? "";
          const liveLabel = liveTyping?.label?.trim() ?? "";
          const rowPreview = liveDraft
            ? liveLabel
              ? `${liveLabel}: ${liveDraft}`
              : liveDraft
            : formActionHint && preview === previewFallback
              ? formActionHint
              : preview;
          const isLiveTyping = Boolean(liveDraft);
          const color = avatarColor(conversation.id || title);

          return (
            <Pressable
              onPress={() => onSelectConversation(conversation.id)}
              style={[styles.row, selected && styles.rowActive]}
            >
              <View style={styles.avatarWrap}>
                <View style={[styles.avatar, { backgroundColor: color }]}>
                  <Typography variant="medium" style={{ fontWeight: "700", color: "#fff" }}>
                    {initials}
                  </Typography>
                </View>
                {unread > 0 && !endedTab ? (
                  <View style={styles.badge}>
                    <Typography variant="small" color="#fff" style={{ fontSize: 10, fontWeight: "700" }}>
                      {unread > 9 ? "9+" : unread}
                    </Typography>
                  </View>
                ) : null}
              </View>
              <View style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                  <Typography
                    variant="medium16"
                    style={{ fontWeight: unread > 0 ? "700" : "600", flex: 1 }}
                    numberOfLines={1}
                  >
                    {title}
                  </Typography>
                  {time ? (
                    <Typography
                      variant="small"
                      color={unread > 0 ? "#0084FF" : tokens.colors.textMuted}
                      style={{ fontWeight: unread > 0 ? "700" : "400" }}
                    >
                      {time}
                    </Typography>
                  ) : null}
                </View>
                {subtitle ? (
                  <Typography variant="small" muted numberOfLines={1} style={{ marginTop: 1 }}>
                    {subtitle}
                  </Typography>
                ) : null}
                {formStatusLabel ? (
                  <Typography
                    variant="small"
                    color={formStatusLabel === "Form pending" ? "#0084FF" : tokens.colors.accentGreen}
                    style={{ fontWeight: "600", fontSize: 11, marginTop: 2 }}
                    numberOfLines={1}
                  >
                    {formStatusLabel}
                  </Typography>
                ) : null}
                {transferLabel ? (
                  <Typography
                    variant="small"
                    color={tokens.colors.accentOrange}
                    style={{ fontWeight: "600", fontSize: 11, marginTop: 2 }}
                    numberOfLines={1}
                  >
                    From {transferLabel}
                  </Typography>
                ) : null}
                <Typography
                  variant="small"
                  color={
                    isLiveTyping
                      ? "#0084FF"
                      : unread > 0 && !endedTab
                        ? tokens.colors.textPrimary
                        : tokens.colors.textMuted
                  }
                  style={{
                    fontStyle: isLiveTyping ? "italic" : "normal",
                    marginTop: 3,
                    fontWeight: unread > 0 && !endedTab ? "600" : "400",
                  }}
                  numberOfLines={2}
                >
                  {isLiveTyping ? liveDraft : rowPreview}
                </Typography>
              </View>
            </Pressable>
          );
        }}
  showsVerticalScrollIndicator={false}/>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    minHeight: 0,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: tokens.space.lg,
    paddingTop: tokens.space.sm,
    paddingBottom: tokens.space.sm,
  },
  searchOuter: {
    paddingHorizontal: tokens.space.md,
    paddingBottom: tokens.space.sm,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: tokens.colors.textPrimary,
    fontSize: 15,
    padding: 0,
  },
  tabsScroll: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: tokens.space.md,
    paddingBottom: tokens.space.sm,
  },
  tab: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  tabActive: {
    backgroundColor: "#0084FF",
  },
  tabHint: {
    paddingHorizontal: tokens.space.lg,
    paddingBottom: 8,
    lineHeight: 16,
  },
  empty: {
    paddingVertical: 56,
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,132,255,0.12)",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: 12,
    borderRadius: 16,
    marginHorizontal: 6,
  },
  rowActive: {
    backgroundColor: "rgba(0, 132, 255, 0.12)",
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0084FF",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#0a0a2c",
  },
});
