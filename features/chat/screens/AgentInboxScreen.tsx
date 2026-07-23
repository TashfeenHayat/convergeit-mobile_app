import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import Ionicons from '@expo/vector-icons/Ionicons';

import { MobileScreen } from '@/components/layout';
import { AppCard, SegmentedControl, Typography } from '@/components/ui';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAppTheme } from '@/theme';
import { tokens } from '@/theme/tokens';
import {
  getMyActiveChats,
  getMyClosedChats,
  getWaitingChats,
  getInboxRowLabels,
  type ConversationSummary,
} from '@/services/chat';

type InboxTab = 'active' | 'waiting' | 'closed';

function conversationIdOf(item: ConversationSummary): string {
  return (item.conversationId || item.id || '').trim();
}

function formatRelativeTime(value?: string): string {
  if (!value?.trim()) return '';
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function AgentInboxScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [tab, setTab] = useState<InboxTab>('active');

  const inboxQuery = useQuery({
    queryKey: ['chat', 'agent-inbox', tab],
    queryFn: async () => {
      if (tab === 'waiting') return getWaitingChats();
      if (tab === 'closed') return getMyClosedChats();
      return getMyActiveChats();
    },
    staleTime: 15_000,
    refetchInterval: tab === 'closed' ? false : 20_000,
  });

  useFocusEffect(
    useCallback(() => {
      void inboxQuery.refetch();
    }, [inboxQuery]),
  );

  const items = useMemo(() => inboxQuery.data ?? [], [inboxQuery.data]);

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <View style={[styles.header, { gap: theme.spacing.sm }]}>
        <Typography variant="boldLarge">Chat Operations</Typography>
        <Typography variant="medium" muted>
          Active chats, waiting queue, and recent closed conversations.
        </Typography>
        <SegmentedControl
          options={[
            { label: 'Active', value: 'active' },
            { label: 'Waiting', value: 'waiting' },
            { label: 'Closed', value: 'closed' },
          ]}
          value={tab}
          onChange={(v) => setTab(v as InboxTab)}
 />
      </View>

      {inboxQuery.isLoading && !inboxQuery.data ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.app.dashboard.accentBlue} />
        </View>
      ) : inboxQuery.isError ? (
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(inboxQuery.error, 'Could not load inbox.')}
          </Typography>
        </AppCard>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => conversationIdOf(item) || `row-${index}`}
          contentContainerStyle={[
            styles.list,
            { gap: theme.spacing.sm },
            items.length === 0 && styles.emptyList,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={inboxQuery.isRefetching && !inboxQuery.isLoading}
              onRefresh={() => void inboxQuery.refetch()}
              tintColor={theme.app.dashboard.accentBlue}
          />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubbles-outline" size={26} color={tokens.colors.textMuted} />
              </View>
              <Typography variant="medium16" style={{ fontWeight: '600' }}>
                No {tab} conversations
              </Typography>
              <Typography variant="small" muted style={{ textAlign: 'center' }}>
                Pull to refresh — new chats will show up here when they arrive.
              </Typography>
            </View>
          }
          renderItem={({ item }) => {
            const id = conversationIdOf(item);
            const labels = getInboxRowLabels(item);
            const unread = typeof item.unreadCount === 'number' ? item.unreadCount : 0;
            return (
              <Pressable
                onPress={() => {
                  if (!id) return;
                  router.push(`/chat-operations/${encodeURIComponent(id)}` as Href);
                }}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: 'rgba(26, 28, 36, 0.55)',
                    borderColor: unread > 0
                      ? theme.app.dashboard.accentBlue
                      : theme.app.dashboard.cardBorder,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: 'rgba(88, 101, 242, 0.22)' },
                  ]}
                >
                  <Typography variant="medium16" style={{ fontWeight: '700' }}>
                    {labels.initials}
                  </Typography>
                </View>
                <View style={styles.rowBody}>
                  <View style={styles.rowTop}>
                    <Typography variant="medium16" numberOfLines={1} style={[styles.flex, { fontWeight: '600' }]}>
                      {labels.title}
                    </Typography>
                    <Typography variant="small" muted>
                      {formatRelativeTime(item.lastMessageAt)}
                    </Typography>
                  </View>
                  {labels.subtitle ? (
                    <Typography variant="small" muted numberOfLines={1}>
                      {labels.subtitle}
                    </Typography>
                  ) : null}
                </View>
                {unread > 0 ? (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: theme.app.dashboard.accentBlue },
                    ]}
                  >
                    <Typography variant="small" style={{ fontWeight: '700' }}>
                      {unread > 99 ? '99+' : String(unread)}
                    </Typography>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={14} color={tokens.colors.textMuted} />
                )}
              </Pressable>
            );
          }}
  showsVerticalScrollIndicator={false}/>
      )}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
  header: { marginBottom: 12 },
  list: { paddingBottom: 24 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
    marginTop: 24,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: tokens.colors.cardBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.pillBg,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
});
