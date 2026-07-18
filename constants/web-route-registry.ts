/**
 * Auto-generated mirror of converge_saas_frontend/app routes.
 * Re-run: node scripts/generate-routes-from-web.mjs
 */
export type WebRouteEntry = {
  webRoute: string;
  /** Expo Router path (groups omitted). Dynamic segments keep [param] form. */
  href: string;
  title: string;
  webPath: string;
  group: 'dashboard' | 'pay' | 'rate' | 'embed' | 'test' | 'chat' | 'other';
};

export const WEB_ROUTE_REGISTRY: readonly WebRouteEntry[] = [
  {
    "webRoute": "chat/guest",
    "href": "/chat/guest",
    "title": "Guest",
    "webPath": "/chat/guest",
    "group": "chat"
  },
  {
    "webRoute": "dashboard",
    "href": "/home",
    "title": "Dashboard",
    "webPath": "/dashboard",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/account-setup",
    "href": "/account-setup",
    "title": "Account Setup",
    "webPath": "/dashboard/account-setup",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/agent-dashboard",
    "href": "/agent-dashboard",
    "title": "Agent Dashboard",
    "webPath": "/dashboard/agent-dashboard",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/ai-management",
    "href": "/ai-management",
    "title": "Ai Management",
    "webPath": "/dashboard/ai-management",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/ai-training",
    "href": "/ai-training",
    "title": "Ai Training",
    "webPath": "/dashboard/ai-training",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/ai-training/assistant",
    "href": "/ai-training/assistant",
    "title": "Assistant",
    "webPath": "/dashboard/ai-training/assistant",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/ai-training/assistant/add",
    "href": "/ai-training/assistant/add",
    "title": "Add",
    "webPath": "/dashboard/ai-training/assistant/add",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/ai-training/assistant/manage",
    "href": "/ai-training/assistant/manage",
    "title": "Manage",
    "webPath": "/dashboard/ai-training/assistant/manage",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/ai-training/assistant/test",
    "href": "/ai-training/assistant/test",
    "title": "Test",
    "webPath": "/dashboard/ai-training/assistant/test",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/ai-training/chatbot",
    "href": "/ai-training/chatbot",
    "title": "Chatbot",
    "webPath": "/dashboard/ai-training/chatbot",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/ai-training/chatbot/add",
    "href": "/ai-training/chatbot/add",
    "title": "Add",
    "webPath": "/dashboard/ai-training/chatbot/add",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/ai-training/chatbot/manage",
    "href": "/ai-training/chatbot/manage",
    "title": "Manage",
    "webPath": "/dashboard/ai-training/chatbot/manage",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/ai-training/chatbot/test",
    "href": "/ai-training/chatbot/test",
    "title": "Test",
    "webPath": "/dashboard/ai-training/chatbot/test",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/ai-training/copilot",
    "href": "/ai-training/copilot",
    "title": "Copilot",
    "webPath": "/dashboard/ai-training/copilot",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/ai-training/platform-keys",
    "href": "/ai-training/platform-keys",
    "title": "Platform Keys",
    "webPath": "/dashboard/ai-training/platform-keys",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/ai-training/setup",
    "href": "/ai-training/setup",
    "title": "Setup",
    "webPath": "/dashboard/ai-training/setup",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/ai-training/train",
    "href": "/ai-training/train",
    "title": "Train",
    "webPath": "/dashboard/ai-training/train",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/attendance/mark-attendance",
    "href": "/attendance/mark-attendance",
    "title": "Mark Attendance",
    "webPath": "/dashboard/attendance/mark-attendance",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/attendance/my-attendance",
    "href": "/attendance/my-attendance",
    "title": "My Attendance",
    "webPath": "/dashboard/attendance/my-attendance",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/attendance/team-attendance",
    "href": "/attendance/team-attendance",
    "title": "Team Attendance",
    "webPath": "/dashboard/attendance/team-attendance",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/billing",
    "href": "/billing",
    "title": "Billing",
    "webPath": "/dashboard/billing",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/billing-dashboard",
    "href": "/billing-dashboard",
    "title": "Billing Dashboard",
    "webPath": "/dashboard/billing-dashboard",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/billing/client-invoice",
    "href": "/billing/client-invoice",
    "title": "Client Invoice",
    "webPath": "/dashboard/billing/client-invoice",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/billing/create-invoice",
    "href": "/billing/create-invoice",
    "title": "Create Invoice",
    "webPath": "/dashboard/billing/create-invoice",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/billing/invoice",
    "href": "/billing/invoice",
    "title": "Invoice",
    "webPath": "/dashboard/billing/invoice",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/billing/invoice/one",
    "href": "/billing/invoice/one",
    "title": "One",
    "webPath": "/dashboard/billing/invoice/one",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/billing/invoice/three",
    "href": "/billing/invoice/three",
    "title": "Three",
    "webPath": "/dashboard/billing/invoice/three",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/billing/invoice/two",
    "href": "/billing/invoice/two",
    "title": "Two",
    "webPath": "/dashboard/billing/invoice/two",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/billing/invoices/[invoiceId]",
    "href": "/billing/invoices/[invoiceId]",
    "title": "Invoices",
    "webPath": "/dashboard/billing/invoices/[invoiceId]",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/billing/payments",
    "href": "/billing/payments",
    "title": "Payments",
    "webPath": "/dashboard/billing/payments",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/billing/platform-stripe",
    "href": "/billing/platform-stripe",
    "title": "Platform Stripe",
    "webPath": "/dashboard/billing/platform-stripe",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/billing/reseller-subscriptions",
    "href": "/billing/reseller-subscriptions",
    "title": "Reseller Subscriptions",
    "webPath": "/dashboard/billing/reseller-subscriptions",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/billing/stripe-connect",
    "href": "/billing/stripe-connect",
    "title": "Stripe Connect",
    "webPath": "/dashboard/billing/stripe-connect",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/billing/website-contracts",
    "href": "/billing/website-contracts",
    "title": "Website Contracts",
    "webPath": "/dashboard/billing/website-contracts",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-canned",
    "href": "/chat-canned",
    "title": "Chat Canned",
    "webPath": "/dashboard/chat-canned",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-internal-supervisors",
    "href": "/chat-internal-supervisors",
    "title": "Chat Internal Supervisors",
    "webPath": "/dashboard/chat-internal-supervisors",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-involvement",
    "href": "/chat-involvement",
    "title": "Chat Involvement",
    "webPath": "/dashboard/chat-involvement",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-monitor",
    "href": "/chat-monitor",
    "title": "Chat Monitor",
    "webPath": "/dashboard/chat-monitor",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-monitor/[conversationId]",
    "href": "/chat-monitor/[conversationId]",
    "title": "Chat Monitor",
    "webPath": "/dashboard/chat-monitor/[conversationId]",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-operations",
    "href": "/chat-operations",
    "title": "Chat Operations",
    "webPath": "/dashboard/chat-operations",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-operations/distribution",
    "href": "/chat-operations/distribution",
    "title": "Distribution",
    "webPath": "/dashboard/chat-operations/distribution",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-operations/wrap-up",
    "href": "/chat-operations/wrap-up",
    "title": "Wrap Up",
    "webPath": "/dashboard/chat-operations/wrap-up",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-qa",
    "href": "/chat-qa",
    "title": "Chat Qa",
    "webPath": "/dashboard/chat-qa",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-qa/[conversationId]",
    "href": "/chat-qa/[conversationId]",
    "title": "Chat Qa",
    "webPath": "/dashboard/chat-qa/[conversationId]",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-reports",
    "href": "/chat-reports",
    "title": "Chat Reports",
    "webPath": "/dashboard/chat-reports",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-settings",
    "href": "/chat-settings",
    "title": "Chat Settings",
    "webPath": "/dashboard/chat-settings",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-settings/[websiteId]",
    "href": "/chat-settings/[websiteId]",
    "title": "Chat Settings",
    "webPath": "/dashboard/chat-settings/[websiteId]",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-settings/close-policy",
    "href": "/chat-settings/close-policy",
    "title": "Close Policy",
    "webPath": "/dashboard/chat-settings/close-policy",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-settings/qa-policy",
    "href": "/chat-settings/qa-policy",
    "title": "Qa Policy",
    "webPath": "/dashboard/chat-settings/qa-policy",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-settings/qa-roster",
    "href": "/chat-settings/qa-roster",
    "title": "Qa Roster",
    "webPath": "/dashboard/chat-settings/qa-roster",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-transcripts",
    "href": "/chat-transcripts",
    "title": "Chat Transcripts",
    "webPath": "/dashboard/chat-transcripts",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-transcripts/[conversationId]",
    "href": "/chat-transcripts/[conversationId]",
    "title": "Chat Transcripts",
    "webPath": "/dashboard/chat-transcripts/[conversationId]",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-widget",
    "href": "/chat-widget",
    "title": "Chat Widget",
    "webPath": "/dashboard/chat-widget",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-widget/[widgetKey]",
    "href": "/chat-widget/[widgetKey]",
    "title": "Chat Widget",
    "webPath": "/dashboard/chat-widget/[widgetKey]",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-widget/[widgetKey]/edit",
    "href": "/chat-widget/[widgetKey]/edit",
    "title": "Edit",
    "webPath": "/dashboard/chat-widget/[widgetKey]/edit",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-widget/add",
    "href": "/chat-widget/add",
    "title": "Add",
    "webPath": "/dashboard/chat-widget/add",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-widget/add/chat/box",
    "href": "/chat-widget/add/chat/box",
    "title": "Box",
    "webPath": "/dashboard/chat-widget/add/chat/box",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-widget/add/chat/button",
    "href": "/chat-widget/add/chat/button",
    "title": "Button",
    "webPath": "/dashboard/chat-widget/add/chat/button",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-widget/add/chat/notifications",
    "href": "/chat-widget/add/chat/notifications",
    "title": "Notifications",
    "webPath": "/dashboard/chat-widget/add/chat/notifications",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-widget/add/chat/script",
    "href": "/chat-widget/add/chat/script",
    "title": "Script",
    "webPath": "/dashboard/chat-widget/add/chat/script",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-widget/add/text",
    "href": "/chat-widget/add/text",
    "title": "Text",
    "webPath": "/dashboard/chat-widget/add/text",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-widget/add/text/script",
    "href": "/chat-widget/add/text/script",
    "title": "Script",
    "webPath": "/dashboard/chat-widget/add/text/script",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/chat-widget/ai-training",
    "href": "/chat-widget/ai-training",
    "title": "Ai Training",
    "webPath": "/dashboard/chat-widget/ai-training",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/companies",
    "href": "/companies",
    "title": "Companies",
    "webPath": "/dashboard/companies",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/companies/[parentId]/edit",
    "href": "/companies/[parentId]/edit",
    "title": "Edit",
    "webPath": "/dashboard/companies/[parentId]/edit",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/companies/[parentId]/edit/reseller",
    "href": "/companies/[parentId]/edit/reseller",
    "title": "Reseller",
    "webPath": "/dashboard/companies/[parentId]/edit/reseller",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/companies/parent/[parentId]/detail",
    "href": "/companies/parent/[parentId]/detail",
    "title": "Detail",
    "webPath": "/dashboard/companies/parent/[parentId]/detail",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/companies/reseller/[resellerId]/detail",
    "href": "/companies/reseller/[resellerId]/detail",
    "title": "Detail",
    "webPath": "/dashboard/companies/reseller/[resellerId]/detail",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/company-admin-dashboard",
    "href": "/company-admin-dashboard",
    "title": "Company Admin Dashboard",
    "webPath": "/dashboard/company-admin-dashboard",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/contract",
    "href": "/contract",
    "title": "Contract",
    "webPath": "/dashboard/contract",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/crm-integration",
    "href": "/crm-integration",
    "title": "Crm Integration",
    "webPath": "/dashboard/crm-integration",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/crm-integration/configure",
    "href": "/crm-integration/configure",
    "title": "Configure",
    "webPath": "/dashboard/crm-integration/configure",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/crm-integration/connection",
    "href": "/crm-integration/connection",
    "title": "Connection",
    "webPath": "/dashboard/crm-integration/connection",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/crm-integration/connection-method",
    "href": "/crm-integration/connection-method",
    "title": "Connection Method",
    "webPath": "/dashboard/crm-integration/connection-method",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/crm-integration/crm-selection",
    "href": "/crm-integration/crm-selection",
    "title": "Crm Selection",
    "webPath": "/dashboard/crm-integration/crm-selection",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/crm-integration/field-mapping",
    "href": "/crm-integration/field-mapping",
    "title": "Field Mapping",
    "webPath": "/dashboard/crm-integration/field-mapping",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/crm-integration/hubspot-connection-fields",
    "href": "/crm-integration/hubspot-connection-fields",
    "title": "Hubspot Connection Fields",
    "webPath": "/dashboard/crm-integration/hubspot-connection-fields",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/crm-integration/oauth-callback",
    "href": "/crm-integration/oauth-callback",
    "title": "Oauth Callback",
    "webPath": "/dashboard/crm-integration/oauth-callback",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/crm-integrator",
    "href": "/crm-integrator",
    "title": "Crm Integrator",
    "webPath": "/dashboard/crm-integrator",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/departments",
    "href": "/departments",
    "title": "Departments",
    "webPath": "/dashboard/departments",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/designations",
    "href": "/designations",
    "title": "Designations",
    "webPath": "/dashboard/designations",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/distribution-setup",
    "href": "/distribution-setup",
    "title": "Distribution Setup",
    "webPath": "/dashboard/distribution-setup",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/distribution-setup/configure",
    "href": "/distribution-setup/configure",
    "title": "Configure",
    "webPath": "/dashboard/distribution-setup/configure",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/distribution-setup/settings",
    "href": "/distribution-setup/settings",
    "title": "Settings",
    "webPath": "/dashboard/distribution-setup/settings",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/distribution-setup/subject",
    "href": "/distribution-setup/subject",
    "title": "Subject",
    "webPath": "/dashboard/distribution-setup/subject",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/distribution-setup/table",
    "href": "/distribution-setup/table",
    "title": "Table",
    "webPath": "/dashboard/distribution-setup/table",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/distribution-setup/test",
    "href": "/distribution-setup/test",
    "title": "Test",
    "webPath": "/dashboard/distribution-setup/test",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/distribution-setup/transcript",
    "href": "/distribution-setup/transcript",
    "title": "Transcript",
    "webPath": "/dashboard/distribution-setup/transcript",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email",
    "href": "/email",
    "title": "Email",
    "webPath": "/dashboard/email",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/connection",
    "href": "/email/connection",
    "title": "Connection",
    "webPath": "/dashboard/email/connection",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/connection/[resellerId]",
    "href": "/email/connection/[resellerId]",
    "title": "Connection",
    "webPath": "/dashboard/email/connection/[resellerId]",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/connection/assignment",
    "href": "/email/connection/assignment",
    "title": "Assignment",
    "webPath": "/dashboard/email/connection/assignment",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/connection/platform",
    "href": "/email/connection/platform",
    "title": "Platform",
    "webPath": "/dashboard/email/connection/platform",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/connection/reseller",
    "href": "/email/connection/reseller",
    "title": "Reseller",
    "webPath": "/dashboard/email/connection/reseller",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/design",
    "href": "/email/design",
    "title": "Design",
    "webPath": "/dashboard/email/design",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/design/assignment",
    "href": "/email/design/assignment",
    "title": "Assignment",
    "webPath": "/dashboard/email/design/assignment",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/design/platform",
    "href": "/email/design/platform",
    "title": "Platform",
    "webPath": "/dashboard/email/design/platform",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/design/platform/editor",
    "href": "/email/design/platform/editor",
    "title": "Editor",
    "webPath": "/dashboard/email/design/platform/editor",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/design/reseller",
    "href": "/email/design/reseller",
    "title": "Reseller",
    "webPath": "/dashboard/email/design/reseller",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/design/reseller/[resellerId]",
    "href": "/email/design/reseller/[resellerId]",
    "title": "Reseller",
    "webPath": "/dashboard/email/design/reseller/[resellerId]",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/distribution",
    "href": "/email/distribution",
    "title": "Distribution",
    "webPath": "/dashboard/email/distribution",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/distribution/configure",
    "href": "/email/distribution/configure",
    "title": "Configure",
    "webPath": "/dashboard/email/distribution/configure",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/distribution/settings",
    "href": "/email/distribution/settings",
    "title": "Settings",
    "webPath": "/dashboard/email/distribution/settings",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/distribution/table",
    "href": "/email/distribution/table",
    "title": "Table",
    "webPath": "/dashboard/email/distribution/table",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/feedback",
    "href": "/email/feedback",
    "title": "Feedback",
    "webPath": "/dashboard/email/feedback",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/form",
    "href": "/email/form",
    "title": "Form",
    "webPath": "/dashboard/email/form",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/forms",
    "href": "/email/forms",
    "title": "Forms",
    "webPath": "/dashboard/email/forms",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/forms/custom",
    "href": "/email/forms/custom",
    "title": "Custom",
    "webPath": "/dashboard/email/forms/custom",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/forms/set",
    "href": "/email/forms/set",
    "title": "Set",
    "webPath": "/dashboard/email/forms/set",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/forms/standard",
    "href": "/email/forms/standard",
    "title": "Standard",
    "webPath": "/dashboard/email/forms/standard",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/setup",
    "href": "/email/setup",
    "title": "Setup",
    "webPath": "/dashboard/email/setup",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/setup/assignment",
    "href": "/email/setup/assignment",
    "title": "Assignment",
    "webPath": "/dashboard/email/setup/assignment",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/setup/platform",
    "href": "/email/setup/platform",
    "title": "Platform",
    "webPath": "/dashboard/email/setup/platform",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/setup/reseller",
    "href": "/email/setup/reseller",
    "title": "Reseller",
    "webPath": "/dashboard/email/setup/reseller",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/email/test",
    "href": "/email/test",
    "title": "Test",
    "webPath": "/dashboard/email/test",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/feedback",
    "href": "/feedback",
    "title": "Feedback",
    "webPath": "/dashboard/feedback",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/hrms",
    "href": "/hrms",
    "title": "Hrms",
    "webPath": "/dashboard/hrms",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/hrms/department-heads",
    "href": "/hrms/department-heads",
    "title": "Department Heads",
    "webPath": "/dashboard/hrms/department-heads",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/hrms/pool-heads",
    "href": "/hrms/pool-heads",
    "title": "Pool Heads",
    "webPath": "/dashboard/hrms/pool-heads",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/hrms/pool-members",
    "href": "/hrms/pool-members",
    "title": "Pool Members",
    "webPath": "/dashboard/hrms/pool-members",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/hrms/pools",
    "href": "/hrms/pools",
    "title": "Pools",
    "webPath": "/dashboard/hrms/pools",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/integrations",
    "href": "/integrations",
    "title": "Integrations",
    "webPath": "/dashboard/integrations",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/integrations/add",
    "href": "/integrations/add",
    "title": "Add",
    "webPath": "/dashboard/integrations/add",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/integrations/add/connect",
    "href": "/integrations/add/connect",
    "title": "Connect",
    "webPath": "/dashboard/integrations/add/connect",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/integrations/add/platform",
    "href": "/integrations/add/platform",
    "title": "Platform",
    "webPath": "/dashboard/integrations/add/platform",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/integrations/oauth-callback",
    "href": "/integrations/oauth-callback",
    "title": "Oauth Callback",
    "webPath": "/dashboard/integrations/oauth-callback",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/invoice-details",
    "href": "/invoice-details",
    "title": "Invoice Details",
    "webPath": "/dashboard/invoice-details",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/ip-block-list",
    "href": "/ip-block-list",
    "title": "Ip Block List",
    "webPath": "/dashboard/ip-block-list",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/ip-block-list/add",
    "href": "/ip-block-list/add",
    "title": "Add",
    "webPath": "/dashboard/ip-block-list/add",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/ip-block-list/add/configure",
    "href": "/ip-block-list/add/configure",
    "title": "Configure",
    "webPath": "/dashboard/ip-block-list/add/configure",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/ip-block-list/add/details",
    "href": "/ip-block-list/add/details",
    "title": "Details",
    "webPath": "/dashboard/ip-block-list/add/details",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/leave/apply-leave",
    "href": "/leave/apply-leave",
    "title": "Apply Leave",
    "webPath": "/dashboard/leave/apply-leave",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/leave/approval-inbox",
    "href": "/leave/approval-inbox",
    "title": "Approval Inbox",
    "webPath": "/dashboard/leave/approval-inbox",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/leave/approve-leave",
    "href": "/leave/approve-leave",
    "title": "Approve Leave",
    "webPath": "/dashboard/leave/approve-leave",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/leave/leave-balance",
    "href": "/leave/leave-balance",
    "title": "Leave Balance",
    "webPath": "/dashboard/leave/leave-balance",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/leave/leave-type",
    "href": "/leave/leave-type",
    "title": "Leave Type",
    "webPath": "/dashboard/leave/leave-type",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/license-generate",
    "href": "/license-generate",
    "title": "License Generate",
    "webPath": "/dashboard/license-generate",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/organization-user",
    "href": "/organization-user",
    "title": "Organization User",
    "webPath": "/dashboard/organization-user",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/pay-to-platform-dashboard",
    "href": "/pay-to-platform-dashboard",
    "title": "Pay To Platform Dashboard",
    "webPath": "/dashboard/pay-to-platform-dashboard",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/payment-history",
    "href": "/payment-history",
    "title": "Payment History",
    "webPath": "/dashboard/payment-history",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/payment-tracking",
    "href": "/payment-tracking",
    "title": "Payment Tracking",
    "webPath": "/dashboard/payment-tracking",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/phone-number-setup",
    "href": "/phone-number-setup",
    "title": "Phone Number Setup",
    "webPath": "/dashboard/phone-number-setup",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/phone-number-setup/add",
    "href": "/phone-number-setup/add",
    "title": "Add",
    "webPath": "/dashboard/phone-number-setup/add",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/pools",
    "href": "/pools",
    "title": "Pools",
    "webPath": "/dashboard/pools",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/process-payment-dashboard",
    "href": "/process-payment-dashboard",
    "title": "Process Payment Dashboard",
    "webPath": "/dashboard/process-payment-dashboard",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/qa",
    "href": "/qa",
    "title": "Qa",
    "webPath": "/dashboard/qa",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/qa-dashboard",
    "href": "/qa-dashboard",
    "title": "Qa Dashboard",
    "webPath": "/dashboard/qa-dashboard",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/qa/inbox",
    "href": "/qa/inbox",
    "title": "Inbox",
    "webPath": "/dashboard/qa/inbox",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/qa/inbox/[conversationId]",
    "href": "/qa/inbox/[conversationId]",
    "title": "Inbox",
    "webPath": "/dashboard/qa/inbox/[conversationId]",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/qa/roster",
    "href": "/qa/roster",
    "title": "Roster",
    "webPath": "/dashboard/qa/roster",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/qa/roster/assign",
    "href": "/qa/roster/assign",
    "title": "Assign",
    "webPath": "/dashboard/qa/roster/assign",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/qa/team-quality",
    "href": "/qa/team-quality",
    "title": "Team Quality",
    "webPath": "/dashboard/qa/team-quality",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/reports",
    "href": "/reports",
    "title": "Reports",
    "webPath": "/dashboard/reports",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/reports/configuration",
    "href": "/reports/configuration",
    "title": "Configuration",
    "webPath": "/dashboard/reports/configuration",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/roles",
    "href": "/roles",
    "title": "Roles",
    "webPath": "/dashboard/roles",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/security",
    "href": "/security",
    "title": "Security",
    "webPath": "/dashboard/security",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/services",
    "href": "/services",
    "title": "Services",
    "webPath": "/dashboard/services",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/settings",
    "href": "/settings",
    "title": "Settings",
    "webPath": "/dashboard/settings",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/settings/email",
    "href": "/settings/email",
    "title": "Email",
    "webPath": "/dashboard/settings/email",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/settings/logs",
    "href": "/settings/logs",
    "title": "Logs",
    "webPath": "/dashboard/settings/logs",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/settings/profile",
    "href": "/settings/profile",
    "title": "Profile",
    "webPath": "/dashboard/settings/profile",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/settings/system-emails",
    "href": "/settings/system-emails",
    "title": "System Emails",
    "webPath": "/dashboard/settings/system-emails",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/shifts",
    "href": "/shifts",
    "title": "Shifts",
    "webPath": "/dashboard/shifts",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/shifts/department-shift",
    "href": "/shifts/department-shift",
    "title": "Department Shift",
    "webPath": "/dashboard/shifts/department-shift",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/shifts/pool-shift",
    "href": "/shifts/pool-shift",
    "title": "Pool Shift",
    "webPath": "/dashboard/shifts/pool-shift",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/shifts/user-shift",
    "href": "/shifts/user-shift",
    "title": "User Shift",
    "webPath": "/dashboard/shifts/user-shift",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/smtp-email-integration",
    "href": "/smtp-email-integration",
    "title": "Smtp Email Integration",
    "webPath": "/dashboard/smtp-email-integration",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/smtp-email-integration/child-company-setup",
    "href": "/smtp-email-integration/child-company-setup",
    "title": "Child Company Setup",
    "webPath": "/dashboard/smtp-email-integration/child-company-setup",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/smtp-email-integration/smtp-configuration",
    "href": "/smtp-email-integration/smtp-configuration",
    "title": "Smtp Configuration",
    "webPath": "/dashboard/smtp-email-integration/smtp-configuration",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/supervisor-dashboard",
    "href": "/supervisor-dashboard",
    "title": "Supervisor Dashboard",
    "webPath": "/dashboard/supervisor-dashboard",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/supper-dashboard",
    "href": "/supper-dashboard",
    "title": "Supper Dashboard",
    "webPath": "/dashboard/supper-dashboard",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/theme",
    "href": "/theme",
    "title": "Theme",
    "webPath": "/dashboard/theme",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/user-page",
    "href": "/user-page",
    "title": "User Page",
    "webPath": "/dashboard/user-page",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/user-page/permissions",
    "href": "/user-page/permissions",
    "title": "Permissions",
    "webPath": "/dashboard/user-page/permissions",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/user-page/poc-list",
    "href": "/user-page/poc-list",
    "title": "Poc List",
    "webPath": "/dashboard/user-page/poc-list",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/user-page/user/[userId]",
    "href": "/user-page/user/[userId]",
    "title": "User",
    "webPath": "/dashboard/user-page/user/[userId]",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/website-analytics",
    "href": "/website-analytics",
    "title": "Website Analytics",
    "webPath": "/dashboard/website-analytics",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/website-assigning",
    "href": "/website-assigning",
    "title": "Website Assigning",
    "webPath": "/dashboard/website-assigning",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/website-assigning/[userId]",
    "href": "/website-assigning/[userId]",
    "title": "Website Assigning",
    "webPath": "/dashboard/website-assigning/[userId]",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/website-assigning/assign",
    "href": "/website-assigning/assign",
    "title": "Assign",
    "webPath": "/dashboard/website-assigning/assign",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/website-assigning/inquire-topics",
    "href": "/website-assigning/inquire-topics",
    "title": "Inquire Topics",
    "webPath": "/dashboard/website-assigning/inquire-topics",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/website-assigning/inquire-topics/add",
    "href": "/website-assigning/inquire-topics/add",
    "title": "Add",
    "webPath": "/dashboard/website-assigning/inquire-topics/add",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/website-assigning/service-schedules",
    "href": "/website-assigning/service-schedules",
    "title": "Service Schedules",
    "webPath": "/dashboard/website-assigning/service-schedules",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/website-assigning/service-schedules/add",
    "href": "/website-assigning/service-schedules/add",
    "title": "Add",
    "webPath": "/dashboard/website-assigning/service-schedules/add",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/website-assigning/sites/[parentCompanyId]/[childCompanyId]",
    "href": "/website-assigning/sites/[parentCompanyId]/[childCompanyId]",
    "title": "Sites",
    "webPath": "/dashboard/website-assigning/sites/[parentCompanyId]/[childCompanyId]",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/website-assigning/website/[websiteId]",
    "href": "/website-assigning/website/[websiteId]",
    "title": "Website",
    "webPath": "/dashboard/website-assigning/website/[websiteId]",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/website-assigning/website/[websiteId]/inquire-topics",
    "href": "/website-assigning/website/[websiteId]/inquire-topics",
    "title": "Inquire Topics",
    "webPath": "/dashboard/website-assigning/website/[websiteId]/inquire-topics",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/website-assigning/website/[websiteId]/service-scheduling",
    "href": "/website-assigning/website/[websiteId]/service-scheduling",
    "title": "Service Scheduling",
    "webPath": "/dashboard/website-assigning/website/[websiteId]/service-scheduling",
    "group": "dashboard"
  },
  {
    "webRoute": "dashboard/websites",
    "href": "/websites",
    "title": "Websites",
    "webPath": "/dashboard/websites",
    "group": "dashboard"
  },
  {
    "webRoute": "embed/widget",
    "href": "/embed/widget",
    "title": "Widget",
    "webPath": "/embed/widget",
    "group": "embed"
  },
  {
    "webRoute": "pay/[token]",
    "href": "/pay/[token]",
    "title": "Pay",
    "webPath": "/pay/[token]",
    "group": "pay"
  },
  {
    "webRoute": "pay/cancelled",
    "href": "/pay/cancelled",
    "title": "Cancelled",
    "webPath": "/pay/cancelled",
    "group": "pay"
  },
  {
    "webRoute": "pay/success",
    "href": "/pay/success",
    "title": "Success",
    "webPath": "/pay/success",
    "group": "pay"
  },
  {
    "webRoute": "rate",
    "href": "/rate",
    "title": "Rate",
    "webPath": "/rate",
    "group": "rate"
  },
  {
    "webRoute": "rate/note",
    "href": "/rate/note",
    "title": "Note",
    "webPath": "/rate/note",
    "group": "rate"
  },
  {
    "webRoute": "test/widget",
    "href": "/test/widget",
    "title": "Widget",
    "webPath": "/test/widget",
    "group": "test"
  }
] as const;

export const DASHBOARD_WEB_ROUTES = WEB_ROUTE_REGISTRY.filter((r) => r.group === 'dashboard');

export function titleForHref(href: string): string | undefined {
  const clean = href.split('?')[0]?.replace(/\/+$/, '') ?? '';
  const exact = WEB_ROUTE_REGISTRY.find((r) => r.href === clean);
  if (exact) return exact.title;
  // Match dynamic patterns: /billing/invoices/[invoiceId]
  for (const r of WEB_ROUTE_REGISTRY) {
    if (!r.href.includes('[')) continue;
    const pattern = r.href.replace(/\[[^\]]+\]/g, '[^/]+');
    if (new RegExp(`^${pattern}$`).test(clean)) return r.title;
  }
  return undefined;
}
