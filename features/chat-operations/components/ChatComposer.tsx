import { Pressable, StyleSheet, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { LiquidGlass, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { AgentAiAction } from "@/api/ai/agent-suggest.api";
import type { AiChatMessage } from "../types/ai-chat";
import { ComposerDrawerTabs } from "./ComposerDrawerTabs";

const MESSENGER_BLUE = "#0084FF";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onTyping: (draft?: string) => void;
  onStopTyping: () => void;
  disabled?: boolean;
  onInsertCanned: (text: string) => void;
  websiteId?: string | null;
  aiMessages: AiChatMessage[];
  aiPrompt: string;
  onAiPromptChange: (value: string) => void;
  onSendAiPrompt: (prompt: string, action?: AgentAiAction) => void;
  onApplyAiToComposer: (text: string) => void;
  aiBusy: boolean;
  websiteRequiredDisabled?: boolean;
  hasConversation: boolean;
  agentInboxEnabled?: boolean;
  copilotEnabled?: boolean;
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  onTyping,
  onStopTyping,
  disabled = false,
  onInsertCanned,
  websiteId = null,
  aiMessages,
  aiPrompt,
  onAiPromptChange,
  onSendAiPrompt,
  onApplyAiToComposer,
  aiBusy,
  websiteRequiredDisabled = false,
  hasConversation,
  agentInboxEnabled = true,
  copilotEnabled = true,
}: ChatComposerProps) {
  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend();
    onStopTyping();
  };

  if (!hasConversation) {
    return (
      <View style={styles.idleBar}>
        <Typography variant="small" muted>
          Select a conversation from the inbox to reply
        </Typography>
      </View>
    );
  }

  if (disabled) {
    return (
      <View style={styles.idleBar}>
        <Typography variant="small" muted>
          Read-only transcript — new visitor messages may reopen this chat
        </Typography>
      </View>
    );
  }

  const canSend = Boolean(value.trim());

  return (
    <View style={styles.wrap}>
      <View style={styles.inner}>
        <View style={styles.row}>
          <LiquidGlass intensity="subtle" radius={24} style={{ flex: 1 }} contentStyle={styles.inputShell}>
            <TextInput
              value={value}
              onChangeText={(next) => {
                onChange(next);
                onTyping(next);
              }}
              placeholder="Aa"
              placeholderTextColor={tokens.colors.textPlaceholder}
              style={styles.input}
              multiline
              onSubmitEditing={handleSend}
            />
          </LiquidGlass>
          <Pressable
            disabled={!canSend}
            onPress={handleSend}
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            accessibilityLabel="Send message"
          >
            <FontAwesome name="send" size={16} color="#fff" />
          </Pressable>
        </View>

        <ComposerDrawerTabs
          onInsertCanned={onInsertCanned}
          websiteId={websiteId}
          aiMessages={aiMessages}
          aiPrompt={aiPrompt}
          onAiPromptChange={onAiPromptChange}
          onSendAiPrompt={onSendAiPrompt}
          onApplyAiToComposer={onApplyAiToComposer}
          aiBusy={aiBusy}
          aiDisabled={disabled}
          websiteRequiredDisabled={websiteRequiredDisabled}
          hasConversation={hasConversation}
          agentInboxEnabled={agentInboxEnabled}
          copilotEnabled={copilotEnabled}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  idleBar: {
    paddingVertical: tokens.space.md,
    paddingHorizontal: tokens.space.lg,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  wrap: {
    backgroundColor: "rgba(8, 10, 20, 0.55)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  inner: {
    padding: tokens.space.md,
    gap: tokens.space.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  inputShell: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  input: {
    minHeight: 24,
    maxHeight: 110,
    color: tokens.colors.textPrimary,
    fontSize: 16,
    padding: 0,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: MESSENGER_BLUE,
  },
  sendBtnDisabled: {
    opacity: 0.35,
  },
});
