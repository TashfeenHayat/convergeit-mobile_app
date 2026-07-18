import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyPlatformTheme, patchMyPlatformTheme } from "@/api/platform-theme";
import type { PlatformThemePatchBody } from "@/api/types/platform-theme.types";
import { platformThemeKeys } from "./keys";

export function usePlatformThemeMeQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: platformThemeKeys.me(),
    queryFn: () => getMyPlatformTheme(),
    enabled: options?.enabled ?? true,
    /** Avoid refetch storms on focus / remount; theme rarely changes outside this page. */
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
  });
}

export function useUpdatePlatformThemeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PlatformThemePatchBody) => patchMyPlatformTheme(body),
    meta: { skipSuccessToast: true },
    onSuccess: (data) => {
      queryClient.setQueryData(platformThemeKeys.me(), data);
    },
  });
}
