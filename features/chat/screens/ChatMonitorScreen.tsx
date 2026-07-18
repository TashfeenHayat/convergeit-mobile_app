import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { MobileScreen } from '@/components/layout';
import { AppCard, SegmentedControl, Typography } from '@/components/ui';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAppTheme } from '@/theme';
import {
  fetchMonitorClosed,
  fetchMonitorLive,
  getInboxRowLabels,
  type MonitorConversationRow,
} from '@/services/chat';

type MonitorTab = 'live' | 'closed';

function rowId(row: MonitorConversationRow): string {
  return (row.id || '').trim();
}

export function ChatMonitorScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [tab, setTab] = useState<MonitorTab>('live');

  const query = useQuery({
    queryKey: ['chat', 'monitor', tab],
    queryFn: () => (tab === 'closed' ? fetchMonitorClosed() : fetchMonitorLive()),
    refetchInterval: tab === 'live' ? 15_000 : false,
  });

  const items = useMemo(() => query.data ?? [], [query.data]);

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <View style={[styles.header, { gap: theme.spacing.sm }]}>
        <Typography variant="boldLarge">Chat Monitor</Typography>
        <Typography variant="medium" muted>
          Live and recently closed conversations in your monitor scope.
        </Typography>
        <SegmentedControl
          options={[
            { label: 'Live', value: 'live' },
            { label: 'Closed', value: 'closed' },
          ]}
          value={tab}
          onChange={(v) => setTab(v as MonitorTab)}
        />
      </View>

      {query.isLoading && !query.data ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.app.dashboard.accentBlue} />
        </View>
      ) : query.isError ? (
        <AppCard style={{ marginHorizontal: theme.spacing.screen }}>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(query.error, 'Could not load monitor.')}
          </Typography>
        </AppCard>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => rowId(item) || `m-${index}`}
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
            <AppCard>
              <Typography variant="medium" muted>
                No {tab} conversations in monitor scope.
              </Typography>
            </AppCard>
          }
          renderItem={({ item }) => {
            const id = rowId(item);
            const labels = getInboxRowLabels(item as never);
            return (
              <Pressable
                onPress={() => {
                  if (!id) return;
                  router.push(`/chat-monitor/${encodeURIComponent(id)}` as Href);
                }}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: theme.app.dashboard.surface,
                    borderColor: theme.app.dashboard.cardBorder,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <View style={styles.rowBody}>
                  <Typography variant="medium16" numberOfLines={1}>
                    {labels.title}
                  </Typography>
                  {labels.subtitle ? (
                    <Typography variant="small" muted numberOfLines={1}>
                      {labels.subtitle}
                    </Typography>
                  ) : null}
                </View>
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
  row: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  rowBody: { gap: 4 },
});
