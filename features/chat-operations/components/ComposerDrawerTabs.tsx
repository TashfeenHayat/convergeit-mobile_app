import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Button, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { AgentAiAction } from "@/api/ai/agent-suggest.api";
import type { CannedResponseRow } from "@/services/chat/chat-settings.types";
import { CANNED_PERSONAL } from "../constants/canned-messages";
import type { AiChatMessage } from "../types/ai-chat";
import { useAgentCannedResponses } from "../hooks/useAgentCannedResponses";
import { AGENT_COPILOT_TAB_LABEL } from "@/lib/ai/ai-role-copy";
import { AiAssistantDrawer } from "./AiAssistantDrawer";

type CannedTabId = "website" | "shortcuts";

const CANNED_TAB_LABELS: Record<CannedTabId, string> = {
  website: "Website",
  shortcuts: "Shortcuts",
};

export interface ComposerDrawerTabsProps {
  onInsertCanned: (text: string) => void;
  websiteId?: string | null;
  aiMessages: AiChatMessage[];
  aiPrompt: string;
  onAiPromptChange: (value: string) => void;
  onSendAiPrompt: (prompt: string, action?: AgentAiAction) => void;
  onApplyAiToComposer: (text: string) => void;
  aiBusy: boolean;
  aiDisabled?: boolean;
  websiteRequiredDisabled?: boolean;
  hasConversation: boolean;
  agentInboxEnabled?: boolean;
  copilotEnabled?: boolean;
}

