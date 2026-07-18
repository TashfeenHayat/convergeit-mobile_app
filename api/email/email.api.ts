import { apiClient } from "../http/axios-instance";
import { appendUploadableFile, type UploadableFile } from "@/lib/files";
import type {
  EmailPreviewData,
  EmailProvider,
  EmailProviderFormSchema,
  EmailTemplateAssignment,
  EmailTemplateDraft,
  EmailTemplateDraftBody,
  EmailTemplateVersionRestoreResult,
  EmailTemplateVersionRow,
  EmailTestBody,
  EmailTestResult,
  PlatformEmailSettings,
  PlatformEmailSettingsBody,
  PlatformMailAssignment,
  PlatformMailAssignmentBody,
  PlatformMailAssignmentListItem,
  PlatformAgentFeedbackSettings,
  PlatformAgentFeedbackSettingsBody,
  DistributionFeedbackSubmissionList,
  ResellerOwnMailListItem,
  ResellerOwnMailSettings,
  ResellerOwnMailSettingsBody,
} from "../types/email.types";
import { buildEmailTestRequestBody } from "./build-email-test-body";
import { unwrapApiData } from "./unwrap-api-data";
import { normalizeEmailTestResult } from "./normalize-email-test-result";
import { normalizeMailProviderSettings } from "./normalize-mail-settings";
import {
  normalizePlatformMailAssignment,
} from "./normalize-platform-mail-assignment";

export async function listEmailProviders(): Promise<EmailProvider[]> {
  const { data } = await apiClient.get("/email/providers");
  return unwrapApiData<EmailProvider[]>(data);
}

export async function getEmailProviderFormSchema(providerId: string): Promise<EmailProviderFormSchema> {
  const { data } = await apiClient.get(
    `/email/providers/${encodeURIComponent(providerId)}/form-schema`,
  );
  return unwrapApiData<EmailProviderFormSchema>(data);
}

// —— Platform mail ——
export async function getPlatformEmailSettings(): Promise<PlatformEmailSettings> {
  const { data } = await apiClient.get("/platform/email-settings");
  return normalizeMailProviderSettings(unwrapApiData<unknown>(data));
}

export async function updatePlatformEmailSettings(body: PlatformEmailSettingsBody): Promise<PlatformEmailSettings> {
  const { data } = await apiClient.put("/platform/email-settings", body);
  return normalizeMailProviderSettings(unwrapApiData<unknown>(data));
}

export async function testPlatformEmailSettings(body: EmailTestBody = {}): Promise<EmailTestResult> {
  const { data } = await apiClient.post(
    "/platform/email-settings/test",
    buildEmailTestRequestBody(body.toEmail),
  );
  return normalizeEmailTestResult(unwrapApiData<unknown>(data));
}

export async function deletePlatformEmailSettings(): Promise<void> {
  await apiClient.delete("/platform/email-settings");
}

// —— Reseller own mail ——
export async function listResellerOwnMailSettings(): Promise<ResellerOwnMailListItem[]> {
  const { data } = await apiClient.get("/email/reseller-mail-settings");
  return unwrapApiData<ResellerOwnMailListItem[]>(data);
}

export async function getResellerOwnMailSettings(resellerId: string): Promise<ResellerOwnMailSettings> {
  const { data } = await apiClient.get(
    `/resellers/${encodeURIComponent(resellerId)}/email-settings`,
  );
  return normalizeMailProviderSettings(unwrapApiData<unknown>(data));
}

export async function updateResellerOwnMailSettings(
  resellerId: string,
  body: ResellerOwnMailSettingsBody,
): Promise<ResellerOwnMailSettings> {
  const { data } = await apiClient.put(
    `/resellers/${encodeURIComponent(resellerId)}/email-settings`,
    body,
  );
  return normalizeMailProviderSettings(unwrapApiData<unknown>(data));
}

export async function testResellerOwnMailSettings(
  resellerId: string,
  body: EmailTestBody = {},
): Promise<EmailTestResult> {
  const { data } = await apiClient.post(
    `/resellers/${encodeURIComponent(resellerId)}/email-settings/test`,
    buildEmailTestRequestBody(body.toEmail),
  );
  return normalizeEmailTestResult(unwrapApiData<unknown>(data));
}

