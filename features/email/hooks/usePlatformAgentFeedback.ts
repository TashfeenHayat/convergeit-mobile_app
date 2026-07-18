import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PlatformAgentFeedbackSettingsBody } from "@/api/types/email.types";
import {
  getPlatformAgentFeedbackSettings,
  listDistributionFeedbackSubmissions,
  updatePlatformAgentFeedbackSettings,
} from "../api/email-api";
import { emailKeys } from "./keys";

export function usePlatformAgentFeedbackQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: emailKeys.platformAgentFeedback(),
    queryFn: () => getPlatformAgentFeedbackSettings(),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}

export function useUpdatePlatformAgentFeedbackMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PlatformAgentFeedbackSettingsBody) =>
      updatePlatformAgentFeedbackSettings(body),
    onSuccess: (data) => {
      qc.setQueryData(emailKeys.platformAgentFeedback(), data);
      void qc.invalidateQueries({ queryKey: [...emailKeys.all, "distribution-feedback-submissions"] });
    },
  });
}

export function useDistributionFeedbackSubmissionsQuery(
  page = 1,
  limit = 25,
  websiteId?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: emailKeys.distributionFeedbackSubmissions(page, limit, websiteId),
    queryFn: () => listDistributionFeedbackSubmissions({ page, limit, websiteId }),
    enabled: options?.enabled ?? true,
  });
}
