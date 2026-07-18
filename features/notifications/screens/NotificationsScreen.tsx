import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { MobileScreen } from '@/components/layout';
import { AppCard, Button, SegmentedControl, Typography } from '@/components/ui';
import { webHrefToMobile } from '@/constants/navigation';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAppTheme } from '@/theme';
import {
  fetchMyNotificationsRest,
  markAllNotificationsReadRest,
  markNotificationReadRest,
  type MobileNotification,
} from '../api';

type Filter = 'all' | 'unread';

function formatWhen(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NotificationsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');

  const query = useQuery({
    queryKey: ['notifications', 'me', filter],
    queryFn: () => fetchMyNotificationsRest({ unreadOnly: filter === 'unread' }),
    staleTime: 20_000,
  });

  useFocusEffect(
    useCallback(() => {
      void query.refetch();
    }, [query]),
  );

  const items = useMemo(() => query.data ?? [], [query.data]);

  const markAll = useMutation({
    mutationFn: markAllNotificationsReadRest,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err) => Alert.alert('Failed', extractApiErrorMessage(err)),
  });

  const markOne = useMutation({
    mutationFn: (id: string) => markNotificationReadRest(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const openItem = (item: MobileNotification) => {
    if (!item.readAt) markOne.mutate(item.id);
    if (item.href?.startsWith('/dashboard')) {
      router.push(webHrefToMobile(item.href) as Href);
    }
  };

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <View style={[styles.header, { gap: theme.spacing.sm }]}>
        <Typography variant="boldLarge">Notifications</Typography>
        <SegmentedControl
          options={[
            { label: 'All', value: 'all' },
            { label: 'Unread', value: 'unread' },
          ]}
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
        />
        <Button
          variant="outlined"
          fullWidth
          loading={markAll.isPending}
          onPress={() => markAll.mutate()}
        >
          Mark all read
        </Button>
      </View>

      {query.isLoading && !query.data ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.app.dashboard.accentBlue} />
        </View>
      ) : query.isError ? (
        <AppCard style={{ marginHorizontal: theme.spacing.screen }}>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(query.error, 'Could not load notifications.')}
          </Typography>
        </AppCard>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.screen,
            gap: theme.spacing.sm,
            paddingBottom: 24,
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isLoading}
              onRefresh={() => void query.refetch()}
              tintColor={theme.app.dashboard.accentBlue}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Typography variant="medium16" style={{ fontWeight: '600' }}>
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </Typography>
              <Typography variant="small" muted style={{ textAlign: 'center' }}>
                {filter === 'unread'
                  ? 'You are all caught up.'
                  : 'New alerts from chat and HRMS will appear here.'}
              </Typography>
            </View>
          }
          renderItem={({ item }) => {
            const unread = !item.readAt;
            return (
              <Pressable
                onPress={() => openItem(item)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: unread
                      ? 'rgba(88, 101, 242, 0.1)'
                      : 'rgba(26, 28, 36, 0.55)',
                    borderColor: unread
                      ? theme.app.dashboard.accentBlue
                      : theme.app.dashboard.cardBorder,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <View style={styles.rowBody}>
                  <Typography variant="medium16" style={{ fontWeight: unread ? '700' : '600' }}>
                    {item.title}
                  </Typography>
                  {item.body ? (
                    <Typography variant="medium" muted numberOfLines={3}>
                      {item.body}
                    </Typography>
                  ) : null}
                  <Typography variant="small" muted>
                    {formatWhen(item.createdAt)}
                    {item.badgeGroup ? ` · ${item.badgeGroup}` : ''}
                  </Typography>
                </View>
                {unread ? (
                  <View
                    style={[styles.dot, { backgroundColor: theme.app.dashboard.accentBlue }]}
                  />
                ) : null}
              </Pressable>
            );
          }}
        />
      )}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
  header: { paddingHorizontal: 16, marginBottom: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
    marginTop: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  rowBody: { flex: 1, gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
