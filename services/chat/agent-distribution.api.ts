import { apiClient } from "@/api";
import { unwrapChatHttpData } from "./http";

export type AgentDistributionFormField = {
  fieldKey: string;
  label: string;
  fieldType: string;
  isRequired: boolean;
  enabled: boolean;
  sortOrder: number;
  readOnly: boolean;
};

export type AgentDistributionDepartment = {
  id: string;
  name: string;
  recipientCount: number;
};

export type AgentDistributionFormPayload = {
  conversationId: string;
  websiteId: string;
  distributionSetupId: string;
  method: string;
  subject: string;
  fields: AgentDistributionFormField[];
  prefilledValues: Record<string, string>;
  departments: AgentDistributionDepartment[];
  submitted: boolean;
  submission: Record<string, unknown> | null;
};

export type SubmitAgentDistributionBody = {
  distributionDepartmentId: string;
  formValues?: Record<string, string>;
  subject?: string;
};

export async function fetchAgentDistributionForm(
  conversationId: string,
): Promise<AgentDistributionFormPayload> {
  const { data } = await apiClient.get(
    `/chat/agent/conversations/${encodeURIComponent(conversationId)}/distribution-form`,
  );
  return unwrapChatHttpData<AgentDistributionFormPayload>(data);
}

export async function submitAgentDistribution(
  conversationId: string,
  body: SubmitAgentDistributionBody,
): Promise<{ conversationId: string; submission: Record<string, unknown> }> {
  const { data } = await apiClient.post(
    `/chat/agent/conversations/${encodeURIComponent(conversationId)}/distribution-submit`,
    body,
  );
  return unwrapChatHttpData(data);
}
