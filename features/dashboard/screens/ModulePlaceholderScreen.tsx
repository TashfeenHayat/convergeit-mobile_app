import { useMemo } from 'react';

import { ApiResourceScreen } from '@/features/shared';
import { apiClient } from '@/api/http/axios-instance';

export type ModulePlaceholderScreenProps = {
  title: string;
  webPath: string;
  description?: string;
};

/** Map web dashboard paths to REST list endpoints (best-effort parity). */
function endpointForWebPath(webPath: string): string {
  const p = webPath.replace(/^\/dashboard/, '').replace(/\/$/, '') || '/';
  const map: Record<string, string> = {
    '/': '/dashboard/overview',
    '/agent-dashboard': '/dashboard/agent',
    '/supervisor-dashboard': '/dashboard/supervisor',
    '/qa-dashboard': '/dashboard/qa',
    '/company-admin-dashboard': '/dashboard/company-admin',
    '/supper-dashboard': '/dashboard/super',
    '/billing-dashboard': '/billing/dashboard',
    '/ai-management': '/ai-training/websites',
    '/website-analytics': '/chat/website-analytics',
    '/account-setup': '/companies/setup-drafts',
    '/organization-user': '/users',
    '/feedback': '/feedback',
    '/security': '/settings/security',
    '/theme': '/platform-theme',
    '/settings/email': '/email/setup',
    '/settings/system-emails': '/email/system-emails',
    '/attendance/team-attendance': '/hrms/attendance/team',
    '/shifts/department-shift': '/hrms/department-shift-assignments',
    '/shifts/pool-shift': '/hrms/pool-shift-assignments',
    '/shifts/user-shift': '/hrms/user-shift-assignments',
    '/hrms': '/hrms/overview',
    '/hrms/department-heads': '/hrms/department-heads',
    '/hrms/pool-heads': '/hrms/pool-heads',
    '/hrms/pool-members': '/hrms/pool-members',
    '/email': '/email/setup',
    '/email/forms': '/email/forms',
    '/email/design': '/email/design',
    '/email/distribution': '/distribution',
    '/chat-widget/add': '/widgets',
    '/integrations/add': '/social-media',
    '/ai-training/copilot': '/ai-copilot',
    '/ai-training/platform-keys': '/ai-platform/keys',
    '/ai-training/setup': '/ai-training/websites',
    '/ai-training/train': '/ai-training/sources',
    '/billing/payments': '/billing/invoices',
    '/billing/stripe-connect': '/billing/invoices',
    '/billing/reseller-subscriptions': '/platform/reseller-subscriptions',
    '/billing/platform-stripe': '/platform/stripe-config',
    '/billing/website-contracts': '/billing/website-profiles',
    '/billing/client-invoice': '/billing/invoices',
    '/crm-integration/crm-selection': '/crm/integrations',
    '/crm-integration/connection': '/crm/integrations',
    '/crm-integration/configure': '/crm/integrations',
    '/website-assigning/assign': '/website-assignments',
    '/website-assigning/service-schedules': '/website-assignments/websites',
    '/website-assigning/inquire-topics': '/website-assignments/websites',
    '/websites': '/companies/website-directory',
    '/distribution-setup': '/distribution-setups',
    '/ip-block-list': '/ip-blocks',
    '/ip-block-list/add': '/ip-blocks',
    '/phone-number-setup': '/website-sms-configs',
    '/qa/roster': '/chat/qa/roster',
    '/qa/inbox': '/chat/qa/me/queue',
    '/qa/team-quality': '/chat/reports/qa-quality',
    '/smtp-email-integration': '/email/smtp',
    '/payment-tracking': '/billing/payments',
    '/invoice-details': '/billing/invoices',
    '/process-payment-dashboard': '/billing/payments',
    '/pay-to-platform-dashboard': '/billing/payments',
  };

  if (map[p]) return map[p];

  // Nested: strip ids and use parent resource
  const cleaned = p
    .replace(/\/\[.*?\]/g, '')
    .replace(/\/[0-9a-f-]{8,}/gi, '')
    .replace(/\/(add|edit|detail|configure|test|manage|train|setup)$/g, '');

  if (map[cleaned]) return map[cleaned];

  // Fallback: convert path to API-ish resource
  return cleaned || '/dashboard/overview';
}

/**
 * Live module screen used while domain-specific UIs finish productizing.
 * Loads list data from the mirrored API for the web route — not a dead placeholder.
 */
export function ModulePlaceholderScreen({
  title,
  webPath,
  description = 'Live data from the Converge API for this module.',
}: ModulePlaceholderScreenProps) {
  const endpoint = useMemo(() => endpointForWebPath(webPath), [webPath]);

  return (
    <ApiResourceScreen
      title={title}
      description={description}
      icon="grid-outline"
      queryKey={['module', webPath, endpoint]}
      queryFn={async (params) => {
        const { data } = await apiClient.get(endpoint, { params });
        return data;
      }}
      emptyTitle={`No ${title.toLowerCase()} yet`}
      emptyDescription={`Connected to ${endpoint}. Create records on web or use Add where enabled.`}
    />
  );
}
