import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteWebsiteSmsConfig,
  fetchWebsiteTwilioNumbers,
  getWebsiteSmsConfigByWebsite,
  listTextUsSubmissions,
  listWebsiteSmsConfigs,
  upsertWebsiteSmsConfig,
  type UpsertWebsiteSmsConfigBody,
} from "@/api/sms/sms.api";

export const smsKeys = {
  websiteDetail: (websiteId: string) => ["sms", "website", websiteId] as const,
  websiteList: (params: Record<string, unknown>) =>
    ["sms", "website-list", params] as const,
  submissions: (params: Record<string, unknown>) =>
    ["sms", "submissions", params] as const,
  twilioNumbers: (key: string) => ["sms", "twilio-numbers", key] as const,
};

export function useWebsiteSmsConfigQuery(
  websiteId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: smsKeys.websiteDetail(websiteId),
    queryFn: () => getWebsiteSmsConfigByWebsite(websiteId),
    enabled: (options?.enabled ?? true) && Boolean(websiteId),
  });
}

export function useFetchWebsiteTwilioNumbersMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fetchWebsiteTwilioNumbers,
    onSuccess: (numbers, vars) => {
      const key = vars.websiteId ?? vars.accountSid ?? "inline";
      qc.setQueryData(smsKeys.twilioNumbers(key), numbers);
    },
  });
}

export function useWebsiteTwilioNumbersQuery(
  key: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: smsKeys.twilioNumbers(key),
    queryFn: () => fetchWebsiteTwilioNumbers({ websiteId: key }),
    enabled: options?.enabled ?? false,
    staleTime: 60_000,
  });
}

export function useWebsiteSmsConfigsQuery(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    resellerId?: string;
    parentCompanyId?: string;
    childCompanyId?: string;
  },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: smsKeys.websiteList(params),
    queryFn: () => listWebsiteSmsConfigs(params),
    enabled: options?.enabled ?? true,
  });
}

export function useUpsertWebsiteSmsConfigMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertWebsiteSmsConfigBody) => upsertWebsiteSmsConfig(body),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ["sms", "website-list"] });
      void qc.invalidateQueries({ queryKey: smsKeys.websiteDetail(vars.websiteId) });
    },
  });
}

export function useDeleteWebsiteSmsConfigMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteWebsiteSmsConfig,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["sms", "website-list"] });
    },
  });
}

export function useTextUsSubmissionsQuery(
  params: { websiteId?: string; page?: number; limit?: number },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: smsKeys.submissions(params),
    queryFn: () => listTextUsSubmissions(params),
    enabled: options?.enabled ?? true,
  });
}

/** @deprecated Use useFetchWebsiteTwilioNumbersMutation */
export const useFetchTwilioNumbersMutation = useFetchWebsiteTwilioNumbersMutation;

/** @deprecated Use useWebsiteTwilioNumbersQuery */
export function useTwilioNumbersQuery(options?: { enabled?: boolean }) {
  return useWebsiteTwilioNumbersQuery("inline", options);
}

/** @deprecated Platform SMS removed — use useWebsiteSmsConfigQuery(websiteId) */
export function usePlatformSmsSettingsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["sms", "platform", "deprecated"],
    queryFn: () => Promise.resolve(null),
    enabled: false,
    ...options,
  });
}

/** @deprecated Platform SMS removed — use useUpsertWebsiteSmsConfigMutation */
export function useUpdatePlatformSmsSettingsMutation() {
  return useMutation({
    mutationFn: async () => {
      throw new Error(
        "Platform Twilio was removed. Configure Twilio per website instead.",
      );
    },
  });
}
