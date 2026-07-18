import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type {
  ServiceSchedulingBundle,
  UpsertServiceSchedulingBody,
  UpsertVisitorTopicsBody,
  VisitorTopicsBundle,
} from "@/services/chat/service-scheduling.types";
import {
  deleteServiceScheduling,
  fetchServiceScheduling,
  fetchVisitorTopics,
  saveServiceScheduling,
  saveVisitorTopics,
} from "@/services/chat/service-scheduling.api";
import { chatSettingsKeys } from "./keys";

export function serviceSchedulingQueryKey(websiteId: string) {
  return [...chatSettingsKeys.website(websiteId), "service-scheduling"] as const;
}

export function visitorTopicsQueryKey(websiteId: string) {
  return [...chatSettingsKeys.website(websiteId), "visitor-topics"] as const;
}

export function useServiceSchedulingQuery(
  websiteId: string,
  apiEnabled = true,
  options?: Pick<
    UseQueryOptions<ServiceSchedulingBundle>,
    "refetchOnMount" | "staleTime"
  >,
) {
  const id = websiteId.trim();
  return useQuery({
    queryKey: serviceSchedulingQueryKey(id),
    queryFn: () => fetchServiceScheduling(id),
    enabled: apiEnabled && id.length > 0,
    refetchOnMount: options?.refetchOnMount ?? true,
    staleTime: options?.staleTime ?? 0,
  });
}

export function useVisitorTopicsQuery(
  websiteId: string,
  apiEnabled = true,
  options?: Pick<UseQueryOptions<VisitorTopicsBundle>, "refetchOnMount" | "staleTime">,
) {
  const id = websiteId.trim();
  return useQuery({
    queryKey: visitorTopicsQueryKey(id),
    queryFn: () => fetchVisitorTopics(id),
    enabled: apiEnabled && id.length > 0,
    refetchOnMount: options?.refetchOnMount ?? true,
    staleTime: options?.staleTime ?? 0,
  });
}

export function useSaveServiceSchedulingMutation(websiteId: string) {
  const id = websiteId.trim();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertServiceSchedulingBody) => saveServiceScheduling(id, body),
    onSuccess: (data) => {
      queryClient.setQueryData(serviceSchedulingQueryKey(id), data);
      void queryClient.invalidateQueries({ queryKey: ["website-assignments"] });
    },
  });
}

export function useSaveVisitorTopicsMutation(websiteId: string) {
  const id = websiteId.trim();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertVisitorTopicsBody) => saveVisitorTopics(id, body),
    onSuccess: (data) => {
      queryClient.setQueryData(visitorTopicsQueryKey(id), data);
      void queryClient.invalidateQueries({ queryKey: ["website-assignments"] });
    },
  });
}

export function useDeleteServiceSchedulingMutation(websiteId: string) {
  const id = websiteId.trim();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteServiceScheduling(id),
    onSuccess: (data) => {
      queryClient.setQueryData(serviceSchedulingQueryKey(id), data);
      queryClient.setQueryData(visitorTopicsQueryKey(id), {
        websiteId: id,
        parentCompanyId: data.parentCompanyId,
        topics: [],
      } satisfies VisitorTopicsBundle);
      void queryClient.invalidateQueries({ queryKey: ["website-assignments"] });
    },
  });
}
