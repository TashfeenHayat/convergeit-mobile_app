import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createIpBlocks,
  deleteIpBlock,
  updateIpBlock,
  type CreateIpBlocksBody,
  type UpdateIpBlockBody,
} from "@/api/ip-block/ip-block.api";
import { ipBlockKeys } from "./keys";

export function useCreateIpBlocksMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateIpBlocksBody) => createIpBlocks(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ipBlockKeys.all });
    },
  });
}

export function useUpdateIpBlockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateIpBlockBody }) =>
      updateIpBlock(id, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ipBlockKeys.all });
    },
  });
}

export function useDeleteIpBlockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteIpBlock(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ipBlockKeys.all });
    },
  });
}
