import { isRecord, pickNum, pickStr, unwrapApiData } from "@/lib/utils/core";

export type LeaveQuotaSummaryRow = {
  id: string;
  name: string;
  yearlyMax: number | null;
  approvedDays: number;
  pendingDays: number;
  remainingDays: number | null;
  usagePct: number;
};

function quotaItemsFromPayload(payload: unknown): Record<string, unknown>[] {
  const root = unwrapApiData(payload);
  if (Array.isArray(root)) return root.filter(isRecord);
  if (!isRecord(root)) return [];

  const candidates = [
    root["items"],
    root["quotas"],
    root["leaveTypes"],
    root["summary"],
    root["data"],
    isRecord(root["quota"]) ? root["quota"]["items"] : null,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(isRecord);
    }
  }

  return [];
}

export function parseLeaveQuotaSummaryRows(data: unknown): LeaveQuotaSummaryRow[] {
  return quotaItemsFromPayload(data)
    .map((row) => {
      const leaveTypeObj = isRecord(row["leaveType"]) ? row["leaveType"] : null;

      const id =
        pickStr(leaveTypeObj, ["id"]) ||
        pickStr(row, ["leaveTypeId", "id"]) ||
        pickStr(row, ["leaveTypeName", "name", "typeName"]) ||
        "";

      const name =
        pickStr(leaveTypeObj, ["name"]) ||
        pickStr(row, ["leaveTypeName", "name", "typeName"]) ||
        "—";

      const yearlyMax =
        pickNum(row, ["yearlyMax", "yearlyMaxDays", "maxDaysPerYear", "maxDays", "yearMaxDays", "quota"]) ??
        pickNum(leaveTypeObj, ["maxDaysPerYear", "yearlyMaxDays", "yearlyMax"]);

      const approvedDays =
        pickNum(row, [
          "approvedDays",
          "approvedLeaves",
          "approvedLeaveDays",
          "daysApproved",
          "approved",
        ]) ?? 0;

      const pendingDays =
        pickNum(row, ["pendingDays", "pendingLeaves", "pendingLeaveDays", "daysPending", "pending"]) ??
        0;

      const remainingFromApi = pickNum(row, [
        "remainingDays",
        "remainingLeaves",
        "balanceDays",
        "availableDays",
        "remaining",
      ]);

      const safeMax =
        typeof yearlyMax === "number" && Number.isFinite(yearlyMax) ? Math.max(0, yearlyMax) : null;
      const safeApproved =
        typeof approvedDays === "number" && Number.isFinite(approvedDays) ? Math.max(0, approvedDays) : 0;
      const safePending =
        typeof pendingDays === "number" && Number.isFinite(pendingDays) ? Math.max(0, pendingDays) : 0;

      const remainingDays =
        remainingFromApi != null && Number.isFinite(remainingFromApi)
          ? Math.max(0, remainingFromApi)
          : safeMax == null
            ? null
            : Math.max(0, safeMax - safeApproved);

      const usagePct =
        safeMax != null && safeMax > 0 ? Math.min(100, Math.round((safeApproved / safeMax) * 100)) : 0;

      return {
        id: id || name,
        name,
        yearlyMax: safeMax,
        approvedDays: safeApproved,
        pendingDays: safePending,
        remainingDays,
        usagePct,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function formatLeaveDayCount(value: number): string {
  return `${value} day${value === 1 ? "" : "s"}`;
}
