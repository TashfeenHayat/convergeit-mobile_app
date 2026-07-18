import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  attendanceBreakIn,
  attendanceBreakOut,
  attendanceCheckIn,
  attendanceCheckOut,
  attendanceMeetingIn,
  attendanceMeetingOut,
  getMyAttendance,
  getUserAttendance,
} from "@/api/hrms";
import type { JsonRecord } from "@/api/types/common.types";
import {
  hrmsAttendanceKeys,
  normalizeAttendanceQueryParams,
  type AttendanceQueryParams,
} from "./keys";

export type HrmsAttendanceRangeParams = AttendanceQueryParams;

/** List/history queries — avoid refetch storms on navigation and focus. */
const ATTENDANCE_LIST_STALE_MS = 5 * 60_000;
/** Today's snapshot (dashboard cards, account menu). */
export const ATTENDANCE_TODAY_STALE_MS = 2 * 60_000;

export function useAttendanceMeQuery(
  params: HrmsAttendanceRangeParams | undefined,
  options?: {
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
    staleTime?: number;
    keepPreviousPage?: boolean;
  },
) {
  const normalized = normalizeAttendanceQueryParams(params);
  const hasRange = Boolean(normalized?.from && normalized?.to);

  return useQuery({
    queryKey: hrmsAttendanceKeys.me(normalized),
    queryFn: () => getMyAttendance(normalized as JsonRecord | undefined),
    enabled: (options?.enabled ?? true) && hasRange,
    staleTime: options?.staleTime ?? ATTENDANCE_LIST_STALE_MS,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    refetchOnReconnect: false,
    retry: 1,
    placeholderData: options?.keepPreviousPage ? keepPreviousData : undefined,
  });
}

export function useAttendanceUserQuery(
  userId: string | undefined,
  params: HrmsAttendanceRangeParams | undefined,
  options?: { enabled?: boolean },
) {
  const id = userId?.trim() ?? "";
  const normalized = normalizeAttendanceQueryParams(params);
  const hasRange = Boolean(normalized?.from && normalized?.to);

  return useQuery({
    queryKey: hrmsAttendanceKeys.user(id, normalized),
    queryFn: () => getUserAttendance(id, normalized as JsonRecord | undefined),
    enabled: (options?.enabled ?? true) && id.length > 0 && hasRange,
    staleTime: ATTENDANCE_LIST_STALE_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}

function invalidateAllAttendanceQueries(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({
    queryKey: hrmsAttendanceKeys.all,
    refetchType: "active",
  });
}

export function useAttendanceCheckInMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceCheckIn(),
    onSuccess: () => invalidateAllAttendanceQueries(qc),
  });
}

export function useAttendanceCheckOutMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceCheckOut(),
    onSuccess: () => invalidateAllAttendanceQueries(qc),
  });
}

export function useAttendanceBreakInMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceBreakIn(),
    onSuccess: () => invalidateAllAttendanceQueries(qc),
  });
}

export function useAttendanceBreakOutMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceBreakOut(),
    onSuccess: () => invalidateAllAttendanceQueries(qc),
  });
}

export function useAttendanceMeetingInMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceMeetingIn(),
    onSuccess: () => invalidateAllAttendanceQueries(qc),
  });
}

export function useAttendanceMeetingOutMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceMeetingOut(),
    onSuccess: () => invalidateAllAttendanceQueries(qc),
  });
}
