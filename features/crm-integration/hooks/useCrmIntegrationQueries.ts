import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteCrmIntegration,
  discoverCrmFormFields,
  getCrmIntegration,
  listCrmIntegrations,
  listCrmPlatforms,
  lookupCrmIntegration,
  testCrmConnection,
  upsertCrmFieldMappings,
  upsertCrmIntegration,
  type CrmIntegrationListParams,
  type TestCrmConnectionBody,
  type UpsertCrmFieldMappingsBody,
  type UpsertCrmIntegrationBody,
} from "@/api/crm/crm-integration.api";
import { crmIntegrationKeys } from "./keys";

export function useCrmIntegrationsQuery(params: CrmIntegrationListParams, enabled = true) {
  return useQuery({
    queryKey: crmIntegrationKeys.list(params),
    queryFn: () => listCrmIntegrations(params),
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useCrmPlatformsQuery() {
  return useQuery({
    queryKey: crmIntegrationKeys.platforms(),
    queryFn: listCrmPlatforms,
  });
}

export function useCrmIntegrationLookupQuery(
  companyId: string | null,
  platformCode: string | null,
) {
  return useQuery({
    queryKey: crmIntegrationKeys.lookup(companyId ?? "", platformCode ?? ""),
    queryFn: () => lookupCrmIntegration(companyId!, platformCode!),
    enabled: Boolean(companyId?.trim() && platformCode?.trim()),
  });
}

export function useCrmIntegrationDetailQuery(integrationId: string | null) {
  return useQuery({
    queryKey: crmIntegrationKeys.detail(integrationId ?? ""),
    queryFn: () => getCrmIntegration(integrationId!),
    enabled: Boolean(integrationId?.trim()),
  });
}

export function useCrmDiscoverFieldsQuery(integrationId: string | null) {
  return useQuery({
    queryKey: crmIntegrationKeys.discoverFields(integrationId ?? ""),
    queryFn: () => discoverCrmFormFields(integrationId!),
    enabled: Boolean(integrationId?.trim()),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useUpsertCrmIntegrationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertCrmIntegrationBody) => upsertCrmIntegration(body),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: crmIntegrationKeys.all });
      void qc.invalidateQueries({
        queryKey: crmIntegrationKeys.lookup(data.companyId, data.platformCode),
      });
      void qc.invalidateQueries({ queryKey: crmIntegrationKeys.detail(data.id) });
    },
  });
}

export function useUpsertCrmFieldMappingsMutation(integrationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertCrmFieldMappingsBody) =>
      upsertCrmFieldMappings(integrationId, body),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: crmIntegrationKeys.all });
      void qc.invalidateQueries({ queryKey: crmIntegrationKeys.detail(integrationId) });
      void qc.invalidateQueries({
        queryKey: crmIntegrationKeys.lookup(data.companyId, data.platformCode),
      });
    },
  });
}

export function useTestCrmConnectionMutation() {
  return useMutation({
    mutationFn: (body: TestCrmConnectionBody) => testCrmConnection(body),
  });
}

export function useDeleteCrmIntegrationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCrmIntegration(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: crmIntegrationKeys.all });
    },
  });
}
