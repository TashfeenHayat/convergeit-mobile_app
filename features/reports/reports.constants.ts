import type { ReportType } from "@/api/reports/reports.types";

export const REPORT_TYPE_OPTIONS: { value: ReportType; label: string; description: string }[] = [
  {
    value: "traffic_chat_conversion_ratios",
    label: "Traffic & chat conversion",
    description: "Per-website visitor, greet, and chat conversion metrics.",
  },
  {
    value: "chat_transcripts_report",
    label: "Chat transcripts",
    description: "Tabular list of chats with transcript links.",
  },
  {
    value: "visitor_info_with_transcript",
    label: "Visitor info with transcript",
    description: "Visitor profile, geo, lead source, page, referrer, and transcript link.",
  },
  {
    value: "website_distribution_report",
    label: "Website distribution",
    description: "Current distribution setup by website and department.",
  },
  {
    value: "monthly_chat_summary",
    label: "Monthly chat summary",
    description: "Dashboard-style monthly analytics overview.",
  },
  {
    value: "month_wise_chat_count",
    label: "Month-wise chat count",
    description: "Multi-month visitors, chats, and billable chats trend.",
  },
];

export const REPORT_TYPE_LABELS: Record<ReportType, string> = Object.fromEntries(
  REPORT_TYPE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<ReportType, string>;

export const LEAD_TYPE_OPTIONS = [
  { value: "", label: "All lead types" },
  { value: "Billable", label: "Meaningful chat" },
  { value: "Closed", label: "Closed (not meaningful)" },
] as const;

export const SCHEDULE_TYPE_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
] as const;

export const DAY_OF_WEEK_OPTIONS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
] as const;

export const RECIPIENT_TYPE_OPTIONS = [
  { value: "to", label: "To" },
  { value: "cc", label: "Cc" },
  { value: "bcc", label: "Bcc" },
] as const;

export const REPORTS_ROUTES = {
  generate: "/dashboard/reports",
  configuration: "/dashboard/reports/configuration",
} as const;

export type ReportExportFormat = "pdf" | "png" | "xlsx";

export const REPORT_EXPORT_FORMAT: Record<ReportType, ReportExportFormat> = {
  monthly_chat_summary: "pdf",
  month_wise_chat_count: "png",
  traffic_chat_conversion_ratios: "xlsx",
  chat_transcripts_report: "xlsx",
  visitor_info_with_transcript: "xlsx",
  website_distribution_report: "xlsx",
};

export const REPORT_EXPORT_LABELS: Record<ReportExportFormat, string> = {
  pdf: "Export PDF",
  png: "Export PNG",
  xlsx: "Export Excel",
};
