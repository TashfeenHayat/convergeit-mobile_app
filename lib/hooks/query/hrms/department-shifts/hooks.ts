import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enableDepartmentShift, listDepartmentShifts, removeDepartmentShift } from "@/api/hrms";
import type { JsonRecord } from "@/api/types/common.types";
import {
  buildHrmsDepartmentShiftsListQueryRecord,
  type HrmsDepartmentShiftsListQueryInput,
} from "@/lib/utils/hrms";
import { hrmsDepartmentShiftsKeys } from "./keys";

/** `GET /hrms/department-shifts` — camelCase: `page`, `limit`, `all`, `departmentId`, `parentCompanyId`, `search`, `shiftScope`. */
export type HrmsDepartmentShiftsListParams = HrmsDepartmentShiftsListQueryInput;

export function useDepartmentShiftsListQuery(
  params: HrmsDepartmentShiftsListParams | undefined,
  options?: { enabled?: boolean; scope?: string },
) {
  const scope = options?.scope ?? "default";
  const enabled = options?.enabled ?? true;
  const req = buildHrmsDepartmentShiftsListQueryRecord(params) as JsonRecord | undefined;
  return useQuery({
    queryKey: [...hrmsDepartmentShiftsKeys.list(req), scope] as const,
    queryFn: () => listDepartmentShifts(req),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useEnableDepartmentShiftMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: JsonRecord) => enableDepartmentShift(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: hrmsDepartmentShiftsKeys.all });
    },
  });
}

export function useRemoveDepartmentShiftMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeDepartmentShift(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: hrmsDepartmentShiftsKeys.all });
    },
  });
}
