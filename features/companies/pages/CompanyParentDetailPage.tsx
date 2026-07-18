import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';

import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import {
  AppCard,
  Button,
  DashboardCard,
  LoadingScreen,
  StatusChip,
  Typography,
} from '@/components/ui';
import { CompanyClientPermissionsPanel } from '@/features/companies/components/CompanyClientPermissionsPanel';
import { CompanyEditActionTiles } from '@/features/companies/pages/CompanyEditPage';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import { useParentCompanyQuery } from '@/lib/hooks/query/companies/hooks';
import { canCompaniesModuleAction } from '@/lib/permissions';
import { glassUi } from '@/lib/theme/glass-ui';
import { useAppTheme } from '@/theme';

export function CompanyParentDetailPage({ parentId }: { parentId: string }) {
  const theme = useAppTheme();
  const router = useRouter();
  const { hasPage, hasOperational } = useAuth();

  const canEdit = canCompaniesModuleAction(hasPage, hasOperational, 'update');
  const canViewServices =
    hasPage('page:resellers') || hasPage('page:clients') || hasPage('page:account-setup');

  const query = useParentCompanyQuery(parentId);
  const payload = query.data?.data;
  const parent = payload?.parentCompany;
  const children = payload?.children ?? [];

  if (query.isLoading) {
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

  return (
    <MobileScreen contentStyle={styles.screen}>
      <View style={{ gap: theme.spacing.md }}>
        <DashboardPageIntro subtitle={parent.reseller?.name ?? 'Parent company overview'}>
          <View style={styles.headerRow}>
            <StatusChip label="Parent" tone="info" />
            {canEdit ? (
              <Button
                size="compact"
                onPress={() => router.push(`/companies/${parentId}/edit?section=parent` as Href)}
              >
                Edit company
              </Button>
            ) : null}
          </View>
        </DashboardPageIntro>

        <DashboardCard contentStyle={{ gap: 12 }}>
          <Typography variant="medium16" style={{ fontWeight: '700' }}>
            {parent.name}
          </Typography>
          <Field label="Reseller" value={parent.reseller?.name ?? '—'} />
          <Field
            label="Created"
            value={parent.createdAt ? new Date(parent.createdAt).toLocaleDateString() : '—'}
          />
          <Field label="Child companies" value={String(children.length)} />
        </DashboardCard>

        <CompanyEditActionTiles
          parentId={parentId}
          childCount={children.length}
          resellerName={parent.reseller?.name}
          canEdit={canEdit}
          canViewServices={canViewServices}
        />

        <DashboardCard contentStyle={{ gap: theme.spacing.sm }}>
          <View style={styles.sectionTitle}>
            <Ionicons name="globe-outline" size={18} color={theme.app.dashboard.accentBlue} />
            <Typography variant="medium16" style={{ fontWeight: '700', flex: 1 }}>
              Child companies
            </Typography>
            {canEdit && children.length > 0 ? (
              <Button
                size="compact"
                variant="outlined"
                onPress={() => router.push(`/companies/${parentId}/edit?section=children` as Href)}
              >
                Edit
              </Button>
            ) : null}
          </View>
          {children.length === 0 ? (
            <Typography variant="small" muted>
              No child companies yet.
            </Typography>
          ) : (
            children.map((child) => (
              <View
                key={child.id}
                style={[
                  styles.childRow,
                  {
                    backgroundColor: theme.app.dashboard.overlayLight,
                    borderColor: theme.app.dashboard.cardBorder,
                  },
                ]}
              >
                <View style={styles.childIcon}>
                  <Ionicons name="business-outline" size={16} color={theme.app.dashboard.accentBlue} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="medium" style={{ fontWeight: '600' }} numberOfLines={1}>
                    {child.name}
                  </Typography>
                  <Typography variant="small" muted numberOfLines={1}>
                    {child.website?.url ?? child.email ?? '—'}
                  </Typography>
                </View>
                <StatusChip label="Child" tone="success" />
              </View>
            ))
          )}
        </DashboardCard>

        <CompanyClientPermissionsPanel parentCompanyId={parentId} parentCompanyName={parent.name} />
      </View>
    </MobileScreen>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Typography variant="small" muted>
        {label}
      </Typography>
      <Typography variant="medium16">{value}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: 4, paddingBottom: 28 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  childIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(88, 101, 242, 0.16)',
    borderWidth: 1,
    borderColor: glassUi.border.subtle,
  },
});
