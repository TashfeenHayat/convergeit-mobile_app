import { useMemo, useState } from 'react';
import {
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
  DataCardGrid,
  EntityListCard,
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
import { pickApiTotal } from '@/lib/utils/admin-list';
import { useAppTheme } from '@/theme';

const PAGE_SIZE = 20;

type PermUserRow = {
  id: string;
  name: string;
  email: string;
  reseller: string;
  parentCompany: string;
};

function toPermRows(data: unknown): PermUserRow[] {
  return extractUsersRows(data)
    .filter((u) => u.id.trim().length > 0)
    .map((u) => ({
      id: u.id,
      name: u.user || '—',
      email: u.email || '—',
      reseller: u.reseller || '—',
      parentCompany: u.parentCompany || '—',
    }));
}

export function UserPermissionsPage() {
  const theme = useAppTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pickOpen, setPickOpen] = useState(false);
  const [pickUserId, setPickUserId] = useState('');

  const query = useUsersListQuery({
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
  });
  const pickQuery = useUsersListQuery({ all: true }, { enabled: pickOpen });

  const rows = useMemo(() => toPermRows(query.data), [query.data]);
  const total = pickApiTotal(query.data, rows.length);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const userOptions = useMemo(
    () =>
      toPermRows(pickQuery.data).map((u) => ({
        value: u.id,
        label: `${u.name} — ${u.email}`,
      })),
    [pickQuery.data],
  );

  const openUserPermissions = (id: string) => {
    router.push(`/user-page/permissions/${encodeURIComponent(id)}` as Href);
  };

  const accent = theme.app.dashboard.accentBlue;

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
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
              value={String(total)}
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
              value={String(total)}
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
            subtitle={`${total} result${total === 1 ? '' : 's'}`}
            icon="key-outline"
            toolbar={null}
          >
            <DataCardGrid
              columns={1}
              isLoading={query.isLoading && !query.data}
              empty={rows.length === 0}
              emptyState={{
                title: 'No users found',
                description: search.trim()
                  ? 'Try a different search.'
                  : 'Users will appear here once available.',
                icon: 'key-outline',
              }}
              showingLabel={
                rows.length > 0 ? `Showing ${from} to ${to} of ${total} entries` : undefined
              }
              footerRight={
                <TablePagination page={page} pageCount={pageCount} onPageChange={setPage} />
              }
            >
              {rows.map((row) => (
                <EntityListCard
                  key={row.id}
                  title={row.name}
                  subtitle={row.email}
                  details={[
                    { label: 'Reseller', value: row.reseller },
                    { label: 'Parent company', value: row.parentCompany },
                  ]}
                  onPress={() => openUserPermissions(row.id)}
                  onEditPress={() => openUserPermissions(row.id)}
 />
              ))}
            </DataCardGrid>
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
  screen: { flex: 1, paddingHorizontal: 8 },
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
});
