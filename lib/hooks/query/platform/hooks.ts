import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  generatePlatformLicenseKey,
  listPlatformLicenseKeys,
  sendPlatformLicenseKey,
  type SendPlatformLicenseKeyBody,
} from "@/api/platform";
import type { JsonRecord } from "@/api/types/common.types";
import { platformKeys } from "./keys";

export function usePlatformLicenseKeysQuery(
  params?: JsonRecord,
  options?: { enabled?: boolean; scope?: string },
) {
  const scope = options?.scope ?? "default";
  return useQuery({
    queryKey: [...platformKeys.licenseKeys(params), scope] as const,
    queryFn: () => listPlatformLicenseKeys(params),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

export function useGeneratePlatformLicenseKeyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: JsonRecord) => generatePlatformLicenseKey(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformKeys.licenseKeysRoot() });
    },
  });
}

export function useSendPlatformLicenseKeyMutation() {
  return useMutation({
    mutationFn: (body: SendPlatformLicenseKeyBody) => sendPlatformLicenseKey(body),
  });
}

