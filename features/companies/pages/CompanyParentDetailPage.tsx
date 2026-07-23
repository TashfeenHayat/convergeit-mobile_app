import { useMemo, type ReactNode } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { MobileScreen } from '@/components/layout';
import {
  AppCard,
  Button,
  LoadingScreen,
  Typography,
} from '@/components/ui';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import { normalizePocsFromCarrier } from '@/lib/companies/parent-detail-pocs';
import { useParentCompanyQuery } from '@/lib/hooks/query/companies/hooks';
import { canCompaniesModuleAction } from '@/lib/permissions';
import { hexAlpha, useThemeColors } from '@/lib/theme/use-theme-colors';
import { useAppTheme } from '@/theme';

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function CompanyParentDetailPage({ parentId }: { parentId: string }) {
  const theme = useAppTheme();
  const colors = useThemeColors();
  const router = useRouter();
  const { hasPage, hasOperational } = useAuth();
  const canEdit = canCompaniesModuleAction(hasPage, hasOperational, 'update');

  const id = parentId.trim();
  const query = useParentCompanyQuery(id);
  const payload = query.data?.data;
  const parent = payload?.parentCompany;
  const children = payload?.children ?? [];
  const childCount = payload?.counts?.children ?? children.length;

  const parentContacts = useMemo(
    () => (parent ? normalizePocsFromCarrier(parent) : []),
    [parent],
  );

  const openEdit = () => {
    router.push(`/companies/${id}/edit?section=parent` as Href);
  };

  if (query.isLoading && !payload) {
    return <LoadingScreen message="Loading company…" />;
  }

  if (query.isError || !parent) {
    return (
      <MobileScreen>
        <AppCard style={{ gap: 12 }}>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(query.error, 'Could not load company.')}
          </Typography>
          <Button size="compact" variant="outlined" onPress={() => void query.refetch()}>
            Retry
          </Button>
        </AppCard>
      </MobileScreen>
    );
  }

  const resellerName = parent.reseller?.name?.trim() || '—';

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
        <View style={styles.topBar}>
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
            <Typography variant="small" color={colors.textPrimary} style={styles.backLabel}>
              ← All companies
            </Typography>
          </Pressable>

          {canEdit ? (
            <Pressable
              onPress={openEdit}
              accessibilityRole="button"
              accessibilityLabel="Edit"
              style={({ pressed }) => [
                styles.headerEditBtn,
                {
                  backgroundColor: colors.isLight
                    ? hexAlpha('#0F172A', 0.08)
                    : hexAlpha('#000000', 0.55),
                  borderColor: colors.cardBorder,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <Typography variant="small" color={colors.textPrimary} style={styles.backLabel}>
                Edit
              </Typography>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.intro}>
          <Typography variant="small" color={colors.textMuted} style={styles.eyebrow}>
            PARENT COMPANY · OVERVIEW
          </Typography>
          <Typography variant="boldLarge" color={colors.textPrimary} numberOfLines={2}>
            {parent.name}
          </Typography>
          <Typography variant="medium" muted>
            Client of reseller {resellerName}
          </Typography>
        </View>

        <View style={styles.body}>
          <View style={styles.mainCol}>
            <SectionCard title="Reseller">
              <Typography variant="medium16" color={colors.textPrimary} style={styles.valueText}>
                {resellerName}
              </Typography>
            </SectionCard>

            <SectionCard title="Primary contact">
              {parentContacts.length === 0 ? (
                <Typography variant="medium" muted>
                  No contact linked to this company yet.
                </Typography>
              ) : (
                parentContacts.map((c) => (
                  <View key={c.key} style={styles.contactBlock}>
                    <Typography
                      variant="medium16"
                      color={colors.textPrimary}
                      style={styles.valueText}
                    >
                      {c.name}
                    </Typography>
                    <Typography variant="small" muted numberOfLines={2}>
                      {[c.email !== '—' ? c.email : null, c.phone].filter(Boolean).join(' · ') ||
                        '—'}
                    </Typography>
                  </View>
                ))
              )}
            </SectionCard>

            <SectionCard title="Child companies">
              {children.length === 0 ? (
                <Typography variant="medium" muted>
                  No child companies yet.
                </Typography>
              ) : (
                children.map((child) => {
                  const childContacts = normalizePocsFromCarrier(child);
                  const email = String(child.email || child.companyEmail || '').trim();
                  const phone = String(child.phone || '').trim();
                  const address = String(child.address || '').trim();
                  const meta = [email || null, phone || null].filter(Boolean).join(' · ');
                  return (
                    <View key={child.id} style={styles.childBlock}>
                      <Typography
                        variant="medium16"
                        color={colors.textPrimary}
                        style={styles.valueText}
                      >
                        {child.name}
                      </Typography>
                      {meta ? (
                        <Typography variant="small" muted>
                          {meta}
                        </Typography>
                      ) : null}
                      {address ? (
                        <Typography variant="small" muted>
                          {address}
                        </Typography>
                      ) : null}
                      {childContacts.length > 0 ? (
                        <View style={styles.childContact}>
                          <Typography variant="small" color={colors.textMuted} style={styles.contactLabel}>
                            Contact
                          </Typography>
                          {childContacts.map((c) => (
                            <View key={c.key} style={{ gap: 2 }}>
                              <Typography
                                variant="medium"
                                color={colors.textPrimary}
                                style={{ fontWeight: '600' }}
                              >
                                {c.name}
                              </Typography>
                              <Typography variant="small" muted>
                                {c.email !== '—' ? c.email : '—'}
                              </Typography>
                            </View>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}
            </SectionCard>
          </View>

          <View
            style={[
              styles.snapshot,
              {
                backgroundColor: colors.isLight
                  ? hexAlpha('#FFFFFF', 0.92)
                  : hexAlpha(colors.surfaceElevated || colors.surface || '#1E293B', 0.72),
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Typography variant="medium16" color={colors.textPrimary} style={styles.snapshotTitle}>
              Snapshot
            </Typography>
            <Typography variant="boldLarge" color={colors.textPrimary}>
              {childCount}
            </Typography>
            <Typography variant="small" muted>
              Children
            </Typography>

            <View style={styles.snapshotMeta}>
              <Typography variant="small" muted>
                Parent updated
              </Typography>
              <Typography variant="small" color={colors.textPrimary}>
                {formatDateTime(parent.updatedAt)}
              </Typography>
            </View>
            <View style={styles.snapshotMeta}>
              <Typography variant="small" muted>
                Parent created
              </Typography>
              <Typography variant="small" color={colors.textPrimary}>
                {formatDateTime(parent.createdAt)}
              </Typography>
            </View>

            {canEdit ? (
              <Pressable
                onPress={openEdit}
                accessibilityRole="button"
                accessibilityLabel="Edit company"
                style={({ pressed }) => [
                  styles.editCompanyBtn,
                  {
                    backgroundColor: colors.accentBlue,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <Typography variant="medium" color="#FFFFFF" style={styles.editCompanyLabel}>
                  Edit company
                </Typography>
              </Pressable>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </MobileScreen>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: colors.isLight
            ? hexAlpha('#FFFFFF', 0.92)
            : hexAlpha(colors.surfaceElevated || colors.surface || '#1E293B', 0.55),
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <Typography variant="small" color={colors.textMuted} style={styles.sectionTitle}>
        {title}
      </Typography>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 8 },
  scroll: { paddingBottom: 32, paddingTop: 4 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  headerEditBtn: {
    paddingHorizontal: 14,
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
  body: {
    gap: 12,
  },
  mainCol: {
    gap: 12,
  },
  section: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    padding: 14,
    gap: 8,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  valueText: {
    fontWeight: '700',
  },
  contactBlock: {
    gap: 2,
  },
  childBlock: {
    gap: 4,
    paddingTop: 4,
  },
  childContact: {
    marginTop: 8,
    gap: 6,
  },
  contactLabel: {
    fontWeight: '700',
  },
  snapshot: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    padding: 16,
    gap: 6,
  },
  snapshotTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  snapshotMeta: {
    marginTop: 8,
    gap: 2,
  },
  editCompanyBtn: {
    marginTop: 14,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editCompanyLabel: {
    fontWeight: '700',
  },
});
