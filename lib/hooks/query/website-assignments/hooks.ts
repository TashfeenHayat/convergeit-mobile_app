import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getWebsiteAssignmentDetail,
  getDepartmentRosterHrmsContext,
  getDepartmentRosterCoverage,
  listWebsitesForUser,
  listWebsitesInScope,
  putDepartmentRoster,
  putDepartmentRosterCoverage,
  putWebsiteAssignmentSlot,
  removeWebsiteSlotAssignment,
} from "@/api/website-assignments";
import type {
  AssignWebsiteTierBody,
  PutDepartmentRosterBody,
} from "@/api/types/website-assignments.types";
import type { PutDepartmentRosterCoverageBody } from "@/api/types/roster-coverage.types";
import type { JsonRecord } from "@/api/types/common.types";
import type { ServiceChannel } from "@/api/types/website-assignments.types";
import { useAuth } from "@/lib/auth";
import { buildWebsiteAssignmentsScopeParams } from "@/lib/companies/reseller-list-filter";
import { websiteAssignmentsKeys } from "./keys";

export type WebsiteAssignmentsWebsitesParams = {
  /** When true, disables paging and returns up to safe max rows (dropdowns). */
  all?: boolean;
  page?: number;
  limit?: number;
  /** Filter by assignment state: true = at least one agent, false = none, omit = all. */
  assigned?: boolean;
  resellerId?: string;
  parentCompanyId?: string;
  childCompanyId?: string;
  userId?: string;
  search?: string;
  serviceSchedulingConfigured?: boolean;
  serviceHoursConfigured?: boolean;
  visitorTopicsConfigured?: boolean;
  fullyAssigned?: boolean;
};

export function useWebsiteAssignmentsWebsitesQuery(
  params?: WebsiteAssignmentsWebsitesParams,
  options?: { enabled?: boolean; /** Only platform admins may pass `resellerId`. */ allowResellerIdFilter?: boolean },
) {
  const { user } = useAuth();
  const scopedParams = buildWebsiteAssignmentsScopeParams(params, user);
  return useQuery({
    queryKey: websiteAssignmentsKeys.websites(scopedParams),
    queryFn: () => listWebsitesInScope(scopedParams),
    enabled: options?.enabled ?? true,
  });
}

export type WebsiteAssignmentsUserWebsitesParams = {
  page?: number;
  limit?: number;
  search?: string;
  assigned?: boolean;
};

export function useWebsiteAssignmentDetailQuery(
  websiteId: string | undefined,
  options?: { enabled?: boolean },
) {
  const id = websiteId?.trim() ?? "";
  return useQuery({
    queryKey: websiteAssignmentsKeys.website(id),
    queryFn: () => getWebsiteAssignmentDetail(id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}

export function useWebsiteAssignmentsUserWebsitesQuery(
  userId: string | undefined,
  params?: WebsiteAssignmentsUserWebsitesParams,
  options?: { enabled?: boolean },
) {
  const id = userId?.trim() ?? "";
  const req = params as JsonRecord | undefined;
  return useQuery({
    queryKey: websiteAssignmentsKeys.userWebsites(id, req),
    queryFn: () => listWebsitesForUser(id, req),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}

export function useAssignWebsiteTierMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignWebsiteTierBody) => putWebsiteAssignmentSlot(body),
    onSuccess: (_data, body) => {
      void queryClient.invalidateQueries({ queryKey: websiteAssignmentsKeys.all });
      void queryClient.invalidateQueries({
        queryKey: websiteAssignmentsKeys.website(body.websiteId),
      });
    },
  });
}

export function usePutDepartmentRosterMutation(websiteId: string) {
  const queryClient = useQueryClient();
  const wid = websiteId.trim();
  return useMutation({
    mutationFn: (args: { departmentId: string; body: PutDepartmentRosterBody }) =>
      putDepartmentRoster(wid, args.departmentId, args.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: websiteAssignmentsKeys.all });
      if (wid) {
        void queryClient.invalidateQueries({
          queryKey: websiteAssignmentsKeys.website(wid),
        });
      }
    },
  });
}

export function useRemoveWebsiteSlotMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      websiteId: string;
      departmentId: string;
      serviceChannel: AssignWebsiteTierBody["serviceChannel"];
      assignmentType: AssignWebsiteTierBody["assignmentType"];
    }) =>
      removeWebsiteSlotAssignment(
        args.websiteId,
        args.departmentId,
        args.serviceChannel,
        args.assignmentType,
      ),
    onSuccess: (_data, args) => {
      void queryClient.invalidateQueries({ queryKey: websiteAssignmentsKeys.all });
      void queryClient.invalidateQueries({
        queryKey: websiteAssignmentsKeys.website(args.websiteId),
      });
    },
  });
}

export function useDepartmentRosterHrmsContextQuery(
  websiteId: string | undefined,
  departmentId: string | undefined,
  channel: ServiceChannel,
  options?: { enabled?: boolean; userIds?: string },
) {
  const wid = websiteId?.trim() ?? "";
  const deptId = departmentId?.trim() ?? "";
  const params = {
    channel,
    ...(options?.userIds?.trim() ? { userIds: options.userIds.trim() } : {}),
  };
  return useQuery({
    queryKey: websiteAssignmentsKeys.rosterHrmsContext(wid, deptId, params),
    queryFn: async () => {
      const res = await getDepartmentRosterHrmsContext(wid, deptId, params);
      return res.data;
    },
    enabled:
      (options?.enabled ?? true) &&
      wid.length > 0 &&
      deptId.length > 0 &&
      channel === "Internal",
    staleTime: 60_000,
  });
}

export function useDepartmentRosterCoverageQuery(
  websiteId: string | undefined,
  departmentId: string | undefined,
  channel: ServiceChannel,
  options?: { enabled?: boolean },
) {
  const wid = websiteId?.trim() ?? "";
  const deptId = departmentId?.trim() ?? "";
  return useQuery({
    queryKey: websiteAssignmentsKeys.rosterCoverage(wid, deptId, channel),
    queryFn: async () => {
      const res = await getDepartmentRosterCoverage(wid, deptId, channel);
      return res.data;
    },
    enabled:
      (options?.enabled ?? true) && wid.length > 0 && deptId.length > 0,
    staleTime: 30_000,
  });
}

export function usePutDepartmentRosterCoverageMutation(
  websiteId: string,
  departmentId: string,
  channel: ServiceChannel,
) {
  const queryClient = useQueryClient();
  const wid = websiteId.trim();
  const deptId = departmentId.trim();
  return useMutation({
    mutationFn: (body: PutDepartmentRosterCoverageBody) =>
      putDepartmentRosterCoverage(wid, deptId, channel, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: websiteAssignmentsKeys.all });
      if (wid) {
        void queryClient.invalidateQueries({
          queryKey: websiteAssignmentsKeys.website(wid),
        });
        void queryClient.invalidateQueries({
          queryKey: websiteAssignmentsKeys.rosterCoverage(wid, deptId, channel),
        });
      }
    },
  });
}
