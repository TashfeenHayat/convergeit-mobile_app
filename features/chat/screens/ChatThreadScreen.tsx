import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { AppCard, Button, Typography } from '@/components/ui';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAppTheme } from '@/theme';
import {
  closeConversation,
  getConversationHistory,
  getInboxRowLabels,
  sendAgentMessage,
  type ChatMessage,
} from '@/services/chat';
import { SafeAreaView } from 'react-native-safe-area-context';

function normalizeMessages(raw: ChatMessage[]): ChatMessage[] {
  return [...raw].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ta - tb;
  });
}

function formatMsgTime(value?: string): string {
  if (!value?.trim()) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatThreadScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const conversationId = String(params.conversationId ?? '').trim();
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const historyQuery = useQuery({
    queryKey: ['chat', 'history', conversationId],
    queryFn: () => getConversationHistory(conversationId),
    enabled: Boolean(conversationId),
    refetchInterval: 8_000,
  });

  const messages = useMemo(
    () => normalizeMessages(historyQuery.data?.messages ?? []),
    [historyQuery.data?.messages],
  );

  const title = useMemo(() => {
    const history = historyQuery.data as Record<string, unknown> | undefined;
    return getInboxRowLabels({
      id: conversationId,
      visitorPresentation: history?.visitorPresentation as never,
      visitor: historyQuery.data?.visitor,
    }).title;
  }, [conversationId, historyQuery.data]);

  useEffect(() => {
    if (messages.length === 0) return;
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: (message: string) => sendAgentMessage(conversationId, { message }),
    onSuccess: async () => {
      setDraft('');
      await historyQuery.refetch();
      void qc.invalidateQueries({ queryKey: ['chat', 'agent-inbox'] });
    },
    onError: (err) => {
      Alert.alert('Send failed', extractApiErrorMessage(err));
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => closeConversation(conversationId),
    onSuccess: async () => {
      void qc.invalidateQueries({ queryKey: ['chat', 'agent-inbox'] });
      Alert.alert('Closed', 'Conversation closed.');
      router.back();
    },
    onError: (err) => {
      Alert.alert('Close failed', extractApiErrorMessage(err));
    },
  });

  const onSend = useCallback(() => {
    const message = draft.trim();
    if (!message || sendMutation.isPending) return;
    sendMutation.mutate(message);
  }, [draft, sendMutation]);

  if (!conversationId) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.app.background.bottom }]}>
        <AppCard style={{ margin: 16 }}>
          <Typography variant="medium">Missing conversation.</Typography>
          <Button onPress={() => router.back()}>Back</Button>
        </AppCard>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.app.background.bottom }]}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View
          style={[
            styles.topBar,
            {
              borderBottomColor: theme.app.dashboard.shellBorder,
              backgroundColor: theme.app.dashboard.headerBg,
            },
          ]}
        >
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <FontAwesome name="chevron-left" size={16} color={theme.app.text.primary} />
          </Pressable>
          <View style={styles.flex}>
            <Typography variant="medium16" numberOfLines={1}>
              {title}
            </Typography>
            <Typography variant="small" muted numberOfLines={1}>
              {conversationId.slice(0, 8)}…
            </Typography>
          </View>
          <Button
            size="compact"
            variant="danger"
            loading={closeMutation.isPending}
            onPress={() =>
              Alert.alert('Close chat?', 'Visitor will see this conversation as closed.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Close', style: 'destructive', onPress: () => closeMutation.mutate() },
              ])
            }
          >
            Close
          </Button>
        </View>

        {historyQuery.isLoading && messages.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.app.dashboard.accentBlue} />
          </View>
        ) : historyQuery.isError && messages.length === 0 ? (
          <AppCard style={{ margin: 16 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(historyQuery.error, 'Could not load messages.')}
            </Typography>
            <Button variant="outlined" onPress={() => void historyQuery.refetch()}>
              Retry
            </Button>
          </AppCard>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item, index) => item.id || `${item.createdAt}-${index}`}
            contentContainerStyle={[styles.messages, { gap: theme.spacing.sm }]}
            renderItem={({ item }) => {
              const isAgent = item.role === 'agent';
              const isSystem = item.role === 'system' || item.role === 'ai';
              return (
                <View
                  style={[
                    styles.bubbleWrap,
                    isAgent ? styles.bubbleRight : styles.bubbleLeft,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      {
                        backgroundColor: isAgent
                          ? theme.app.dashboard.accentBlue
                          : isSystem
                            ? theme.app.dashboard.surfaceElevated
                            : theme.app.dashboard.surface,
                        borderColor: theme.app.dashboard.cardBorder,
                      },
                    ]}
                  >
                    {!isAgent ? (
                      <Typography variant="small" muted>
                        {item.senderName || item.role}
                      </Typography>
                    ) : null}
                    <Typography variant="medium">{item.content}</Typography>
                    <Typography variant="small" muted style={styles.time}>
                      {formatMsgTime(item.createdAt)}
                    </Typography>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <Typography variant="medium" muted style={styles.empty}>
                No messages yet.
              </Typography>
            }
           showsVerticalScrollIndicator={false}/>
        )}

        <View
          style={[
            styles.composer,
            {
              borderTopColor: theme.app.dashboard.shellBorder,
              backgroundColor: theme.app.dashboard.headerBg,
            },
          ]}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a reply…"
            placeholderTextColor={theme.app.text.placeholder}
            multiline
            style={[
              styles.input,
              {
                color: theme.app.text.primary,
                borderColor: theme.app.border.input,
                backgroundColor: theme.app.dashboard.surface,
              },
            ]}
          />
          <Pressable
            accessibilityRole="button"
            disabled={!draft.trim() || sendMutation.isPending}
            onPress={onSend}
            style={[
              styles.sendBtn,
              {
                backgroundColor: theme.app.dashboard.accentBlue,
                opacity: !draft.trim() || sendMutation.isPending ? 0.45 : 1,
              },
            ]}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <FontAwesome name="send" size={16} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messages: { padding: 16, paddingBottom: 24 },
  empty: { textAlign: 'center', marginTop: 40 },
  bubbleWrap: { maxWidth: '86%' },
  bubbleLeft: { alignSelf: 'flex-start' },
  bubbleRight: { alignSelf: 'flex-end' },
  bubble: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  time: { alignSelf: 'flex-end' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
