import { apiClient } from "../http/axios-instance";
import type { JsonRecord } from "../types/common.types";
import type { DepartmentRosterHrmsContextEnvelope } from "../types/roster-hrms-context.types";
import type {  AssignWebsiteTierBody,
  PutDepartmentRosterBody,
  PutDepartmentRosterResponseEnvelope,
  ServiceChannel,
  WebsiteAssignmentTier,
  WebsiteAssignmentUserWebsitesEnvelope,
  WebsiteAssignmentWebsiteDetailEnvelope,
  WebsiteAssignmentsWebsitesResponseEnvelope,
} from "../types/website-assignments.types";

export async function listWebsitesInScope(
  params?: JsonRecord,
): Promise<WebsiteAssignmentsWebsitesResponseEnvelope> {
  const { data } = await apiClient.get<WebsiteAssignmentsWebsitesResponseEnvelope>(
    "/website-assignments/websites",
    {
      params,
    },
  );
  return data;
}

export async function getWebsiteAssignmentDetail(
  websiteId: string,
): Promise<WebsiteAssignmentWebsiteDetailEnvelope> {
  const { data } = await apiClient.get<WebsiteAssignmentWebsiteDetailEnvelope>(
    `/website-assignments/websites/${encodeURIComponent(websiteId)}`,
  );
  return data;
}

export async function listWebsitesForUser(
  userId: string,
  params?: JsonRecord,
): Promise<WebsiteAssignmentUserWebsitesEnvelope> {
  const { data } = await apiClient.get<WebsiteAssignmentUserWebsitesEnvelope>(
    `/website-assignments/users/${encodeURIComponent(userId)}/websites`,
    { params },
  );
  return data;
}

export async function assignWebsiteTier(body: AssignWebsiteTierBody): Promise<unknown> {
  const { data } = await apiClient.post("/website-assignments", body);
  return data;
}

/** Assign or replace one slot (REST PUT). */
export async function putWebsiteAssignmentSlot(
  body: AssignWebsiteTierBody,
): Promise<unknown> {
  const { data } = await apiClient.put("/website-assignments", body);
  return data;
}

/** Replace full department roster (internal + external × 3 tiers). */
export async function putDepartmentRoster(
  websiteId: string,
  departmentId: string,
  body: PutDepartmentRosterBody,
): Promise<PutDepartmentRosterResponseEnvelope> {
  const { data } = await apiClient.put<PutDepartmentRosterResponseEnvelope>(
    `/website-assignments/websites/${encodeURIComponent(websiteId)}/departments/${encodeURIComponent(departmentId)}/roster`,
    body,
  );
  return data;
}

/** Clear every agent slot on a website (scheduling not required). */
export async function clearWebsiteRoster(
  websiteId: string,
): Promise<WebsiteAssignmentWebsiteDetailEnvelope> {
  const { data } = await apiClient.delete<WebsiteAssignmentWebsiteDetailEnvelope>(
    `/website-assignments/websites/${encodeURIComponent(websiteId)}/roster`,
  );
  return data;
}

export async function getDepartmentRosterHrmsContext(
  websiteId: string,
  departmentId: string,
  params: { channel: ServiceChannel; userIds?: string },
): Promise<DepartmentRosterHrmsContextEnvelope> {
  const { data } = await apiClient.get<DepartmentRosterHrmsContextEnvelope>(
    `/website-assignments/websites/${encodeURIComponent(websiteId)}/departments/${encodeURIComponent(departmentId)}/roster-hrms-context`,
    { params },
  );
  return data;
}

export async function getDepartmentRosterCoverage(
  websiteId: string,
  departmentId: string,
  channel: ServiceChannel,
): Promise<import("../types/roster-coverage.types").DepartmentRosterCoverageEnvelope> {
  const { data } = await apiClient.get<
    import("../types/roster-coverage.types").DepartmentRosterCoverageEnvelope
  >(
    `/website-assignments/websites/${encodeURIComponent(websiteId)}/departments/${encodeURIComponent(departmentId)}/roster-coverage`,
    { params: { channel } },
  );
  return data;
}

export async function putDepartmentRosterCoverage(
  websiteId: string,
  departmentId: string,
  channel: ServiceChannel,
  body: import("../types/roster-coverage.types").PutDepartmentRosterCoverageBody,
): Promise<import("../types/roster-coverage.types").DepartmentRosterCoverageEnvelope> {
  const { data } = await apiClient.put<
    import("../types/roster-coverage.types").DepartmentRosterCoverageEnvelope
  >(
    `/website-assignments/websites/${encodeURIComponent(websiteId)}/departments/${encodeURIComponent(departmentId)}/roster-coverage`,
    body,
    { params: { channel } },
  );
  return data;
}

/** Clear one roster slot (department + Internal/External + tier). */
export async function removeWebsiteSlotAssignment(
  websiteId: string,
  departmentId: string,
  serviceChannel: ServiceChannel,
  assignmentType: WebsiteAssignmentTier,
): Promise<unknown> {
  const { data } = await apiClient.delete(
    `/website-assignments/websites/${encodeURIComponent(websiteId)}/departments/${encodeURIComponent(departmentId)}/channels/${encodeURIComponent(serviceChannel)}/${encodeURIComponent(assignmentType)}`,
  );
  return data;
}

/** @deprecated Legacy tier-only delete — prefer {@link removeWebsiteSlotAssignment}. */
export async function removeWebsiteTierAssignment(
  websiteId: string,
  assignmentType: string,
): Promise<unknown> {
  const { data } = await apiClient.delete(
    `/website-assignments/websites/${encodeURIComponent(websiteId)}/${encodeURIComponent(assignmentType)}`,
  );
  return data;
}
