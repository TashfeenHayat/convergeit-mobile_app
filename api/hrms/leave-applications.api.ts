import { apiClient } from "../http/axios-instance";
import type { JsonRecord } from "../types/common.types";

export async function submitLeaveApplication(body: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.post("/hrms/leave-applications", body);
  return data;
}

export async function getMyLeaveApplications(
  params?: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.get("/hrms/leave-applications/me", {
    params,
  });
  return data;
}

export async function getLeaveQuotaSummary(params?: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.get(
    "/hrms/leave-applications/quota-summary",
    { params },
  );
  return data;
}

export async function getPendingLeavePoolQueue(
  params?: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.get(
    "/hrms/leave-applications/pending/pool-queue",
    { params },
  );
  return data;
}

export async function getPendingLeaveDepartmentQueue(
  params?: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.get(
    "/hrms/leave-applications/pending/department-queue",
    { params },
  );
  return data;
}

export async function getPendingLeaveTenantQueue(
  params?: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.get(
    "/hrms/leave-applications/pending/tenant-queue",
    { params },
  );
  return data;
}

export async function decideLeavePool(
  id: string,
  body: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.patch(
    `/hrms/leave-applications/${encodeURIComponent(id)}/decide-pool`,
    body,
  );
  return data;
}

export async function decideLeaveDepartment(
  id: string,
  body: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.patch(
    `/hrms/leave-applications/${encodeURIComponent(id)}/decide-department`,
    body,
  );
  return data;
}

export async function decideLeaveTenant(
  id: string,
  body: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.patch(
    `/hrms/leave-applications/${encodeURIComponent(id)}/decide-tenant`,
    body,
  );
  return data;
}
