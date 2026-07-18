import { apiClient } from "../http/axios-instance";
import type { JsonRecord } from "../types/common.types";

export async function listPoolHeads(params?: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.get("/hrms/pool-heads", { params });
  return data;
}

export async function listPoolHeadsAttendance(params?: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.get("/hrms/pool-heads/attendance", { params });
  return data;
}

export async function assignPoolHead(body: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.post("/hrms/pool-heads", body);
  return data;
}

export async function removePoolHead(id: string): Promise<unknown> {
  const { data } = await apiClient.delete(
    `/hrms/pool-heads/${encodeURIComponent(id)}`,
  );
  return data;
}