export async function deleteResellerOwnMailSettings(resellerId: string): Promise<void> {
  await apiClient.delete(`/resellers/${encodeURIComponent(resellerId)}/email-settings`);
}

// —— Platform mail assignment ——
export async function listPlatformMailAssignments(): Promise<unknown> {
  const { data } = await apiClient.get("/email/platform-mail-assignments");
  return unwrapApiData<unknown>(data);
}

export async function getPlatformMailAssignment(resellerId: string): Promise<PlatformMailAssignment> {
  const { data } = await apiClient.get(
    `/resellers/${encodeURIComponent(resellerId)}/platform-mail-assignment`,
  );
  return normalizePlatformMailAssignment(unwrapApiData<unknown>(data));
}

export async function updatePlatformMailAssignment(
  resellerId: string,
  body: PlatformMailAssignmentBody,
): Promise<PlatformMailAssignment> {
  const { data } = await apiClient.put(
    `/resellers/${encodeURIComponent(resellerId)}/platform-mail-assignment`,
    body,
  );
  return normalizePlatformMailAssignment(unwrapApiData<unknown>(data));
}

export async function deletePlatformMailAssignment(resellerId: string): Promise<void> {
  await apiClient.delete(
    `/resellers/${encodeURIComponent(resellerId)}/platform-mail-assignment`,
  );
}

// —— Templates & branding ——
export async function getResellerEmailTemplatePublished(resellerId: string): Promise<EmailTemplateDraft> {
  const { data } = await apiClient.get(
    `/resellers/${encodeURIComponent(resellerId)}/email-templates/published`,
  );
  return unwrapApiData<EmailTemplateDraft>(data);
}

export async function getResellerEmailTemplateDraft(resellerId: string): Promise<EmailTemplateDraft> {
  const { data } = await apiClient.get(
    `/resellers/${encodeURIComponent(resellerId)}/email-templates/draft`,
  );
  return unwrapApiData<EmailTemplateDraft>(data);
}

export async function updateResellerEmailTemplateDraft(
  resellerId: string,
  body: EmailTemplateDraftBody,
): Promise<EmailTemplateDraft> {
  const { data } = await apiClient.put(
    `/resellers/${encodeURIComponent(resellerId)}/email-templates/draft`,
    body,
  );
  return unwrapApiData<EmailTemplateDraft>(data);
}

export async function publishResellerEmailTemplateDraft(resellerId: string): Promise<EmailTemplateDraft> {
  const { data } = await apiClient.post(
    `/resellers/${encodeURIComponent(resellerId)}/email-templates/draft/publish`,
  );
  return unwrapApiData<EmailTemplateDraft>(data);
}

export async function getResellerEmailTemplateDraftPreview(resellerId: string): Promise<EmailPreviewData> {
  const { data } = await apiClient.get(
    `/resellers/${encodeURIComponent(resellerId)}/email-templates/draft/preview`,
  );
  return unwrapApiData<EmailPreviewData>(data);
}

export async function getResellerEmailTemplatePublishedPreview(
  resellerId: string,
): Promise<EmailPreviewData> {
  const { data } = await apiClient.get(
    `/resellers/${encodeURIComponent(resellerId)}/email-templates/published/preview`,
  );
  return unwrapApiData<EmailPreviewData>(data);
}

export async function getResellerEmailTemplateAssignment(
  resellerId: string,
): Promise<EmailTemplateAssignment> {
  const { data } = await apiClient.get(
    `/resellers/${encodeURIComponent(resellerId)}/email-templates/assignment`,
  );
  return unwrapApiData<EmailTemplateAssignment>(data);
}

export async function usePlatformEmailTemplate(resellerId: string): Promise<EmailTemplateAssignment> {
  const { data } = await apiClient.post(
    `/resellers/${encodeURIComponent(resellerId)}/email-templates/use-platform`,
  );
  return unwrapApiData<EmailTemplateAssignment>(data);
}

