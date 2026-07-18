import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteResellerEmailBanner,
  deleteResellerEmailLogo,
  deletePlatformEmailBanner,
  deletePlatformEmailLogo,
  getEmailTemplateById,
  getEmailTemplatePreviewById,
  getPlatformEmailTemplateDraft,
  getPlatformEmailTemplateDraftPreview,
  getPlatformEmailTemplatePublished,
  getPlatformEmailTemplatePublishedPreview,
  getResellerEmailTemplateDraft,
  getResellerEmailTemplateDraftPreview,
  getResellerEmailTemplatePublished,
  getResellerEmailTemplatePublishedPreview,
  getResellerEmailTemplateAssignment,
  publishPlatformEmailTemplateDraft,
  publishResellerEmailTemplateDraft,
  updateEmailTemplateById,
  updatePlatformEmailTemplateDraft,
  usePlatformEmailTemplate,
  updateResellerEmailTemplateDraft,
  uploadPlatformEmailBanner,
  uploadPlatformEmailLogo,
  uploadResellerEmailBanner,
  uploadResellerEmailLogo,
  listPlatformEmailTemplateVersions,
  restorePlatformEmailTemplateVersion,
  listResellerEmailTemplateVersions,
  restoreResellerEmailTemplateVersion,
  listPlatformTemplateAssignments,
  assignPlatformEmailTemplate,
  removePlatformEmailTemplateAssignment,
} from "@/api/email/email.api";
import type { UploadableFile } from "@/lib/files";
import type { EmailTemplateDraftBody } from "../types";
import { emailKeys } from "./keys";

export function useEmailTemplateDraftQuery(resellerId: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: emailKeys.templateDraft(resellerId ?? ""),
    queryFn: () => getResellerEmailTemplateDraft(resellerId!),
    enabled: Boolean(resellerId?.trim()) && (options?.enabled ?? true),
  });
}

export function useUpdateEmailTemplateDraftMutation(resellerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: EmailTemplateDraftBody) => updateResellerEmailTemplateDraft(resellerId, body),
    onSuccess: (data) => {
      qc.setQueryData(emailKeys.templateDraft(resellerId), data);
      void qc.invalidateQueries({ queryKey: emailKeys.templateDraftPreview(resellerId) });
      void qc.invalidateQueries({ queryKey: emailKeys.templateAssignment(resellerId) });
      void qc.invalidateQueries({ queryKey: emailKeys.resellerTemplateVersions(resellerId) });
    },
  });
}

export function usePublishEmailTemplateMutation(resellerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => publishResellerEmailTemplateDraft(resellerId),
    onSuccess: (data) => {
      qc.setQueryData(emailKeys.templatePublished(resellerId), data);
      void qc.invalidateQueries({ queryKey: emailKeys.templateDraft(resellerId) });
      void qc.invalidateQueries({ queryKey: emailKeys.templatePublishedPreview(resellerId) });
      void qc.invalidateQueries({ queryKey: emailKeys.templateAssignment(resellerId) });
      void qc.invalidateQueries({ queryKey: emailKeys.resellerTemplateVersions(resellerId) });
    },
  });
}

export function useEmailTemplateAssignmentQuery(
  resellerId: string | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: emailKeys.templateAssignment(resellerId ?? ""),
    queryFn: () => getResellerEmailTemplateAssignment(resellerId!),
    enabled: Boolean(resellerId?.trim()) && (options?.enabled ?? true),
  });
}

export function useUsePlatformEmailTemplateMutation(resellerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => usePlatformEmailTemplate(resellerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: emailKeys.templateAssignment(resellerId) });
      void qc.invalidateQueries({ queryKey: emailKeys.templatePublished(resellerId) });
      void qc.invalidateQueries({ queryKey: emailKeys.templatePublishedPreview(resellerId) });
    },
  });
}

