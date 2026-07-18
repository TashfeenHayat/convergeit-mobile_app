import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSocialMediaConnection,
  deleteSocialMediaConnection,
  listSocialMediaConnections,
  startMetaOAuth,
  type CreateSocialMediaConnectionBody,
  type SocialMediaListParams,
} from "@/api/social-media/social-media.api";
import { socialMediaKeys } from "./keys";

export function useSocialMediaConnectionsQuery(
  params: SocialMediaListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: socialMediaKeys.list(params as Record<string, unknown>),
    queryFn: () => listSocialMediaConnections(params),
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useCreateSocialMediaConnectionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSocialMediaConnectionBody) =>
      createSocialMediaConnection(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: socialMediaKeys.all });
    },
  });
}

export function useDeleteSocialMediaConnectionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSocialMediaConnection(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: socialMediaKeys.all });
    },
  });
}

export function useStartMetaOAuthMutation() {
  return useMutation({
    mutationFn: startMetaOAuth,
  });
}