export async function uploadResellerEmailLogo(
  resellerId: string,
  file: UploadableFile,
): Promise<{ logoUrl: string; storageKey: string }> {
  const form = new FormData();
  appendUploadableFile(form, "file", file);
  const { data } = await apiClient.post(
    `/resellers/${encodeURIComponent(resellerId)}/email-branding/logo`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return unwrapApiData<{ logoUrl: string; storageKey: string }>(data);
}

export async function deleteResellerEmailLogo(resellerId: string): Promise<{ removed: boolean }> {
  const { data } = await apiClient.delete(
    `/resellers/${encodeURIComponent(resellerId)}/email-branding/logo`,
  );
  return unwrapApiData<{ removed: boolean }>(data);
}

export async function uploadResellerEmailBanner(
  resellerId: string,
  file: UploadableFile,
): Promise<{ bannerUrl: string; storageKey: string }> {
  const form = new FormData();
  appendUploadableFile(form, "file", file);
  const { data } = await apiClient.post(
    `/resellers/${encodeURIComponent(resellerId)}/email-branding/banner`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return unwrapApiData<{ bannerUrl: string; storageKey: string }>(data);
}

export async function deleteResellerEmailBanner(resellerId: string): Promise<{ removed: boolean }> {
  const { data } = await apiClient.delete(
    `/resellers/${encodeURIComponent(resellerId)}/email-branding/banner`,
  );
  return unwrapApiData<{ removed: boolean }>(data);
}

// —— Template by id (preview hub, published snapshots) ——
export async function getEmailTemplateById(templateId: string): Promise<EmailTemplateDraft> {
  const { data } = await apiClient.get(`/email-templates/${encodeURIComponent(templateId)}`);
  return unwrapApiData<EmailTemplateDraft>(data);
}

export async function getEmailTemplatePreviewById(templateId: string): Promise<EmailPreviewData> {
  const { data } = await apiClient.get(
    `/email-templates/${encodeURIComponent(templateId)}/preview`,
  );
  return unwrapApiData<EmailPreviewData>(data);
}

export async function updateEmailTemplateById(
  templateId: string,
  body: EmailTemplateDraftBody,
): Promise<EmailTemplateDraft> {
  const { data } = await apiClient.put(`/email-templates/${encodeURIComponent(templateId)}`, body);
  return unwrapApiData<EmailTemplateDraft>(data);
}

// —— Platform templates ——
export async function getPlatformEmailTemplateDraft(): Promise<EmailTemplateDraft | null> {
  const { data } = await apiClient.get("/platform/email-templates/draft");
  return unwrapApiData<EmailTemplateDraft | null>(data);
}

export async function getPlatformEmailTemplatePublished(): Promise<EmailTemplateDraft | null> {
  const { data } = await apiClient.get("/platform/email-templates/published");
  return unwrapApiData<EmailTemplateDraft | null>(data);
}

export async function updatePlatformEmailTemplateDraft(
  body: EmailTemplateDraftBody,
): Promise<EmailTemplateDraft> {
  const { data } = await apiClient.put("/platform/email-templates/draft", body);
  return unwrapApiData<EmailTemplateDraft>(data);
}

export async function publishPlatformEmailTemplateDraft(): Promise<EmailTemplateDraft> {
  const { data } = await apiClient.post("/platform/email-templates/draft/publish");
  return unwrapApiData<EmailTemplateDraft>(data);
}

export async function getPlatformEmailTemplateDraftPreview(): Promise<EmailPreviewData> {
  const { data } = await apiClient.get("/platform/email-templates/draft/preview");
  return unwrapApiData<EmailPreviewData>(data);
}

export async function getPlatformEmailTemplatePublishedPreview(): Promise<EmailPreviewData> {
  const { data } = await apiClient.get("/platform/email-templates/published/preview");
  return unwrapApiData<EmailPreviewData>(data);
}

export async function listPlatformEmailTemplateVersions(): Promise<EmailTemplateVersionRow[]> {
  const { data } = await apiClient.get("/platform/email-templates/versions");
  return unwrapApiData<EmailTemplateVersionRow[]>(data);
}

export async function restorePlatformEmailTemplateVersion(
  versionId: string,
): Promise<EmailTemplateVersionRestoreResult> {
  const { data } = await apiClient.post(
    `/platform/email-templates/versions/${encodeURIComponent(versionId)}/restore`,
  );
  return unwrapApiData<EmailTemplateVersionRestoreResult>(data);
}

export async function listResellerEmailTemplateVersions(
  resellerId: string,
): Promise<EmailTemplateVersionRow[]> {
  const { data } = await apiClient.get(
    `/resellers/${encodeURIComponent(resellerId)}/email-templates/versions`,
  );
  return unwrapApiData<EmailTemplateVersionRow[]>(data);
}

export async function restoreResellerEmailTemplateVersion(
  resellerId: string,
  versionId: string,
): Promise<EmailTemplateVersionRestoreResult> {
  const { data } = await apiClient.post(
    `/resellers/${encodeURIComponent(resellerId)}/email-templates/versions/${encodeURIComponent(versionId)}/restore`,
  );
  return unwrapApiData<EmailTemplateVersionRestoreResult>(data);
}

export async function uploadPlatformEmailLogo(
  file: UploadableFile,
): Promise<{ logoUrl: string; storageKey: string }> {
  const form = new FormData();
  appendUploadableFile(form, "file", file);
  const { data } = await apiClient.post("/platform/email-branding/logo", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrapApiData<{ logoUrl: string; storageKey: string }>(data);
}

export async function deletePlatformEmailLogo(): Promise<{ removed: boolean }> {
  const { data } = await apiClient.delete("/platform/email-branding/logo");
  return unwrapApiData<{ removed: boolean }>(data);
}

export async function uploadPlatformEmailBanner(
  file: UploadableFile,
): Promise<{ bannerUrl: string; storageKey: string }> {
  const form = new FormData();
  appendUploadableFile(form, "file", file);
  const { data } = await apiClient.post("/platform/email-branding/banner", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrapApiData<{ bannerUrl: string; storageKey: string }>(data);
}

export async function deletePlatformEmailBanner(): Promise<{ removed: boolean }> {
  const { data } = await apiClient.delete("/platform/email-branding/banner");
  return unwrapApiData<{ removed: boolean }>(data);
}

export type PlatformTemplateAssignmentListItem = {
  id: string;
  resellerId: string;
  resellerName: string;
  usesPlatformDefault: boolean;
  hasCustomPublished: boolean;
  updatedAt: string | null;
};

export async function listPlatformTemplateAssignments(): Promise<PlatformTemplateAssignmentListItem[]> {
  const { data } = await apiClient.get("/email/platform-template-assignments");
  const payload = unwrapApiData<{ items: PlatformTemplateAssignmentListItem[] }>(data);
  return payload.items ?? [];
}

export async function assignPlatformEmailTemplate(resellerId: string): Promise<EmailTemplateAssignment> {
  const { data } = await apiClient.put(
    `/resellers/${encodeURIComponent(resellerId)}/platform-template-assignment`,
  );
  return unwrapApiData<EmailTemplateAssignment>(data);
}

export async function removePlatformEmailTemplateAssignment(
  resellerId: string,
): Promise<EmailTemplateAssignment> {
  const { data } = await apiClient.delete(
    `/resellers/${encodeURIComponent(resellerId)}/platform-template-assignment`,
  );
  return unwrapApiData<EmailTemplateAssignment>(data);
}

export async function getPlatformAgentFeedbackSettings(): Promise<PlatformAgentFeedbackSettings> {
  const { data } = await apiClient.get("/platform/agent-feedback");
  return unwrapApiData<PlatformAgentFeedbackSettings>(data);
}

export async function updatePlatformAgentFeedbackSettings(
  body: PlatformAgentFeedbackSettingsBody,
): Promise<PlatformAgentFeedbackSettings> {
  const { data } = await apiClient.put("/platform/agent-feedback", body);
  return unwrapApiData<PlatformAgentFeedbackSettings>(data);
}

export async function listDistributionFeedbackSubmissions(params?: {
  page?: number;
  limit?: number;
  websiteId?: string;
}): Promise<DistributionFeedbackSubmissionList> {
  const { data } = await apiClient.get("/platform/agent-feedback/submissions", {
    params,
  });
  return unwrapApiData<DistributionFeedbackSubmissionList>(data);
}
