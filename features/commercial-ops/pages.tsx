import { ScrollView, StyleSheet, View } from 'react-native';

import { listInvoices } from '@/api/billing/invoice.api';
import { listPlatformResellerSubscriptions } from '@/api/billing/subscription.api';
import { listWebsiteBillingProfiles } from '@/api/billing/website-billing-profile.api';
import { apiClient } from '@/api/http/axios-instance';
import { MobileScreen } from '@/components/layout';
import { AppCard, Typography } from '@/components/ui';
import { ResellerStripeSetupPanel } from '@/features/billing/components/ResellerStripeSetupPanel';
import { PlatformStripeConfigPanel } from '@/features/billing/components/PlatformStripeConfigPanel';
import { ApiResourceScreen } from '@/features/shared';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import {
  usePlatformStripeConfigQuery,
  useResellerBillingPolicyQuery,
} from '@/lib/hooks/query/billing/billing';
import { useAppTheme } from '@/theme';

export function BillingInvoicesListPage() {
  return (
    <ApiResourceScreen
      title="Invoices"
      description="Client and platform invoices."
      icon="card-outline"
      queryKey={['billing', 'invoices']}
      queryFn={async (params) => listInvoices(params)}
      columnIds={['invoiceNumber', 'companyName', 'status', 'totalAmount', 'dueDate']}
      createLabel="Create"
      createFields={[
        { key: 'customerName', label: 'Customer name', required: true },
        { key: 'amount', label: 'Amount', required: true },
        { key: 'currency', label: 'Currency', placeholder: 'USD' },
      ]}
      createFn={async (body) => {
        const { data } = await apiClient.post('/billing/invoices', body);
        return data;
      }}
    />
  );
}

/** Payment setup / history — uses invoice list (no separate payments collection API). */
export function PaymentHistoryListPage() {
  return (
    <ApiResourceScreen
      title="Payment history"
      description="Invoices and recorded payments."
      icon="card-outline"
      queryKey={['billing', 'invoices', 'payments']}
      queryFn={async (params) => listInvoices(params)}
      columnIds={['invoiceNumber', 'companyName', 'status', 'paidDate', 'totalAmount']}
    />
  );
}

export function ResellerSubscriptionsListPage() {
  return (
    <ApiResourceScreen
      title="Reseller subscriptions"
      description="Subscription plans for resellers."
      icon="card-outline"
      queryKey={['billing', 'platform-subscriptions']}
      queryFn={async () => listPlatformResellerSubscriptions()}
      columnIds={['resellerName', 'planName', 'status', 'price', 'billingCycle']}
    />
  );
}

export function WebsiteBillingProfilesListPage() {
  return (
    <ApiResourceScreen
      title="Website contracts"
      description="Per-website billing rates and contract terms."
      icon="card-outline"
      queryKey={['billing', 'website-profiles']}
      queryFn={async () => listWebsiteBillingProfiles()}
      columnIds={[
        'websiteName',
        'companyName',
        'status',
        'billingCycle',
        'contractStartDate',
        'contractEndDate',
      ]}
    />
  );
}

export function LicenseGeneratePage() {
  return (
    <ApiResourceScreen
      title="License keys"
      description="Generate and manage platform license keys."
      icon="shield-outline"
      queryKey={['platform', 'license-keys']}
      queryFn={async (params) => {
        const { data } = await apiClient.get('/platform/license-keys', { params });
        return data;
      }}
      columnIds={['name', 'key', 'status', 'expiresAt']}
      createLabel="Generate"
      createFields={[
        { key: 'label', label: 'Label', required: true },
        { key: 'companyId', label: 'Company ID' },
      ]}
      createFn={async (body) => {
        const { data } = await apiClient.post('/platform/license-keys/generate', body);
        return data;
      }}
    />
  );
}

export function StripeConnectPage() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const resellerId = user?.resellerId?.trim() ?? '';
  const query = useResellerBillingPolicyQuery(resellerId, { enabled: Boolean(resellerId) });

  if (!resellerId) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" muted>
            Reseller scope required for agency payment setup.
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  if (query.isLoading) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" muted>
            Loading payment setup…
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  if (query.isError) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(query.error, 'Could not load payment setup.')}
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <ScrollView contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: 24 }}>
        <View>
          <Typography variant="boldLarge">Agency payment setup</Typography>
          <Typography variant="medium" muted style={{ marginTop: 4 }}>
            Stripe keys, webhook, and checkout configuration.
          </Typography>
        </View>
        <ResellerStripeSetupPanel resellerId={resellerId} />
      </ScrollView>
    </MobileScreen>
  );
}

export function PlatformStripeConfigPage() {
  const theme = useAppTheme();
  const { isPlatformAdmin } = useAuth();
  const query = usePlatformStripeConfigQuery({ enabled: isPlatformAdmin });

  if (!isPlatformAdmin) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" muted>
            Platform Stripe configuration is for platform administrators only.
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  if (query.isLoading) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" muted>
            Loading Stripe config…
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  if (query.isError) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(query.error, 'Could not load Stripe config.')}
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <ScrollView contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: 24 }}>
        <View>
          <Typography variant="boldLarge">Platform Stripe</Typography>
          <Typography variant="medium" muted style={{ marginTop: 4 }}>
            Platform-wide Stripe API keys and payment status.
          </Typography>
        </View>
        <PlatformStripeConfigPanel />
      </ScrollView>
    </MobileScreen>
  );
}
