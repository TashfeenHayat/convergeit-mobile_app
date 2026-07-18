import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DASH = path.resolve(__dirname, '../app/(dashboard)');

function page(importPath, component) {
  return `import { ${component} } from '${importPath}';\n\nexport default function Screen() {\n  return <${component} />;\n}\n`;
}

const ROUTE_MAP = [
  ['chat-transcripts/index.tsx', page('@/features/chat-ops-admin/pages', 'ChatTranscriptsListPage')],
  ['chat-canned/index.tsx', page('@/features/chat-ops-admin/pages', 'CannedMessagesListPage')],
  ['chat-settings/index.tsx', page('@/features/chat-ops-admin/pages', 'ChatSettingsListPage')],
  ['chat-qa/index.tsx', page('@/features/chat-ops-admin/pages', 'QaInboxListPage')],
  ['qa/inbox/index.tsx', page('@/features/chat-ops-admin/pages', 'QaInboxListPage')],
  ['chat-involvement/index.tsx', page('@/features/chat-ops-admin/pages', 'ChatInvolvementListPage')],
  ['chat-internal-supervisors/index.tsx', page('@/features/chat-ops-admin/pages', 'ChatInternalSupervisorsListPage')],
  ['chat-reports/index.tsx', page('@/features/chat-ops-admin/pages', 'ChatReportsPage')],
  ['website-assigning/index.tsx', page('@/features/website-ops/pages', 'WebsiteAssigningListPage')],
  ['service-schedules/index.tsx', page('@/features/website-ops/pages', 'ServiceSchedulesListPage')],
  ['service-schedules/add/index.tsx', page('@/features/website-ops/pages', 'ServiceSchedulesListPage')],
  ['inquire-topics/index.tsx', page('@/features/website-ops/pages', 'InquireTopicsListPage')],
  ['inquire-topics/add/index.tsx', page('@/features/website-ops/pages', 'InquireTopicsListPage')],
  ['chat-widget/index.tsx', page('@/features/chat-ops-admin/pages', 'ChatWidgetListPage')],
  ['phone-number-setup/index.tsx', page('@/features/website-ops/pages', 'PhoneNumberSetupListPage')],
  ['websites/index.tsx', page('@/features/website-ops/pages', 'WebsitesDirectoryPage')],
  ['billing/invoice/index.tsx', page('@/features/commercial-ops/pages', 'BillingInvoicesListPage')],
  ['billing/create-invoice/index.tsx', page('@/features/commercial-ops/pages', 'BillingInvoicesListPage')],
  ['payment-history/index.tsx', page('@/features/commercial-ops/pages', 'PaymentHistoryListPage')],
  ['payments/index.tsx', page('@/features/commercial-ops/pages', 'PaymentHistoryListPage')],
  ['reseller-subscriptions/index.tsx', page('@/features/commercial-ops/pages', 'ResellerSubscriptionsListPage')],
  ['license-generate/index.tsx', page('@/features/commercial-ops/pages', 'LicenseGeneratePage')],
  ['contract/index.tsx', page('@/features/contract/ContractWizardPageClient', 'ContractWizardPageClient')],
  ['stripe-connect/index.tsx', page('@/features/commercial-ops/pages', 'StripeConnectPage')],
  ['email/setup/index.tsx', page('@/features/comms-ai-ops/pages', 'EmailSetupListPage')],
  ['email/connection/index.tsx', page('@/features/comms-ai-ops/pages', 'EmailConnectionListPage')],
  ['crm-integration/index.tsx', page('@/features/comms-ai-ops/pages', 'CrmIntegrationListPage')],
  ['crm-integrator/index.tsx', page('@/features/comms-ai-ops/pages', 'CrmIntegrationListPage')],
  ['distribution-setup/index.tsx', page('@/features/comms-ai-ops/pages', 'DistributionSetupListPage')],
  ['ai-training/index.tsx', page('@/features/comms-ai-ops/pages', 'AiTrainingListPage')],
  ['ai-training/assistant/index.tsx', page('@/features/comms-ai-ops/pages', 'AiAssistantListPage')],
  ['ai-training/chatbot/index.tsx', page('@/features/comms-ai-ops/pages', 'AiChatbotListPage')],
  ['ip-block-list/index.tsx', page('@/features/comms-ai-ops/pages', 'IpBlockListPage')],
  ['settings/logs/index.tsx', page('@/features/comms-ai-ops/pages', 'ObservabilityLogsPage')],
  ['hrms/pools/index.tsx', page('@/features/hrms', 'PoolsListPage')],
];

let written = 0;
const missing = [];
for (const [rel, content] of ROUTE_MAP) {
  const file = path.join(DASH, rel);
  if (!fs.existsSync(file)) {
    missing.push(rel);
    continue;
  }
  fs.writeFileSync(file, content, 'utf8');
  written += 1;
}
console.log(JSON.stringify({ written, missing }, null, 2));
