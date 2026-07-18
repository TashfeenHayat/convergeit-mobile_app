import { apiClient } from "../http/axios-instance";
import type { JsonRecord } from "../types/common.types";

export async function listPools(params?: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.get("/hrms/pools", { params });
  return data;
}

export async function createPool(body: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.post("/hrms/pools", body);
  return data;
}

export async function updatePool(id: string, body: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.patch(
    `/hrms/pools/${encodeURIComponent(id)}`,
    body,
  );
  return data;
}

export async function deletePool(id: string): Promise<unknown> {
  const { data } = await apiClient.delete(
    `/hrms/pools/${encodeURIComponent(id)}`,
  );
  return data;
}
