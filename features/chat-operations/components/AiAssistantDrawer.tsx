import { useEffect, useRef } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Button, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { AgentAiAction } from "@/api/ai/agent-suggest.api";
import { agentAiActionNeedsWebsite } from "@/lib/ai/agent-copilot-input";
import { AGENT_COPILOT_EMPTY_HINT, AGENT_COPILOT_SUBTITLE, AGENT_COPILOT_WEBSITE_REQUIRED } from "@/lib/ai/ai-role-copy";
import type { AiChatMessage } from "../types/ai-chat";

const QUICK_ACTIONS: Array<{ action: AgentAiAction; label: string }> = [
  { action: "knowledge_lookup", label: "KB lookup" },
  { action: "suggested_reply", label: "Suggest reply" },
  { action: "coach_reply", label: "Coach me" },
  { action: "summarize", label: "Summarize" },
  { action: "rewrite_tone", label: "Rewrite" },
];

const STARTER_PROMPTS = [
  "What does our KB say about this topic?",
  "How should I answer the visitor's last message?",
  "What policy applies here?",
];

const ACTION_LABELS: Partial<Record<AgentAiAction, string>> = {
  suggested_reply: "Suggest reply",
  summarize: "Summarize",
  rewrite_tone: "Rewrite",
  knowledge_lookup: "KB lookup",
  coach_reply: "Ask AI",
};

interface AiAssistantDrawerProps {
  messages: AiChatMessage[];
  prompt: string;
  onPromptChange: (value: string) => void;
  onSendPrompt: (prompt: string, action?: AgentAiAction) => void;
  onApplyToComposer?: (text: string) => void;
  busy: boolean;
  disabled?: boolean;
  websiteRequiredDisabled?: boolean;
  hasConversation: boolean;
}

export function AiAssistantDrawer({
  messages,
  prompt,
  onPromptChange,
  onSendPrompt,
  onApplyToComposer,
  busy,
  disabled = false,
  websiteRequiredDisabled = false,
  hasConversation,
}: AiAssistantDrawerProps) {
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, busy]);

  if (!hasConversation) {
    return (
      <Typography variant="small" muted style={{ paddingHorizontal: tokens.space.md, paddingVertical: tokens.space.md }}>
        Select a conversation to open Agent Copilot.
      </Typography>
    );
  }

  const sendFreeText = (text: string, action: AgentAiAction = "knowledge_lookup") => {
    const trimmed = text.trim();
    if (!trimmed || disabled || busy || websiteRequiredDisabled) return;
    onSendPrompt(trimmed, action);
  };

  return (
    <View style={styles.shell}>
      <Typography variant="small" muted style={{ paddingHorizontal: tokens.space.md, paddingTop: tokens.space.sm, lineHeight: 16 }}>
        {AGENT_COPILOT_SUBTITLE}
      </Typography>
      {websiteRequiredDisabled ? (
        <Typography variant="small" color={tokens.colors.accentOrange} style={{ paddingHorizontal: tokens.space.md, paddingTop: 4 }}>
          {AGENT_COPILOT_WEBSITE_REQUIRED}
        </Typography>
      ) : null}

      <ScrollView ref={scrollRef} style={styles.thread} contentContainerStyle={styles.threadContent}>
        {messages.length === 0 ? (
          <View style={{ paddingVertical: tokens.space.sm }}>
            <Typography variant="small" muted style={{ textAlign: "center", marginBottom: tokens.space.sm, lineHeight: 18 }}>
              {AGENT_COPILOT_EMPTY_HINT}
            </Typography>
            <Typography variant="small" muted style={{ marginBottom: 6 }}>
              Try asking:
            </Typography>
            <View style={{ gap: 6 }}>
              {STARTER_PROMPTS.map((example) => (
                <Pressable
                  key={example}
                  disabled={disabled || busy || websiteRequiredDisabled}
                  onPress={() => sendFreeText(example)}
                  style={styles.quickChip}
                >
                  <Typography variant="small">{example}</Typography>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          messages.map((msg) => (
            <View key={msg.id} style={[styles.msgWrap, msg.role === "user" ? { alignItems: "flex-end" } : { alignItems: "flex-start" }]}>
              {msg.role === "user" && msg.action ? (
                <Typography variant="small" muted style={{ fontSize: 10 }}>
                  {ACTION_LABELS[msg.action] ?? msg.action}
                </Typography>
              ) : null}
              <View style={[styles.bubble, msg.role === "user" ? styles.bubbleUser : styles.bubbleAssistant]}>
                {msg.pending ? <ActivityIndicator size="small" color={tokens.colors.textMuted} /> : <Typography variant="small">{msg.content}</Typography>}
              </View>
              {msg.role === "assistant" && !msg.pending && msg.sources && msg.sources.length > 0 ? (
                <Typography variant="small" muted style={{ fontSize: 10 }}>
                  Source: {msg.sources[0]}
                </Typography>
              ) : null}
              {msg.role === "assistant" && !msg.pending && onApplyToComposer ? (
                <Button variant="secondary" size="compact" onPress={() => onApplyToComposer(msg.content)}>
                  Insert into reply
                </Button>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.inputRow}>
          <TextInput
            value={prompt}
            onChangeText={onPromptChange}
            editable={!disabled && !busy && !websiteRequiredDisabled}
            placeholder="Ask the AI Assistant…"
            placeholderTextColor={tokens.colors.textPlaceholder}
            style={styles.input}
            multiline
          />
          <Pressable
            disabled={!prompt.trim() || disabled || busy || websiteRequiredDisabled}
            onPress={() => sendFreeText(prompt)}
            style={[styles.sendBtn, (!prompt.trim() || disabled || busy) && { opacity: 0.4 }]}
          >
            {busy ? <ActivityIndicator size="small" color="#fff" /> : <Typography variant="label" color="#fff">➤</Typography>}
          </Pressable>
        </View>
        <Typography variant="small" muted style={{ marginBottom: 6 }}>
          Quick actions:
        </Typography>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {QUICK_ACTIONS.map(({ action, label }) => {
            const actionDisabled = disabled || busy || (agentAiActionNeedsWebsite(action) && websiteRequiredDisabled);
            return (
              <Pressable
                key={action}
                disabled={actionDisabled}
                onPress={() => {
                  if (prompt.trim()) onSendPrompt(prompt.trim(), action);
                  else onSendPrompt(`Run ${label.toLowerCase()} for this conversation`, action);
                }}
                style={[styles.quickActionChip, actionDisabled && { opacity: 0.4 }]}
              >
                <Typography variant="small">{label}</Typography>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    minHeight: 320,
  },
  thread: {
    flex: 1,
  },
  threadContent: {
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    gap: 10,
  },
  quickChip: {
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  quickActionChip: {
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  msgWrap: {
    width: "100%",
    gap: 4,
  },
  bubble: {
    maxWidth: "88%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  bubbleUser: {
    backgroundColor: tokens.colors.pillBg,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    borderBottomLeftRadius: 4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: tokens.colors.cardBorder,
    padding: tokens.space.md,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: tokens.space.sm,
    marginBottom: tokens.space.sm,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: tokens.colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: tokens.colors.textPrimary,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.colors.accentBlue,
  },
});