export function ComposerDrawerTabs({
  onInsertCanned,
  websiteId = null,
  aiMessages,
  aiPrompt,
  onAiPromptChange,
  onSendAiPrompt,
  onApplyAiToComposer,
  aiBusy,
  aiDisabled = false,
  websiteRequiredDisabled = false,
  hasConversation,
  agentInboxEnabled = true,
  copilotEnabled = true,
}: ComposerDrawerTabsProps) {
  const [openDrawer, setOpenDrawer] = useState<"canned" | "ai" | null>(null);
  const [cannedTab, setCannedTab] = useState<CannedTabId>("website");
  const [cannedFilter, setCannedFilter] = useState("");

  const cannedQuery = useAgentCannedResponses(websiteId, agentInboxEnabled);
  const websiteReady = Boolean(websiteId?.trim());

  const filteredCanned = useMemo(() => {
    const q = cannedFilter.trim().toLowerCase();
    if (cannedTab === "shortcuts") {
      const lines = CANNED_PERSONAL;
      const list = q ? lines.filter((l) => l.toLowerCase().includes(q)) : lines;
      return list.map((body) => ({ id: body, title: body, body }));
    }
    const rows: CannedResponseRow[] = cannedQuery.data ?? [];
    if (!q) return rows;
    return rows.filter((r) => r.title.toLowerCase().includes(q) || r.body.toLowerCase().includes(q));
  }, [cannedFilter, cannedTab, cannedQuery.data]);

  return (
    <>
      <View style={styles.tabBar}>
        <Pressable onPress={() => setOpenDrawer("canned")} style={styles.tabButton}>
          <FontAwesome name="comment-o" size={14} color={tokens.colors.textMuted} />
          <Typography variant="small" style={{ fontWeight: "600" }}>
            Canned replies
          </Typography>
        </Pressable>
        {copilotEnabled ? (
          <Pressable onPress={() => setOpenDrawer("ai")} style={styles.tabButton}>
            <FontAwesome name="magic" size={14} color={tokens.colors.accentBlue} />
            <Typography variant="small" style={{ fontWeight: "600" }}>
              {AGENT_COPILOT_TAB_LABEL}
            </Typography>
          </Pressable>
        ) : null}
      </View>

      <Modal visible={openDrawer === "canned"} animationType="slide" transparent onRequestClose={() => setOpenDrawer(null)}>
        <Pressable style={styles.backdrop} onPress={() => setOpenDrawer(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Typography variant="label" style={{ fontWeight: "700", flex: 1 }}>
              Canned replies
            </Typography>
            <Pressable onPress={() => setOpenDrawer(null)}>
              <FontAwesome name="times" size={18} color={tokens.colors.textMuted} />
            </Pressable>
          </View>
          <View style={styles.subTabRow}>
            {(["website", "shortcuts"] as CannedTabId[]).map((tab) => (
              <Pressable key={tab} onPress={() => setCannedTab(tab)} style={[styles.subTab, cannedTab === tab && styles.subTabActive]}>
                <Typography variant="small" color={cannedTab === tab ? tokens.colors.textPrimary : tokens.colors.textMuted}>
                  {CANNED_TAB_LABELS[tab]}
                </Typography>
              </Pressable>
            ))}
          </View>
          {cannedTab === "website" && !websiteReady ? (
            <Typography variant="small" muted style={{ paddingVertical: tokens.space.sm }}>
              Open a conversation to load canned replies for that website.
            </Typography>
          ) : null}
          {cannedTab === "website" && websiteReady && cannedQuery.isLoading ? (
            <Typography variant="small" muted style={{ paddingVertical: tokens.space.sm }}>
              Loading website replies…
            </Typography>
          ) : null}
          <TextInput
            value={cannedFilter}
            onChangeText={setCannedFilter}
            placeholder="Search replies…"
            placeholderTextColor={tokens.colors.textPlaceholder}
            style={styles.searchInput}
 />
          <FlatList
            data={filteredCanned}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 320 }}
            ListEmptyComponent={
              <Typography variant="small" muted style={{ paddingVertical: tokens.space.sm }}>
                {cannedTab === "website" && websiteReady ? "No canned messages for this website yet." : "No matching replies"}
              </Typography>
            }
            renderItem={({ item }) => (
              <View style={styles.cannedCard}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  {item.title && item.title !== item.body ? (
                    <Typography variant="small" color={tokens.colors.accentBlue} style={{ fontWeight: "700", marginBottom: 2 }}>
                      {item.title}
                    </Typography>
                  ) : null}
                  <Typography variant="small">{item.body}</Typography>
                </View>
                <Button
                  variant="secondary"
                  size="compact"
                  onPress={() => {
                    onInsertCanned(item.body);
                    setOpenDrawer(null);
                  }}
                >
                  Insert
                </Button>
              </View>
            )}
  showsVerticalScrollIndicator={false}/>
        </View>
      </Modal>

      <Modal visible={openDrawer === "ai"} animationType="slide" transparent onRequestClose={() => setOpenDrawer(null)}>
        <Pressable style={styles.backdrop} onPress={() => setOpenDrawer(null)} />
        <View style={styles.aiSheet}>
          <View style={styles.sheetHeader}>
            <Typography variant="label" style={{ fontWeight: "700", flex: 1 }}>
              {AGENT_COPILOT_TAB_LABEL}
            </Typography>
            <Pressable onPress={() => setOpenDrawer(null)}>
              <FontAwesome name="times" size={18} color={tokens.colors.textMuted} />
            </Pressable>
          </View>
          <AiAssistantDrawer
            messages={aiMessages}
            prompt={aiPrompt}
            onPromptChange={onAiPromptChange}
            onSendPrompt={onSendAiPrompt}
            onApplyToComposer={(text) => {
              onApplyAiToComposer(text);
              setOpenDrawer(null);
            }}
            busy={aiBusy}
            disabled={aiDisabled}
            websiteRequiredDisabled={websiteRequiredDisabled}
            hasConversation={hasConversation}
 />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    gap: tokens.space.sm,
    paddingTop: 4,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: tokens.colors.surface,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    padding: tokens.space.lg,
    maxHeight: "80%",
  },
  aiSheet: {
    backgroundColor: tokens.colors.surface,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    paddingTop: tokens.space.lg,
    paddingHorizontal: tokens.space.lg,
    height: "85%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: tokens.space.sm,
  },
  subTabRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: tokens.space.sm,
  },
  subTab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
  },
  subTabActive: {
    backgroundColor: tokens.colors.pillBg,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: tokens.colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 8,
    color: tokens.colors.textPrimary,
    marginBottom: tokens.space.sm,
  },
  cannedCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: tokens.space.sm,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    borderRadius: 8,
    padding: tokens.space.sm,
    marginBottom: tokens.space.sm,
  },
});
