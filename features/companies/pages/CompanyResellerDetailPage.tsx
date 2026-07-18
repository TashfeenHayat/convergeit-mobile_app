import { View } from 'react-native';

import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import { DashboardCard, StatusChip, Typography } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { OP } from '@/lib/permissions/operational-keys';
import { useAppTheme } from '@/theme';
import { ResellerModulesPanel } from '../components/ResellerModulesPanel';

export function CompanyResellerDetailPage({
  resellerId,
  resellerName,
}: {
  resellerId: string;
  resellerName?: string;
}) {
  const theme = useAppTheme();
  const { hasOperational } = useAuth();
  const canEdit = hasOperational(OP.company.manage) || hasOperational(OP.company.update);

  return (
    <MobileScreen contentStyle={{ paddingTop: 4, gap: theme.spacing.md }}>
      <DashboardPageIntro subtitle="Sellable modules for this reseller.">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <StatusChip label="Reseller" tone="neutral" />
          <Typography variant="medium16" style={{ fontWeight: '700', flex: 1 }} numberOfLines={1}>
            {resellerName ?? 'Reseller'}
          </Typography>
        </View>
      </DashboardPageIntro>

      <DashboardCard contentStyle={{ gap: theme.spacing.md }}>
        <ResellerModulesPanel
          resellerId={resellerId}
          resellerName={resellerName}
          readOnly={!canEdit}
          promptOfferingType
          embedded
        />
      </DashboardCard>
    </MobileScreen>
  );
}
