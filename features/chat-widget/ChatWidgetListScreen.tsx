import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';

import type { AdminWidgetTableRow } from '@/api/types/widgets.types';
import {
  deleteWidget,
  listAdminWidgets,
  widgetResponseData,
} from '@/api/widgets/widgets.api';
import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import {
  EntityListCard,
  ListTableCard,
  PermissionDeniedPanel,
  SearchBar,
  TablePagination,
  Typography,
} from '@/components/ui';
import { WidgetPublishStatusChip } from '@/features/chat-widget/components/WidgetPublishStatusChip';
import { WidgetSandboxActionButton } from '@/features/chat-widget/components/WidgetSandboxActionButton';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import {
  mapAdminWidgetToTableRow,
  parseWidgetListData,
} from '@/lib/chat-widget/admin-widget-list-mapper';
import { OP } from '@/lib/permissions/operational-keys';
import { useChatApiGates } from '@/lib/permissions/use-chat-api-gates';
import { glassUi } from '@/lib/theme/glass-ui';
import { useThemeColors } from '@/lib/theme/use-theme-colors';
import { useAppTheme } from '@/theme';

/** Network parity: GET /widgets?page=1&limit=20 */
const PAGE_LIMIT = 20;

export type WidgetListSurface = 'all' | 'text' | 'chat';

function surfacesLabel(row: AdminWidgetTableRow): string {
  const parts: string[] = [];
  if (row.chatEnabled) parts.push('Chat');
  if (row.textUsEnabled) parts.push('Text Us');
  return parts.length ? parts.join(' · ') : '—';
}

/**
 * Widget Management list (Chat / Text Us / all).
 * On load: GET /widgets?page=&limit=20
 * Text Us surface filters client-side to textUsEnabled rows (web parity).
 */
