import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';

import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import {
  AppCard,
  Button,
  FormModal,
  ListTableCard,
  MetricCard,
  SearchBar,
  SelectField,
  TablePagination,
  Typography,
} from '@/components/ui';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useUsersListQuery } from '@/lib/hooks/query/users';
import { glassUi } from '@/lib/theme/glass-ui';
import { extractUsersRows } from '@/lib/users/user-list-rows';
import { useAppTheme } from '@/theme';

const PAGE_SIZE = 20;

type PermUserRow = {
  id: string;
  name: string;
  email: string;
  reseller: string;
  parentCompany: string;
};

export function UserPermissionsPage() {
  const theme = useAppTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pickOpen, setPickOpen] = useState(false);
  const [pickUserId, setPickUserId] = useState('');

  const query = useUsersListQuery({ all: true });

  const allRows = useMemo<PermUserRow[]>(() => {
    return extractUsersRows(query.data)
      .filter((u) => u.id.trim().length > 0)
      .map((u) => ({
        id: u.id,
        name: u.user || '—',
        email: u.email || '—',
        reseller: u.reseller || '—',
        parentCompany: u.parentCompany || '—',
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [query.data]);

  const userOptions = useMemo(
    () =>
      allRows.map((u) => ({
        value: u.id,
        label: `${u.name} — ${u.email}`,
      })),
    [allRows],
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allRows;
    const includes = (v: string) => v.toLowerCase().includes(q);
    return allRows.filter(
      (u) =>
        includes(u.name) ||
        (u.email !== '—' && includes(u.email)) ||
        (u.reseller !== '—' && includes(u.reseller)) ||
        (u.parentCompany !== '—' && includes(u.parentCompany)),
    );
  }, [allRows, search]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount);
  const rows = useMemo(() => {
    const start = (clampedPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [clampedPage, filteredRows]);

  const openUserPermissions = (id: string) => {
    router.push(`/user-page/permissions/${encodeURIComponent(id)}` as Href);
  };

  const accent = theme.app.dashboard.accentBlue;

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isLoading}
            onRefresh={() => void query.refetch()}
            tintColor={accent}
          />
        }
      >
        <DashboardPageIntro subtitle="Select a user to open their permissions page.">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by name or email…"
          />

          <Pressable
            onPress={() => {
              setPickUserId('');
              setPickOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Add permissions"
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
            <View style={[styles.addCtaGlow, { backgroundColor: `${accent}18` }]} />
            <View
              style={[
                styles.addCtaIcon,
                {
                  backgroundColor: accent,
                  borderColor: `${accent}66`,
                },
              ]}
            >
              <Ionicons name="key-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.addCtaCopy}>
              <Typography variant="medium16" style={{ fontWeight: '700' }}>
                Add permissions
              </Typography>
              <Typography variant="small" muted numberOfLines={2}>
                Pick a user, then open their permissions page
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
        </DashboardPageIntro>

        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <MetricCard
              title="Users"
              value={String(allRows.length)}
              subtitle="Directory"
              showTrendArrow={false}
              valueColor={accent}
              iconBgColor={`${accent}28`}
              icon={<Ionicons name="people-outline" size={20} color={accent} />}
            />
          </View>
          <View style={styles.statCell}>
            <MetricCard
              title="Filtered"
              value={String(filteredRows.length)}
              subtitle={search.trim() ? 'Matching' : 'Showing all'}
              showTrendArrow={false}
              valueColor={accent}
              iconBgColor={`${accent}28`}
              icon={<Ionicons name="funnel-outline" size={20} color={accent} />}
            />
          </View>
        </View>

        {query.isError ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(query.error, 'Could not load users.')}
            </Typography>
            <Button size="compact" variant="outlined" onPress={() => void query.refetch()}>
              Retry
            </Button>
          </AppCard>
        ) : (
          <ListTableCard
            title="Users"
            subtitle={`${filteredRows.length} result${filteredRows.length === 1 ? '' : 's'}`}
            icon="key-outline"
            toolbar={null}
            footer={
              pageCount > 1 ? (
                <TablePagination
                  page={clampedPage}
                  pageCount={pageCount}
                  onPageChange={setPage}
                />
              ) : undefined
            }
          >
            {query.isLoading && !query.data ? (
              <View style={styles.centered}>
                <ActivityIndicator color={accent} />
                <Typography variant="small" muted>
                  Loading users…
                </Typography>
              </View>
            ) : rows.length === 0 ? (
              <View style={styles.empty}>
                <View
                  style={[
                    styles.emptyIcon,
                    {
                      backgroundColor: `${accent}22`,
                      borderColor: glassUi.border.subtle,
                    },
                  ]}
                >
                  <Ionicons name="key-outline" size={28} color={accent} />
                </View>
                <Typography variant="medium16" style={{ fontWeight: '700' }}>
                  No users found
                </Typography>
                <Typography variant="small" muted style={{ textAlign: 'center' }}>
                  {search.trim()
                    ? 'Try a different search.'
                    : 'Users will appear here once available.'}
                </Typography>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {rows.map((row) => (
                  <Pressable
                    key={row.id}
                    onPress={() => openUserPermissions(row.id)}
                    style={({ pressed }) => [
                      styles.rowCard,
                      {
                        backgroundColor: theme.app.dashboard.overlayLight,
                        borderColor: theme.app.dashboard.cardBorder,
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.rowIcon,
                        {
                          backgroundColor: `${accent}22`,
                          borderColor: glassUi.border.subtle,
                        },
                      ]}
                    >
                      <Ionicons name="person-outline" size={18} color={accent} />
                    </View>
                    <View style={styles.rowBody}>
                      <Typography variant="medium16" style={{ fontWeight: '700' }} numberOfLines={1}>
                        {row.name}
                      </Typography>
                      <Typography variant="small" muted numberOfLines={1}>
                        {row.email}
                      </Typography>
                      <Typography variant="small" muted numberOfLines={1}>
                        {[
                          row.reseller !== '—' ? row.reseller : null,
                          row.parentCompany !== '—' ? row.parentCompany : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </Typography>
                    </View>
                    <View
                      style={[
                        styles.iconBtn,
                        {
                          backgroundColor: `${accent}18`,
                          borderColor: glassUi.border.subtle,
                        },
                      ]}
                    >
                      <Ionicons name="chevron-forward" size={16} color={accent} />
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </ListTableCard>
        )}
      </ScrollView>

      <FormModal
        open={pickOpen}
        title="Select user"
        description="Choose whose permissions page to open."
        onClose={() => setPickOpen(false)}
        onSave={() => {
          const id = pickUserId.trim();
          if (!id) return;
          setPickOpen(false);
          openUserPermissions(id);
        }}
        primaryButtonLabel="Open permissions"
        primaryButtonDisabled={!pickUserId.trim()}
        cancelButtonLabel="Cancel"
      >
        <SelectField
          label="User"
          value={pickUserId}
          onChange={setPickUserId}
          options={userOptions}
          placeholder="Search by name or email…"
          searchPlaceholder="Search users…"
        />
      </FormModal>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 28 },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCell: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 140,
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
  addCtaCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  addCtaChevron: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  centered: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  empty: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
