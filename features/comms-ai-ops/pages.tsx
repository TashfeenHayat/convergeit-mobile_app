import { apiClient } from '@/api/http/axios-instance';
import { ApiResourceScreen } from '@/features/shared';

export function EmailSetupListPage() {
  return (
    <ApiResourceScreen
      title="Email setup"
      description="Mail providers and configuration status."
      icon="mail-outline"
      queryKey={['email', 'setup']}
      queryFn={async (params) => {
        const { data } = await apiClient.get('/email/setup', { params });
        return data;
      }}
      columnIds={['name', 'provider', 'status']}
    />
  );
}

export function EmailConnectionListPage() {
  return (
    <ApiResourceScreen
      title="Email connections"
      description="Connected mailboxes and SMTP/API links."
      icon="mail-outline"
      queryKey={['email', 'connections']}
      queryFn={async (params) => {
        const { data } = await apiClient.get('/email/connections', { params });
        return data;
      }}
      columnIds={['name', 'address', 'status']}
      createLabel="Connect"
      createFields={[
        { key: 'name', label: 'Connection name', required: true },
        { key: 'address', label: 'Email address', required: true },
      ]}
      createFn={async (body) => {
        const { data } = await apiClient.post('/email/connections', body);
        return data;
      }}
    />
  );
}

export function CrmIntegrationListPage() {
  return (
    <ApiResourceScreen
      title="CRM integrations"
      description="Connected CRM platforms and field mappings."
      icon="globe-outline"
      queryKey={['crm']}
      queryFn={async (params) => {
        const { data } = await apiClient.get('/crm/integrations', { params });
        return data;
      }}
      columnIds={['name', 'platform', 'status', 'websiteName']}
      createLabel="Add"
      createFields={[
        { key: 'platform', label: 'Platform', required: true, placeholder: 'hubspot' },
        { key: 'websiteId', label: 'Website ID', required: true },
      ]}
      createFn={async (body) => {
        const { data } = await apiClient.post('/crm/integrations', body);
        return data;
      }}
    />
  );
}

export function DistributionSetupListPage() {
  return (
    <ApiResourceScreen
      title="Distribution setup"
      description="Email/CRM distribution tables and routing."
      icon="list-outline"
      queryKey={['distribution']}
      queryFn={async (params) => {
        const { data } = await apiClient.get('/distribution', { params });
        return data;
      }}
      columnIds={['name', 'method', 'status', 'websiteName']}
    />
  );
}

export function AiTrainingListPage() {
  return (
    <ApiResourceScreen
      title="AI training"
      description="Websites and knowledge sources for AI assistants."
      icon="hardware-chip-outline"
      queryKey={['ai-training']}
      queryFn={async (params) => {
        const { data } = await apiClient.get('/ai-training/websites', { params });
        return data;
      }}
      columnIds={['name', 'status', 'websiteName']}
    />
  );
}

export function AiAssistantListPage() {
  return (
    <ApiResourceScreen
      title="AI assistants"
      description="Configured assistants for live chat."
      icon="hardware-chip-outline"
      queryKey={['ai-assistant']}
      queryFn={async (params) => {
        const { data } = await apiClient.get('/ai-assistant', { params });
        return data;
      }}
      columnIds={['name', 'status', 'model']}
      createLabel="Add"
      createFields={[
        { key: 'name', label: 'Assistant name', required: true },
        { key: 'websiteId', label: 'Website ID', required: true },
      ]}
      createFn={async (body) => {
        const { data } = await apiClient.post('/ai-assistant', body);
        return data;
      }}
    />
  );
}

export function AiChatbotListPage() {
  return (
    <ApiResourceScreen
      title="AI chatbots"
      description="Visitor-facing chatbot configurations."
      icon="hardware-chip-outline"
      queryKey={['ai-chatbot']}
      queryFn={async (params) => {
        const { data } = await apiClient.get('/ai-chatbot', { params });
        return data;
      }}
      columnIds={['name', 'status', 'websiteName']}
      createLabel="Add"
      createFields={[
        { key: 'name', label: 'Chatbot name', required: true },
        { key: 'websiteId', label: 'Website ID', required: true },
      ]}
      createFn={async (body) => {
        const { data } = await apiClient.post('/ai-chatbot', body);
        return data;
      }}
    />
  );
}

export function IpBlockListPage() {
  return (
    <ApiResourceScreen
      title="IP block list"
      description="Blocked visitor IPs and rules."
      icon="shield-outline"
      queryKey={['ip-block']}
      queryFn={async (params) => {
        const { data } = await apiClient.get('/ip-block', { params });
        return data;
      }}
      columnIds={['name', 'cidr', 'reason', 'status']}
      createLabel="Add"
      createFields={[
        { key: 'cidr', label: 'IP / CIDR', required: true },
        { key: 'reason', label: 'Reason' },
      ]}
      createFn={async (body) => {
        const { data } = await apiClient.post('/ip-block', body);
        return data;
      }}
    />
  );
}

export function ObservabilityLogsPage() {
  return (
    <ApiResourceScreen
      title="System logs"
      description="Observability and audit log entries."
      icon="list-outline"
      queryKey={['observability', 'logs']}
      queryFn={async (params) => {
        const { data } = await apiClient.get('/observability/logs', { params });
        return data;
      }}
      columnIds={['name', 'level', 'message', 'createdAt']}
    />
  );
}
