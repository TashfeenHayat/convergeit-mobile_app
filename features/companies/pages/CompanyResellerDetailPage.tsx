import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';

import { MobileScreen } from '@/components/layout';
import {
  AppCard,
  Button,
  Typography,
} from '@/components/ui';
import { listCompanies } from '@/api/companies';
import type {
  CompaniesData,
  PaginatedCompaniesTreeData,
} from '@/api/types/companies.types';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import { companiesKeys } from '@/lib/hooks/query/companies/keys';
import { canCompaniesModuleAction } from '@/lib/permissions';
import { hexAlpha, useThemeColors } from '@/lib/theme/use-theme-colors';
import { useAppTheme } from '@/theme';

type ParentCard = {
  id: string;
  name: string;
  childCount: number;
};

function isTreeData(data: CompaniesData | undefined): data is PaginatedCompaniesTreeData {
  return Boolean(data && 'view' in data && data.view === 'tree');
}

function parentsFromPayload(
  data: CompaniesData | undefined,
  resellerId: string,
): { resellerName: string; parents: ParentCard[] } {
  if (!data) return { resellerName: '', parents: [] };

  if (isTreeData(data)) {
    const match =
      data.items.find((item) => item.reseller?.id?.trim() === resellerId) ?? data.items[0];
    const parents = (match?.parentCompanies ?? [])
      .map((p) => ({
        id: p.id?.trim() || '',
        name: p.name?.trim() || '—',
        childCount: p.childCompanies?.length ?? 0,
      }))
      .filter((p) => p.id.length > 0);
    return {
      resellerName: match?.reseller?.name?.trim() || '',
      parents,
    };
  }

  const parents: ParentCard[] = [];
  for (const item of data.items ?? []) {
    if (item.companyType !== 'parent') continue;
    parents.push({
      id: item.id,
      name: item.name,
      childCount: 0,
    });
  }
  return {
    resellerName: data.items?.[0]?.parentCompany?.reseller?.name?.trim() || '',
    parents,
  };
}

function PillButton({
  label,
  tone,
  onPress,
}: {
  label: string;
  tone: 'neutral' | 'accent';
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const isAccent = tone === 'accent';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.pillBtn,
        {
          backgroundColor: isAccent
            ? colors.accentBlue
            : colors.isLight
              ? hexAlpha('#0F172A', 0.1)
              : hexAlpha('#000000', 0.55),
          borderColor: isAccent ? colors.accentBlue : colors.cardBorder,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <Typography variant="small" color="#FFFFFF" style={styles.pillLabel}>
        {label}
      </Typography>
    </Pressable>
  );
}

export function CompanyResellerDetailPage({
  resellerId,
  resellerName: resellerNameProp,
}: {
  resellerId: string;
  resellerName?: string;
}) {
  const theme = useAppTheme();
  const colors = useThemeColors();
  const router = useRouter();
  const { hasPage, hasOperational } = useAuth();
  const canEdit = canCompaniesModuleAction(hasPage, hasOperational, 'update');
  const canViewDetail = canCompaniesModuleAction(hasPage, hasOperational, 'detail');

  const rid = resellerId.trim();
  const listParams = useMemo(
    () => ({
      view: 'tree' as const,
      limit: 100,
      resellerId: rid,
    }),
    [rid],
  );
  const query = useQuery({
    queryKey: companiesKeys.byReseller(rid, listParams),
    queryFn: () => listCompanies(listParams),
    enabled: rid.length > 0,
  });

  const payload = query.data?.data as CompaniesData | undefined;
  const parsed = useMemo(() => parentsFromPayload(payload, rid), [payload, rid]);
  const resellerName = resellerNameProp?.trim() || parsed.resellerName || 'Reseller';
  const parents = parsed.parents;
  const parentCount = parents.length;

  const openParentDetail = (parentId: string) => {
    router.push(`/companies/parent/${parentId}/detail` as Href);
  };

  const openParentEdit = (parentId: string) => {
    router.push(`/companies/${parentId}/edit?section=parent` as Href);
  };

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isLoading}
            onRefresh={() => void query.refetch()}
            tintColor={colors.accentBlue}
          />
        }
      >
        <Pressable
          onPress={() => router.push('/companies' as Href)}
          accessibilityRole="button"
          accessibilityLabel="All companies"
          style={({ pressed }) => [
            styles.backBtn,
            {
              backgroundColor: colors.isLight
                ? hexAlpha('#0F172A', 0.08)
                : hexAlpha('#000000', 0.55),
              borderColor: colors.cardBorder,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Ionicons name="arrow-back" size={16} color={colors.textPrimary} />
          <Typography variant="small" color={colors.textPrimary} style={styles.backLabel}>
            All companies
          </Typography>
        </Pressable>

        <View style={styles.intro}>
          <Typography variant="small" color={colors.textMuted} style={styles.eyebrow}>
            RESELLER · OVERVIEW
          </Typography>
          <Typography variant="boldLarge" color={colors.textPrimary} numberOfLines={2}>
            {resellerName}
          </Typography>
          <Typography variant="medium" muted>
            {parentCount} parent compan{parentCount === 1 ? 'y' : 'ies'} linked under this client.
          </Typography>
        </View>

        {query.isLoading && !payload ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accentBlue} />
            <Typography variant="small" muted>
              Loading overview…
            </Typography>
          </View>
        ) : query.isError ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(query.error, 'Could not load reseller overview.')}
            </Typography>
            <Button size="compact" variant="outlined" onPress={() => void query.refetch()}>
              Retry
            </Button>
          </AppCard>
        ) : parents.length === 0 ? (
          <AppCard style={styles.empty}>
            <Typography variant="medium16" style={{ fontWeight: '700' }}>
              No parent companies
            </Typography>
            <Typography variant="small" muted style={{ textAlign: 'center' }}>
              This reseller has no parent companies linked yet.
            </Typography>
          </AppCard>
        ) : (
          <View style={styles.grid}>
            {parents.map((parent) => (
              <View
                key={parent.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.isLight
                      ? hexAlpha('#FFFFFF', 0.92)
                      : hexAlpha(colors.surfaceElevated || colors.surface || '#1E293B', 0.72),
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Typography
                  variant="medium16"
                  color={colors.textPrimary}
                  style={styles.cardTitle}
                  numberOfLines={2}
                >
                  {parent.name}
                </Typography>
                <Typography variant="small" color={colors.textMuted}>
                  {parent.childCount} child compan
                  {parent.childCount === 1 ? 'y' : 'ies'}
                </Typography>
                <View style={styles.cardActions}>
                  {canViewDetail ? (
                    <PillButton
                      label="Detail"
                      tone="neutral"
                      onPress={() => openParentDetail(parent.id)}
 />
                  ) : null}
                  {canEdit ? (
                    <PillButton
                      label="Edit"
                      tone="accent"
                      onPress={() => openParentEdit(parent.id)}
 />
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 8 },
  scroll: { paddingBottom: 32, paddingTop: 4 },
  backBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  backLabel: {
    fontWeight: '600',
  },
  intro: {
    gap: 6,
  },
  eyebrow: {
    fontWeight: '700',
    letterSpacing: 0.8,
    fontSize: 11,
  },
  centered: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: '48%',
    minWidth: '46%',
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    padding: 14,
    gap: 8,
  },
  cardTitle: {
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  pillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillLabel: {
    fontWeight: '700',
    fontSize: 12,
  },
});