export function ChatWidgetListScreen({
  surface = 'all',
}: {
  surface?: WidgetListSurface;
}) {
  const theme = useAppTheme();
  const colors = useThemeColors();
  const accent = theme.app.dashboard.accentBlue;
  const router = useRouter();
  const { hasOperational, permissionsSyncing } = useAuth();
  const gates = useChatApiGates();
  const canEdit = hasOperational(OP.chatWidget.update);
  const canDelete = hasOperational(OP.chatWidget.delete);
  const canAccessTextUs =
    hasOperational(OP.phoneNumberSetup.view) ||
    hasOperational(OP.chatWidget.view) ||
    hasOperational(OP.chatWidget.update);
  const isTextUsSurface = surface === 'text';
  const isChatOnlySurface = surface === 'chat';
  const pageAllowed = isTextUsSurface
    ? canAccessTextUs || gates.widgetSettings
    : gates.widgetSettings;

  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AdminWidgetTableRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const reloadList = useCallback(() => {
    setRefreshKey((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!pageAllowed) return;
    let cancelled = false;
    void (async () => {
      setRefreshing(refreshKey > 0);
      if (refreshKey === 0) setLoading(true);
      try {
        const envelope = await listAdminWidgets({
          page,
          limit: PAGE_LIMIT,
        });
        if (cancelled) return;
        const parsed = parseWidgetListData(widgetResponseData(envelope));
        setRows(parsed.items.map(mapAdminWidgetToTableRow));
        setTotal(parsed.total);
        setTotalPages(parsed.totalPages);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(extractApiErrorMessage(err, 'Failed to load widgets'));
        setRows([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageAllowed, page, refreshKey]);

  useEffect(() => {
    setPage((p) => (p > totalPages ? totalPages : p));
  }, [totalPages]);

  const surfaceRows = useMemo(() => {
    if (isTextUsSurface) return rows.filter((r) => r.textUsEnabled);
    if (isChatOnlySurface) return rows.filter((r) => r.chatEnabled);
    return rows;
  }, [rows, isTextUsSurface, isChatOnlySurface]);

  const filteredRows = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return surfaceRows;
    return surfaceRows.filter((r) => {
      const hay = [
        r.resellerName,
        r.parentCompany,
        r.childCompany,
        r.websiteLabel,
        r.widgetTypeLabel,
        r.statusLabel,
        r.widgetKey,
        surfacesLabel(r),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [surfaceRows, searchInput]);

  const displayTotal =
    isTextUsSurface || isChatOnlySurface ? filteredRows.length : total;
  const displayTotalPages =
    isTextUsSurface || isChatOnlySurface
      ? Math.max(1, Math.ceil(displayTotal / PAGE_LIMIT) || 1)
      : totalPages;

  const confirmDelete = (row: AdminWidgetTableRow) => {
    const key = row.widgetKey.trim();
    if (!key || deletingKey) return;
    const label = row.websiteLabel || key;
    Alert.alert(
      'Delete widget',
      `Delete widget for ${label}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setDeletingKey(key);
              try {
                await deleteWidget(key);
                if (page !== 1 && filteredRows.length <= 1) {
                  setPage(1);
                }
                reloadList();
              } catch (err) {
                Alert.alert(
                  'Delete failed',
                  extractApiErrorMessage(err, 'Could not delete widget.'),
                );
              } finally {
                setDeletingKey(null);
              }
            })();
          },
        },
      ],
    );
  };

  const rangeStart = displayTotal === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const rangeEnd = Math.min(page * PAGE_LIMIT, displayTotal);

  if (permissionsSyncing) {
    return (
      <MobileScreen scroll={false} contentStyle={styles.center}>
        <Typography variant="medium" muted>
          Loading permissions…
        </Typography>
      </MobileScreen>
    );
  }

  if (!pageAllowed) {
    return (
      <MobileScreen scroll={false} contentStyle={styles.center}>
        <PermissionDeniedPanel
          title={
            isTextUsSurface
              ? 'Text Us not available'
              : 'Chat widgets not available'
          }
          description="Requires chat-widget or Text Us permissions."
        />
      </MobileScreen>
    );
  }

  const introSubtitle = isTextUsSurface
    ? 'Design and manage Text Us widgets, then install the embed script on your websites.'
    : 'Manage chat widgets, create installs, and copy embed code for your websites.';
  const addLabel = isTextUsSurface ? 'Add Text Us' : 'Add Widget';
  const addHint = isTextUsSurface
    ? 'Create a Text Us install for your website'
    : 'Create a chat install for your website';
  const addHref = isTextUsSurface
    ? '/(dashboard)/chat-widget/add?prefer=text'
    : '/(dashboard)/chat-widget/add';
  const listIcon = isTextUsSurface
    ? 'cash-outline'
    : 'chatbubble-ellipses-outline';

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={reloadList}
            tintColor={accent}
          />
        }
      >
        <DashboardPageIntro subtitle={introSubtitle}>
          {canEdit ? (
            <Pressable
              onPress={() => router.push(addHref as Href)}
              accessibilityRole="button"
              accessibilityLabel={addLabel}
              style={({ pressed }) => [
                styles.addCta,
                {
                  borderColor: theme.app.dashboard.cardBorder,
                  backgroundColor: theme.app.dashboard.overlayLight,
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                },
              ]}
            >
              <View
                style={[styles.addCtaGlow, { backgroundColor: `${accent}18` }]}
              />
              <View
                style={[
                  styles.addCtaIcon,
                  { backgroundColor: accent, borderColor: `${accent}66` },
                ]}
              >
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </View>
              <View style={styles.addCtaCopy}>
                <Typography variant="medium16" style={{ fontWeight: '700' }}>
                  {addLabel}
                </Typography>
                <Typography variant="small" muted numberOfLines={2}>
                  {addHint}
                </Typography>
              </View>
              <View
                style={[
                  styles.addCtaChevron,
                  {
                    backgroundColor: `${accent}22`,
                    borderColor: glassUi.border.subtle,
                  },
                ]}
              >
                <Ionicons name="arrow-forward" size={16} color={accent} />
              </View>
            </Pressable>
          ) : null}
        </DashboardPageIntro>

        <ListTableCard
          title="All Widgets"
          subtitle="Reseller · company · website · status"
          icon={listIcon}
          toolbar={
            <View style={styles.searchWrap}>
              <SearchBar
                value={searchInput}
                onChange={setSearchInput}
                placeholder="Search anything..."
                style={styles.searchBar}
              />
            </View>
          }
        >
          {loading && !rows.length ? (
            <ActivityIndicator color={accent} style={{ marginVertical: 24 }} />
          ) : error ? (
            <Typography variant="medium" color={theme.app.danger}>
              {error}
            </Typography>
          ) : filteredRows.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={36} color={colors.textMuted} />
              <Typography variant="medium16" style={{ fontWeight: '600' }}>
                No records yet
              </Typography>
              <Typography variant="small" muted style={{ textAlign: 'center' }}>
                There is no data available for the current filter.
              </Typography>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {filteredRows.map((row) => (
                <View key={row.widgetKey} style={{ gap: 8 }}>
                  <EntityListCard
                    title={row.websiteLabel || row.widgetKey}
                    details={[
                      { label: 'Reseller', value: row.resellerName || '—' },
                      {
                        label: 'Parent Company',
                        value: row.parentCompany || '—',
                      },
                      {
                        label: 'Child Company',
                        value: row.childCompany || '—',
                      },
                      { label: 'Website', value: row.websiteLabel || '—' },
                      {
                        label: 'Widget Type',
                        value: row.widgetTypeLabel || '—',
                      },
                      { label: 'Surfaces', value: surfacesLabel(row) },
                      { label: 'Status', value: row.statusLabel || '—' },
                    ]}
                    badge={
                      <WidgetPublishStatusChip
                        label={row.statusLabel}
                        isLive={row.statusLabel
                          .toLowerCase()
                          .startsWith('live')}
                      />
                    }
                    onPress={() =>
                      router.push(
                        `/(dashboard)/chat-widget/${encodeURIComponent(row.widgetKey)}` as Href,
                      )
                    }
                  />
                  <View style={styles.cardActions}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="View widget details"
                      hitSlop={8}
                      onPress={() =>
                        router.push(
                          `/(dashboard)/chat-widget/${encodeURIComponent(row.widgetKey)}` as Href,
                        )
                      }
                      style={({ pressed }) => [
                        styles.entityActionBtn,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <Ionicons name="eye-outline" size={18} color={accent} />
                    </Pressable>
                    <WidgetSandboxActionButton widgetKey={row.widgetKey} />
                    {canEdit ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Edit widget"
                        hitSlop={8}
                        onPress={() =>
                          router.push(
                            `/(dashboard)/chat-widget/${encodeURIComponent(row.widgetKey)}/edit` as Href,
                          )
                        }
                        style={({ pressed }) => [
                          styles.entityActionBtn,
                          { opacity: pressed ? 0.7 : 1 },
                        ]}
                      >
                        <Ionicons
                          name="create-outline"
                          size={18}
                          color={
                            colors.isLight
                              ? colors.accentPurple
                              : '#E9D5FF'
                          }
                        />
                      </Pressable>
                    ) : null}
                    {canDelete ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Delete widget"
                        hitSlop={8}
                        disabled={deletingKey === row.widgetKey}
                        onPress={() => confirmDelete(row)}
                        style={({ pressed }) => [
                          styles.entityActionBtn,
                          {
                            opacity:
                              deletingKey === row.widgetKey || pressed
                                ? 0.7
                                : 1,
                          },
                        ]}
                      >
                        {deletingKey === row.widgetKey ? (
                          <ActivityIndicator
                            size="small"
                            color={
                              colors.isLight
                                ? colors.accentRed
                                : '#FCA5A5'
                            }
                          />
                        ) : (
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color={
                              colors.isLight
                                ? colors.accentRed
                                : '#FCA5A5'
                            }
                          />
                        )}
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.footer}>
            <Typography variant="small" muted>
              Showing data {rangeStart} to {rangeEnd} of {displayTotal} entries
            </Typography>
            <TablePagination
              page={page}
              pageCount={displayTotalPages}
              onPageChange={setPage}
            />
          </View>
        </ListTableCard>
      </ScrollView>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
  scroll: { paddingBottom: 32 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  addCta: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  addCtaGlow: {
    position: 'absolute',
    top: -24,
    right: -16,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  addCtaIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  addCtaCopy: { flex: 1, minWidth: 0, gap: 2 },
  addCtaChevron: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  searchWrap: {
    width: '100%',
    alignSelf: 'stretch',
  },
  searchBar: {
    width: '100%',
    alignSelf: 'stretch',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 4,
  },
  entityActionBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 14,
    gap: 10,
  },
});
