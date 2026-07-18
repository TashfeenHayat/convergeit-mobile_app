import { useQuery } from "@tanstack/react-query";
import { getEmailProviderFormSchema, listEmailProviders } from "../api/email-api";
import { normalizeProviderSchemaFields } from "../utils/schema-fields";
import { emailKeys } from "./keys";

export function useEmailProvidersQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: emailKeys.providers(),
    queryFn: () => listEmailProviders(),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 60 * 1000,
  });
}

export function useEmailProviderSchemaQuery(providerId: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: emailKeys.providerSchema(providerId ?? ""),
    queryFn: async () => {
      const schema = await getEmailProviderFormSchema(providerId!);
      return {
        ...schema,
        fields: normalizeProviderSchemaFields(schema.fields ?? []),
      };
    },
    enabled: Boolean(providerId?.trim()) && (options?.enabled ?? true),
    staleTime: 30 * 60 * 1000,
  });
}
