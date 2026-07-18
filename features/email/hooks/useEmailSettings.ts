import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deletePlatformEmailSettings,
  deletePlatformMailAssignment,
  deleteResellerOwnMailSettings,
  getPlatformEmailSettings,
  getPlatformMailAssignment,
  getResellerOwnMailSettings,
  listPlatformMailAssignments,
  listResellerOwnMailSettings,
  testPlatformEmailSettings,
  testResellerOwnMailSettings,
  updatePlatformEmailSettings,
  updatePlatformMailAssignment,
  updateResellerOwnMailSettings,
} from "../api/email-api";
import type {
  PlatformEmailSettingsBody,
  PlatformMailAssignmentBody,
  ResellerOwnMailSettingsBody,
} from "../types";
import { extractPlatformAssignmentList, extractResellerOwnMailList } from "../utils/extract-email-list";
import { mergeTestResultIntoSettings } from "../utils/email-test.utils";
import { emailKeys } from "./keys";
import type { MailProviderSettings } from "../types";

export function usePlatformEmailSettingsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: emailKeys.platformSettings(),
    queryFn: () => getPlatformEmailSettings(),
    enabled: options?.enabled ?? true,
    staleTime: 0,
  });
}

export function useUpdatePlatformEmailSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PlatformEmailSettingsBody) => updatePlatformEmailSettings(body),
    onSuccess: (data) => {
      qc.setQueryData(emailKeys.platformSettings(), data);
    },
  });
}

export function useTestPlatformEmailSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { toEmail?: string }) => testPlatformEmailSettings(body),
    onSuccess: (result) => {
      qc.setQueryData<MailProviderSettings>(emailKeys.platformSettings(), (old) =>
        old ? mergeTestResultIntoSettings(old, result) : old,
      );
      void qc.invalidateQueries({ queryKey: emailKeys.platformSettings() });
    },
  });
}

export function useDeletePlatformEmailSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deletePlatformEmailSettings(),
    onSuccess: () => {
      void qc.removeQueries({ queryKey: emailKeys.platformSettings() });
    },
  });
}

export function useResellerOwnMailListQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: emailKeys.resellerOwnMailList(),
    queryFn: async () => {
      const data = await listResellerOwnMailSettings();
      return extractResellerOwnMailList(data);
    },
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}

export function useResellerOwnMailSettingsQuery(
  resellerId: string | null,
  options?: { enabled?: boolean },
) {
  const rid = resellerId?.trim() ?? "";
  return useQuery({
    queryKey: emailKeys.resellerOwnMail(rid),
    queryFn: () => getResellerOwnMailSettings(rid),
    enabled: Boolean(rid) && (options?.enabled ?? true),
    retry: false,
    staleTime: 0,
  });
}

export function useUpdateResellerOwnMailMutation(resellerId: string) {
  const qc = useQueryClient();
  const rid = resellerId.trim();
  return useMutation({
    mutationFn: (body: ResellerOwnMailSettingsBody) => updateResellerOwnMailSettings(rid, body),
    onSuccess: (data) => {
      qc.setQueryData(emailKeys.resellerOwnMail(rid), data);
      void qc.invalidateQueries({ queryKey: emailKeys.resellerOwnMailList() });
    },
  });
}

export function useTestResellerOwnMailMutation(resellerId: string) {
  const qc = useQueryClient();
  const rid = resellerId.trim();
  return useMutation({
    mutationFn: (body: { toEmail?: string }) => testResellerOwnMailSettings(rid, body),
    onSuccess: (result) => {
      qc.setQueryData<MailProviderSettings>(emailKeys.resellerOwnMail(rid), (old) =>
        old ? mergeTestResultIntoSettings(old, result) : old,
      );
      void qc.invalidateQueries({ queryKey: emailKeys.resellerOwnMail(rid) });
      void qc.invalidateQueries({ queryKey: emailKeys.resellerOwnMailList() });
    },
  });
}

export function useDeleteResellerOwnMailMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (resellerId: string) => deleteResellerOwnMailSettings(resellerId.trim()),
    onSuccess: (_data, resellerId) => {
      const rid = resellerId.trim();
      qc.removeQueries({ queryKey: emailKeys.resellerOwnMail(rid) });
      void qc.invalidateQueries({ queryKey: emailKeys.resellerOwnMailList() });
    },
  });
}

export function usePlatformMailAssignmentListQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: emailKeys.platformAssignmentList(),
    queryFn: async () => {
      const data = await listPlatformMailAssignments();
      return extractPlatformAssignmentList(data);
    },
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}

export function usePlatformMailAssignmentQuery(
  resellerId: string | null,
  options?: { enabled?: boolean },
) {
  const rid = resellerId?.trim() ?? "";
  return useQuery({
    queryKey: emailKeys.platformAssignment(rid),
    queryFn: () => getPlatformMailAssignment(rid),
    enabled: Boolean(rid) && (options?.enabled ?? true),
    retry: false,
  });
}

export function useUpdatePlatformMailAssignmentMutation(resellerId: string) {
  const qc = useQueryClient();
  const rid = resellerId.trim();
  return useMutation({
    mutationFn: (body: PlatformMailAssignmentBody) => updatePlatformMailAssignment(rid, body),
    onSuccess: (data) => {
      qc.setQueryData(emailKeys.platformAssignment(rid), data);
      void qc.invalidateQueries({ queryKey: emailKeys.platformAssignmentList() });
    },
  });
}

export function useDeletePlatformMailAssignmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (resellerId: string) => deletePlatformMailAssignment(resellerId.trim()),
    onSuccess: (_data, resellerId) => {
      const rid = resellerId.trim();
      qc.removeQueries({ queryKey: emailKeys.platformAssignment(rid) });
      void qc.invalidateQueries({ queryKey: emailKeys.platformAssignmentList() });
    },
  });
}
