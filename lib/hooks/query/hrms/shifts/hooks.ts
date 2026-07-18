import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { createShiftTemplate, deleteShiftTemplate, getShiftTemplate, listShiftTemplates, updateShiftTemplate } from "@/api/hrms";
import type { JsonRecord } from "@/api/types/common.types";
import { buildHrmsShiftsListQueryRecord, type HrmsShiftsListQueryInput } from "@/lib/utils/hrms";
import { hrmsShiftsKeys } from "./keys";

/**
 * `GET /hrms/shifts` — camelCase query: `page`, `limit`, `all`, `parentCompanyId`, `search`, `shiftScope`.
 * `shiftScope`: `internal` | `external` | `all` — server-side catalog slice; JWT resolves allowed rows.
 */
export type HrmsShiftsListParams = HrmsShiftsListQueryInput;

async function refetchShiftLists(qc: QueryClient) {
  await qc.refetchQueries({ queryKey: hrmsShiftsKeys.all, type: "active" });
}

/** Refetch one list query (exact key) — use after create when filters/page change synchronously. */
export async function refetchShiftsListQuery(
  qc: QueryClient,
  params: HrmsShiftsListParams | undefined,
  scope = "default",
) {
  const req = buildHrmsShiftsListQueryRecord(params) as JsonRecord | undefined;
  await qc.refetchQueries({
    queryKey: [...hrmsShiftsKeys.list(req), scope] as const,
    exact: true,
    type: "active",
  });
}

export function useShiftsListQuery(params: HrmsShiftsListParams | undefined, options?: { enabled?: boolean; scope?: string }) {
  const scope = options?.scope ?? "default";
  const enabled = options?.enabled ?? true;
  const req = buildHrmsShiftsListQueryRecord(params) as JsonRecord | undefined;
  return useQuery({
    queryKey: [...hrmsShiftsKeys.list(req), scope] as const,
    queryFn: () => listShiftTemplates(req),
    enabled,
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
}
export function useShiftQuery(id: string | undefined, options?: { enabled?: boolean; scope?: string }) {
  const trimmed = id?.trim() ?? "";
  const scope = options?.scope ?? "default";
  const enabled = (options?.enabled ?? true) && trimmed.length > 0;
  return useQuery({
    queryKey: [...hrmsShiftsKeys.detail(trimmed), scope] as const,
    queryFn: () => getShiftTemplate(trimmed),
    enabled,
  });
}

export function useCreateShiftMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: JsonRecord) => createShiftTemplate(body),
    onSuccess: async () => {
      await refetchShiftLists(qc);
    },
  });
}

export function useUpdateShiftMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body: JsonRecord }) => updateShiftTemplate(vars.id, vars.body),
    onSuccess: async (_data, vars) => {
      await refetchShiftLists(qc);
      void qc.invalidateQueries({ queryKey: hrmsShiftsKeys.detail(vars.id) });
    },
  });
}

export function useDeleteShiftMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteShiftTemplate(id),
    onSuccess: async () => {
      await refetchShiftLists(qc);
    },
  });
}

