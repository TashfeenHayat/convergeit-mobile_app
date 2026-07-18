import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDistributionSetup,
  deleteDistributionSetup,
  getDistributionSetup,
  updateDistributionSetup,
  type UpsertDistributionSetupBody,
} from "@/api/distribution/distribution-setup.api";
import { distributionSetupKeys } from "./keys";

export function useDistributionSetupDetailQuery(setupId: string | null) {
  return useQuery({
    queryKey: distributionSetupKeys.detail(setupId ?? ""),
    queryFn: () => getDistributionSetup(setupId!),
    enabled: Boolean(setupId?.trim()),
  });
}

export function useCreateDistributionSetupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertDistributionSetupBody) => createDistributionSetup(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: distributionSetupKeys.all });
    },
  });
}

export function useUpdateDistributionSetupMutation(setupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertDistributionSetupBody) => updateDistributionSetup(setupId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: distributionSetupKeys.all });
      void qc.invalidateQueries({ queryKey: distributionSetupKeys.detail(setupId) });
    },
  });
}

export function useDeleteDistributionSetupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDistributionSetup(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: distributionSetupKeys.all });
    },
  });
}
