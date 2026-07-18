import { useCallback, useMemo } from "react";

import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import {
  useAttendanceCheckInMutation,
  useAttendanceCheckOutMutation,
  useTodayAttendanceRow,
} from "@/lib/hooks/query/hrms";
import { extractApiErrorMessageForToast, publishAppToast } from "@/lib/notify";
import { OP, hasAttendanceSelfOperational } from "@/lib/permissions";

/** Header check-in toggle — shows Check-out only after an open session (check-in). */
export function DashboardHeaderCheckInButton() {
  const { hasOperational } = useAuth();

  const canCheckIn =
    hasOperational(OP.hrms.attendance.checkIn) || hasAttendanceSelfOperational(hasOperational);
  const canCheckOut =
    hasOperational(OP.hrms.attendance.checkOut) || hasAttendanceSelfOperational(hasOperational);
  const show = canCheckIn || canCheckOut;

  const { dayState, isLoading } = useTodayAttendanceRow({ enabled: show });
  const checkInMutation = useAttendanceCheckInMutation();
  const checkOutMutation = useAttendanceCheckOutMutation();

  const isCheckedIn = dayState.hasOpenSession;
  const blockedByActivity = dayState.isOnBreak || dayState.isOnMeeting;
  const isBusy = checkInMutation.isPending || checkOutMutation.isPending || isLoading;

  const mutateWithToast = useCallback(
    (
      mutate: (opts: { onSuccess: () => void; onError: (e: unknown) => void }) => void,
      successMessage: string,
      errorFallback: string,
    ) => {
      mutate({
        onSuccess: () => publishAppToast({ variant: "success", message: successMessage }),
        onError: (error) =>
          publishAppToast({
            variant: "error",
            message: extractApiErrorMessageForToast(error) ?? errorFallback,
          }),
      });
    },
    [],
  );

  const handleClick = useCallback(() => {
    if (isCheckedIn) {
      if (!canCheckOut || isBusy || blockedByActivity) return;
      mutateWithToast(
        (opts) => checkOutMutation.mutate(undefined, opts),
        "Checked out.",
        "Could not check out.",
      );
      return;
    }
    if (!canCheckIn || isBusy) return;
    mutateWithToast(
      (opts) => checkInMutation.mutate(undefined, opts),
      "Checked in.",
      "Could not check in.",
    );
  }, [
    blockedByActivity,
    canCheckIn,
    canCheckOut,
    checkInMutation,
    checkOutMutation,
    isBusy,
    isCheckedIn,
    mutateWithToast,
  ]);

  const label = useMemo(() => {
    if (checkInMutation.isPending || checkOutMutation.isPending) return "…";
    return isCheckedIn ? "Check-out" : "Check-in";
  }, [checkInMutation.isPending, checkOutMutation.isPending, isCheckedIn]);

  const disabled =
    isBusy ||
    (isCheckedIn ? !canCheckOut || blockedByActivity : !canCheckIn);

  if (!show) return null;

  return (
    <Button
      variant={isCheckedIn ? "danger" : "primary"}
      size="compact"
      disabled={disabled}
      loading={isBusy && (checkInMutation.isPending || checkOutMutation.isPending)}
      onPress={handleClick}
      accessibilityLabel={isCheckedIn ? "Check out" : "Check in"}
      style={{ minWidth: 0, paddingHorizontal: 12 }}
    >
      {label}
    </Button>
  );
}
