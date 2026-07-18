import { useMemo } from "react";
import { ATTENDANCE_TODAY_STALE_MS, useAttendanceMeQuery } from "./hooks";
import { isRecord, unwrapApiData } from "@/lib/utils/core";
import {
  formatHeaderAttendanceTimes,
  parseAttendanceDayState,
  parseAttendanceHeaderTimes,
} from "@/lib/utils/hrms/attendance-display";

export function firstTodayAttendanceRow(data: unknown): Record<string, unknown> | null {
  const payload = unwrapApiData(data);
  const source = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload["items"])
      ? payload["items"]
      : [];
  const row = source.find((item) => isRecord(item));
  return row && isRecord(row) ? row : null;
}

function localTodayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function useTodayAttendanceRow(options?: { enabled?: boolean }) {
  const today = useMemo(() => localTodayIso(), []);
  const query = useAttendanceMeQuery(
    { from: today, to: today, page: 1, limit: 1 },
    {
      enabled: options?.enabled ?? true,
      staleTime: ATTENDANCE_TODAY_STALE_MS,
    },
  );

  const row = useMemo(() => firstTodayAttendanceRow(query.data), [query.data]);
  const dayState = useMemo(() => parseAttendanceDayState(row ?? {}), [row]);
  const headerLabel = useMemo(() => formatHeaderAttendanceTimes(dayState), [dayState]);
  const headerTimes = useMemo(() => parseAttendanceHeaderTimes(dayState), [dayState]);

  return {
    row,
    dayState,
    headerLabel,
    headerTimes,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