export function useEmailTemplatePublishedQuery(resellerId: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: emailKeys.templatePublished(resellerId ?? ""),
    queryFn: () => getResellerEmailTemplatePublished(resellerId!),
    enabled: Boolean(resellerId?.trim()) && (options?.enabled ?? true),
    retry: false,
  });
}

export function useEmailTemplateDraftPreviewQuery(resellerId: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: emailKeys.templateDraftPreview(resellerId ?? ""),
    queryFn: () => getResellerEmailTemplateDraftPreview(resellerId!),
    enabled: Boolean(resellerId?.trim()) && (options?.enabled ?? true),
  });
}

export function useEmailTemplatePublishedPreviewQuery(resellerId: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: emailKeys.templatePublishedPreview(resellerId ?? ""),
    queryFn: () => getResellerEmailTemplatePublishedPreview(resellerId!),
    enabled: Boolean(resellerId?.trim()) && (options?.enabled ?? true),
  });
}

export function useUploadEmailLogoMutation(resellerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: UploadableFile) => uploadResellerEmailLogo(resellerId, file),
    meta: { skipSuccessToast: true },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: emailKeys.templateDraft(resellerId) });
      void qc.invalidateQueries({ queryKey: emailKeys.templateDraftPreview(resellerId) });
    },
  });
}

export function useDeleteEmailLogoMutation(resellerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteResellerEmailLogo(resellerId),
    meta: { skipSuccessToast: true },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: emailKeys.templateDraft(resellerId) });
      void qc.invalidateQueries({ queryKey: emailKeys.templateDraftPreview(resellerId) });
    },
  });
}

export function useUploadEmailBannerMutation(resellerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: UploadableFile) => uploadResellerEmailBanner(resellerId, file),
    meta: { skipSuccessToast: true },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: emailKeys.templateDraft(resellerId) });
      void qc.invalidateQueries({ queryKey: emailKeys.templateDraftPreview(resellerId) });
    },
  });
}

export function useDeleteEmailBannerMutation(resellerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteResellerEmailBanner(resellerId),
    meta: { skipSuccessToast: true },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: emailKeys.templateDraft(resellerId) });
      void qc.invalidateQueries({ queryKey: emailKeys.templateDraftPreview(resellerId) });
    },
  });
}

export function useEmailTemplateByIdQuery(templateId: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: emailKeys.templateById(templateId ?? ""),
    queryFn: () => getEmailTemplateById(templateId!),
    enabled: Boolean(templateId?.trim()) && (options?.enabled ?? true),
  });
}

export function useEmailTemplatePreviewByIdQuery(
  templateId: string | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: emailKeys.templatePreviewById(templateId ?? ""),
    queryFn: () => getEmailTemplatePreviewById(templateId!),
    enabled: Boolean(templateId?.trim()) && (options?.enabled ?? true),
  });
}

export function useUpdateEmailTemplateByIdMutation(templateId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: EmailTemplateDraftBody) => updateEmailTemplateById(templateId, body),
    onSuccess: (data) => {
      qc.setQueryData(emailKeys.templateById(templateId), data);
      void qc.invalidateQueries({ queryKey: emailKeys.templatePreviewById(templateId) });
    },
  });
}

export function usePlatformEmailTemplateDraftQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: emailKeys.platformTemplateDraft(),
    queryFn: () => getPlatformEmailTemplateDraft(),
    enabled: options?.enabled ?? true,
  });
}

export function usePlatformEmailTemplatePublishedQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: emailKeys.platformTemplatePublished(),
    queryFn: () => getPlatformEmailTemplatePublished(),
    enabled: options?.enabled ?? true,
    retry: false,
  });
}

export function useUpdatePlatformEmailTemplateDraftMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: EmailTemplateDraftBody) => updatePlatformEmailTemplateDraft(body),
    onSuccess: (data) => {
      if (data) qc.setQueryData(emailKeys.platformTemplateDraft(), data);
      void qc.invalidateQueries({ queryKey: emailKeys.platformTemplateDraftPreview() });
    },
  });
}

