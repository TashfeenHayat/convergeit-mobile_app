import { apiClient } from "../http/axios-instance";
import type { JsonRecord } from "../types/common.types";

/** Server resolves the attendance day from shift timezone — no request body. */
export async function attendanceCheckIn(): Promise<unknown> {
  const { data } = await apiClient.post("/hrms/attendance/check-in");
  return data;
}

export async function attendanceCheckOut(): Promise<unknown> {
  const { data } = await apiClient.post("/hrms/attendance/check-out");
  return data;
}

export async function attendanceBreakIn(): Promise<unknown> {
  const { data } = await apiClient.post("/hrms/attendance/break-in");
  return data;
}

export async function attendanceBreakOut(): Promise<unknown> {
  const { data } = await apiClient.post("/hrms/attendance/break-out");
  return data;
}

export async function attendanceMeetingIn(): Promise<unknown> {
  const { data } = await apiClient.post("/hrms/attendance/meeting-in");
  return data;
}

export async function attendanceMeetingOut(): Promise<unknown> {
  const { data } = await apiClient.post("/hrms/attendance/meeting-out");
  return data;
}

export async function getMyAttendance(params?: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.get("/hrms/attendance/me", { params });
  return data;
}

export async function getUserAttendance(
  userId: string,
  params?: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.get(
    `/hrms/attendance/users/${encodeURIComponent(userId)}`,
    { params },
  );
  return data;
}
