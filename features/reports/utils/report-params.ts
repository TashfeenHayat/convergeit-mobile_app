import type { ReportPeriodQueryParams, ReportScopeQueryParams } from "@/api/reports/reports.types";

export type ReportScopeFilterInput = {
  resellerId: string;
  parentCompanyId: string;
  childCompanyId: string;
  websiteId: string;
};

export function buildReportScopeParams(filters: ReportScopeFilterInput): ReportScopeQueryParams {
  const params: ReportScopeQueryParams = {};
  if (filters.websiteId.trim()) params.websiteId = filters.websiteId.trim();
  if (filters.childCompanyId.trim()) params.companyId = filters.childCompanyId.trim();
  if (filters.parentCompanyId.trim()) params.parentCompanyId = filters.parentCompanyId.trim();
  if (filters.resellerId.trim()) params.resellerId = filters.resellerId.trim();
  return params;
}

export function hasReportScope(filters: ReportScopeFilterInput): boolean {
  return Boolean(
    filters.websiteId.trim() ||
      filters.childCompanyId.trim() ||
      filters.parentCompanyId.trim() ||
      filters.resellerId.trim(),
  );
}

export type ReportPeriodMode = "month" | "range";

export type ReportPeriodState = {
  mode: ReportPeriodMode;
  year: number;
  month: number;
  from: string;
  to: string;
  monthCount: number;
};

export function currentUtcMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

export function defaultReportPeriodState(): ReportPeriodState {
  const { year, month } = currentUtcMonth();
  const from = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString();
  return { mode: "month", year, month, from, to, monthCount: 4 };
}

export function buildReportPeriodParams(period: ReportPeriodState): ReportPeriodQueryParams {
  if (period.mode === "month") {
    return { year: period.year, month: period.month };
  }
  return {
    from: period.from,
    to: period.to,
  };
}

export function formatMetricValue(value: number, suffix = ""): string {
  if (!Number.isFinite(value)) return "—";
  const formatted = value >= 1000 ? value.toLocaleString() : String(value);
  return suffix ? `${formatted}${suffix}` : formatted;
}

export function formatRatioPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(1)}%`;
}

export function formatTrendBadge(trend: "up" | "down" | "flat", changePct: number | null): string {
  const arrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
  if (changePct === null || !Number.isFinite(changePct)) return arrow;
  return `${arrow} ${Math.abs(changePct).toFixed(1)}%`;
}