export function usePublishPlatformEmailTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => publishPlatformEmailTemplateDraft(),
    onSuccess: (data) => {
      qc.setQueryData(emailKeys.platformTemplatePublished(), data);
      void qc.invalidateQueries({ queryKey: emailKeys.platformTemplateDraft() });
      void qc.invalidateQueries({ queryKey: emailKeys.platformTemplatePublishedPreview() });
      void qc.invalidateQueries({ queryKey: emailKeys.platformTemplateVersions() });
      void qc.invalidateQueries({ queryKey: ["email", "design-catalog"] });
    },
  });
}

export function usePlatformEmailTemplateDraftPreviewQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: emailKeys.platformTemplateDraftPreview(),
    queryFn: () => getPlatformEmailTemplateDraftPreview(),
    enabled: options?.enabled ?? true,
  });
}

export function usePlatformEmailTemplatePublishedPreviewQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: emailKeys.platformTemplatePublishedPreview(),
    queryFn: () => getPlatformEmailTemplatePublishedPreview(),
    enabled: options?.enabled ?? true,
  });
}

export function useUploadPlatformEmailLogoMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: UploadableFile) => uploadPlatformEmailLogo(file),
    meta: { skipSuccessToast: true },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: emailKeys.platformTemplateDraft() });
    },
  });
}

export function useDeletePlatformEmailLogoMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deletePlatformEmailLogo(),
    meta: { skipSuccessToast: true },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: emailKeys.platformTemplateDraft() });
    },
  });
}

export function useUploadPlatformEmailBannerMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: UploadableFile) => uploadPlatformEmailBanner(file),
    meta: { skipSuccessToast: true },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: emailKeys.platformTemplateDraft() });
    },
  });
}

export function useDeletePlatformEmailBannerMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deletePlatformEmailBanner(),
    meta: { skipSuccessToast: true },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: emailKeys.platformTemplateDraft() });
    },
  });
}

export function usePlatformTemplateAssignmentListQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: emailKeys.platformTemplateAssignmentList(),
    queryFn: () => listPlatformTemplateAssignments(),
    enabled: options?.enabled ?? true,
  });
}

export function useAssignPlatformEmailTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (resellerId: string) => assignPlatformEmailTemplate(resellerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: emailKeys.platformTemplateAssignmentList() });
      void qc.invalidateQueries({ queryKey: ["email", "design-catalog"] });
    },
  });
}

export function useRemovePlatformEmailTemplateAssignmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (resellerId: string) => removePlatformEmailTemplateAssignment(resellerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: emailKeys.platformTemplateAssignmentList() });
      void qc.invalidateQueries({ queryKey: ["email", "design-catalog"] });
    },
  });
}

export function usePlatformEmailTemplateVersionsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: emailKeys.platformTemplateVersions(),
    queryFn: () => listPlatformEmailTemplateVersions(),
    enabled: options?.enabled ?? true,
  });
}

export function useRestorePlatformEmailTemplateVersionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) => restorePlatformEmailTemplateVersion(versionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: emailKeys.platformTemplateDraft() });
      void qc.invalidateQueries({ queryKey: emailKeys.platformTemplateVersions() });
      void qc.invalidateQueries({ queryKey: emailKeys.platformTemplateDraftPreview() });
    },
  });
}

export function useResellerEmailTemplateVersionsQuery(
  resellerId: string | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: emailKeys.resellerTemplateVersions(resellerId ?? ""),
    queryFn: () => listResellerEmailTemplateVersions(resellerId!),
    enabled: Boolean(resellerId?.trim()) && (options?.enabled ?? true),
  });
}

export function useRestoreResellerEmailTemplateVersionMutation(resellerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) =>
      restoreResellerEmailTemplateVersion(resellerId, versionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: emailKeys.templateDraft(resellerId) });
      void qc.invalidateQueries({ queryKey: emailKeys.resellerTemplateVersions(resellerId) });
      void qc.invalidateQueries({ queryKey: emailKeys.templateDraftPreview(resellerId) });
    },
  });
}
