import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type {
  ChatTranscriptsReportResponse,
  MonthlyChatSummaryResponse,
  MonthWiseChatCountResponse,
  ReportMetadataBase,
  TrafficConversionRatiosResponse,
  VisitorInfoWithTranscriptReportResponse,
  WebsiteDistributionReportResponse,
} from "@/api/reports/reports.types";
import type { ReportExportFormat } from "../reports.constants";
import { REPORT_EXPORT_FORMAT } from "../reports.constants";
import { exportMonthlySummaryPdf } from "../pdf/export-monthly-summary-pdf";
import {
  addMetadataSheet,
  addStyledDataSheet,
  createReportWorkbook,
  downloadExcelWorkbook,
  excelDisplayText,
  formatExcelDateRange,
  formatExcelDateTime,
  reportExcelTitle,
  type StyledExcelColumn,
} from "./styled-excel-export";

function safeFilenameBase(value: string): string {
  const base = value
    .replace(/[^\w\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return base.slice(0, 48) || "report";
}

export function reportExportFilename(
  metadata: ReportMetadataBase,
  format: ReportExportFormat,
): string {
  const scope = safeFilenameBase(metadata.scope.name);
  const type = safeFilenameBase(metadata.reportType);
  const period = metadata.period?.label
    ? `_${safeFilenameBase(metadata.period.label)}`
    : "";
  return `${type}_${scope}${period}.${format}`;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function finalizeWorkbook(
  workbook: ReturnType<typeof createReportWorkbook>,
  metadata: ReportMetadataBase,
  filename: string,
) {
  addMetadataSheet(workbook, metadata);
  await downloadExcelWorkbook(workbook, filename);
}

export async function exportTrafficConversionXlsx(
  data: TrafficConversionRatiosResponse,
): Promise<void> {
  const workbook = createReportWorkbook();
  const metadata = data.reportMetadata;
  const columns: StyledExcelColumn[] = [
    { header: "Domain", key: "domain", width: 22 },
    { header: "Website URL", key: "websiteUrl", width: 34 },
    { header: "Visitors", key: "visitors", width: 12, align: "right" },
    { header: "Greets", key: "greets", width: 12, align: "right" },
    { header: "Not greeted", key: "notGreeted", width: 14, align: "right" },
    { header: "Chats", key: "chats", width: 12, align: "right" },
    { header: "Meaningful chats", key: "meaningfulChats", width: 18, align: "right" },
    { header: "Visitor→Chat %", key: "visitorToChat", width: 16, align: "right" },
    { header: "Greet→Chat %", key: "greetToChat", width: 16, align: "right" },
    { header: "Chat→Meaningful %", key: "chatToMeaningful", width: 18, align: "right" },
  ];

  const rows = data.rows.map((row) => ({
    domain: row.domainName,
    websiteUrl: row.websiteUrl,
    visitors: row.uniqueVisitors,
    greets: row.greets,
    notGreeted: row.notGreeted,
    chats: row.chats,
    meaningfulChats: row.meaningfulChats,
    visitorToChat: row.visitorToChatRatio ?? "",
    greetToChat: row.greetToChatRatio ?? "",
    chatToMeaningful: row.chatToMeaningfulChatsRatio ?? "",
  }));
  rows.push({
    domain: data.totals.domainName,
    websiteUrl: data.totals.websiteUrl,
    visitors: data.totals.uniqueVisitors,
    greets: data.totals.greets,
    notGreeted: data.totals.notGreeted,
    chats: data.totals.chats,
    meaningfulChats: data.totals.meaningfulChats,
    visitorToChat: data.totals.visitorToChatRatio ?? "",
    greetToChat: data.totals.greetToChatRatio ?? "",
    chatToMeaningful: data.totals.chatToMeaningfulChatsRatio ?? "",
  });

  addStyledDataSheet(workbook, {
    sheetName: "Conversion ratios",
    title: reportExcelTitle("traffic_chat_conversion_ratios"),
    subtitle: formatExcelDateRange(metadata),
    columns,
    rows,
    totalsRowIndexes: [rows.length - 1],
  });

  await finalizeWorkbook(workbook, metadata, reportExportFilename(metadata, "xlsx"));
}

export async function exportChatTranscriptsXlsx(
  data: ChatTranscriptsReportResponse,
): Promise<void> {
  const workbook = createReportWorkbook();
  const metadata = data.reportMetadata;
  const columns: StyledExcelColumn[] = [
    { header: "Chat ID", key: "chatId", width: 38 },
    { header: "Day", key: "day", width: 14 },
    { header: "Start", key: "start", width: 24 },
    { header: "End", key: "end", width: 24 },
    { header: "Visitor", key: "visitor", width: 22 },
    { header: "Agent", key: "agent", width: 20 },
    { header: "Domain", key: "domain", width: 22 },
    { header: "Department", key: "department", width: 20 },
    { header: "Lead type", key: "leadType", width: 14 },
    { header: "Source", key: "source", width: 16 },
    { header: "Transcript URL", key: "transcriptUrl", width: 42 },
  ];

  const rows = data.items.map((row) => ({
    chatId: row.chatId,
    day: row.day,
    start: formatExcelDateTime(row.chatStartTime),
    end: formatExcelDateTime(row.chatEndTime),
    visitor: row.visitorName,
    agent: excelDisplayText(row.userName),
    domain: row.domainName,
    department: excelDisplayText(row.department),
    leadType: row.leadType,
    source: row.source.label,
    transcriptUrl: row.chatTranscript.url,
  }));

  addStyledDataSheet(workbook, {
    sheetName: "Chat transcripts",
    title: reportExcelTitle("chat_transcripts_report"),
    subtitle: formatExcelDateRange(metadata),
    columns,
    rows,
  });

  await finalizeWorkbook(workbook, metadata, reportExportFilename(metadata, "xlsx"));
}

export async function exportVisitorInfoXlsx(
  data: VisitorInfoWithTranscriptReportResponse,
): Promise<void> {
  const workbook = createReportWorkbook();
  const metadata = data.reportMetadata;
  const columns: StyledExcelColumn[] = [
    { header: "VisitorId", key: "visitorId", width: 38 },
    { header: "ChatId", key: "chatId", width: 38 },
    { header: "Full Name", key: "fullName", width: 22 },
    { header: "Chat Start Time", key: "chatStartTime", width: 24 },
    { header: "Country", key: "country", width: 14 },
    { header: "State", key: "state", width: 14 },
    { header: "City", key: "city", width: 16 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Email", key: "email", width: 28 },
    { header: "Lead source", key: "leadSource", width: 16 },
    { header: "Department", key: "department", width: 20 },
    { header: "Company", key: "company", width: 20 },
    { header: "Page chat started", key: "pageChatStarted", width: 34 },
    { header: "Visitor referrer", key: "visitorReferrer", width: 34 },
    { header: "Transcript URL", key: "transcriptUrl", width: 42 },
  ];

  const rows = data.items.map((row) => ({
    visitorId: row.visitorId,
    chatId: row.chatId,
    fullName: row.fullName,
    chatStartTime: formatExcelDateTime(row.chatStartTime),
    country: excelDisplayText(row.country),
    state: excelDisplayText(row.state),
    city: excelDisplayText(row.city),
    phone: excelDisplayText(row.phone, "Not Available"),
    email: excelDisplayText(row.email, "Not Available"),
    leadSource: excelDisplayText(row.leadSource),
    department: excelDisplayText(row.departmentName),
    company: excelDisplayText(row.companyName),
    pageChatStarted: excelDisplayText(row.pageChatStarted),
    visitorReferrer: excelDisplayText(row.visitorReferrer),
    transcriptUrl: row.chatTranscript.url,
  }));

  addStyledDataSheet(workbook, {
    sheetName: "Visitor info",
    title: reportExcelTitle("visitor_info_with_transcript"),
    subtitle: formatExcelDateRange(metadata),
    columns,
    rows,
  });

  await finalizeWorkbook(workbook, metadata, reportExportFilename(metadata, "xlsx"));
}

export async function exportWebsiteDistributionXlsx(
  data: WebsiteDistributionReportResponse,
): Promise<void> {
  const workbook = createReportWorkbook();
  const metadata = data.reportMetadata;
  const columns: StyledExcelColumn[] = [
    { header: "Domain", key: "domain", width: 22 },
    { header: "Website URL", key: "websiteUrl", width: 34 },
    { header: "Department", key: "department", width: 22 },
    { header: "Address type", key: "addressType", width: 16 },
    { header: "Email form", key: "emailForm", width: 18 },
    { header: "Email", key: "email", width: 28 },
    { header: "Method", key: "method", width: 16 },
    { header: "Active", key: "active", width: 10, align: "center" },
  ];

  const rows = data.items.map((row) => ({
    domain: row.domainName,
    websiteUrl: row.websiteUrl,
    department: row.departmentName,
    addressType: row.addressType,
    emailForm: excelDisplayText(row.emailForm),
    email: row.emailAddress,
    method: row.distributionMethod,
    active: row.setupIsActive ? "Yes" : "No",
  }));

  addStyledDataSheet(workbook, {
    sheetName: "Distribution",
    title: reportExcelTitle("website_distribution_report"),
    subtitle: formatExcelDateRange(metadata) || metadata.scope.name,
    columns,
    rows,
  });

  await finalizeWorkbook(workbook, metadata, reportExportFilename(metadata, "xlsx"));
}

function metricRow(label: string, metric: {
  value: number;
  percentage: number | null;
  trend: string;
  trendChangePct: number | null;
}) {
  return {
    metric: label,
    value: metric.value,
    percentage: metric.percentage ?? "",
    trend: metric.trend,
    trendChangePct: metric.trendChangePct ?? "",
  };
}

export async function exportMonthlySummaryXlsx(data: MonthlyChatSummaryResponse): Promise<void> {
  const workbook = createReportWorkbook();
  const metadata = data.reportMetadata;
  const { accountSummary, meaningfulChatsWithContacts, chatsToLeadComparison } = data;

  const summaryColumns: StyledExcelColumn[] = [
    { header: "Metric", key: "metric", width: 34 },
    { header: "Value", key: "value", width: 14, align: "right" },
    { header: "Percentage", key: "percentage", width: 14, align: "right" },
    { header: "Trend", key: "trend", width: 12, align: "center" },
    { header: "Trend change %", key: "trendChangePct", width: 16, align: "right" },
  ];

  const summaryRows = [
    metricRow("Visitors (total)", accountSummary.visitors.total),
    metricRow("Visitors (mobile)", accountSummary.visitors.mobile),
    metricRow("Visitors (desktop)", accountSummary.visitors.desktop),
    metricRow("Chats (total)", accountSummary.chats.total),
    metricRow("Chats (mobile)", accountSummary.chats.mobile),
    metricRow("Chats (desktop)", accountSummary.chats.desktop),
    metricRow("Meaningful chats (total)", accountSummary.meaningfulChats.total),
    metricRow("Meaningful chats (mobile)", accountSummary.meaningfulChats.mobile),
    metricRow("Meaningful chats (desktop)", accountSummary.meaningfulChats.desktop),
    metricRow("Meaningful with contact (mobile)", meaningfulChatsWithContacts.mobile),
    metricRow("Meaningful with contact (total)", meaningfulChatsWithContacts.outOfMeaningfulChats),
    metricRow("Meaningful with contact (desktop)", meaningfulChatsWithContacts.desktop),
  ];

  addStyledDataSheet(workbook, {
    sheetName: "Account summary",
    title: reportExcelTitle("monthly_chat_summary"),
    subtitle: formatExcelDateRange(metadata),
    columns: summaryColumns,
    rows: summaryRows,
  });

  addStyledDataSheet(workbook, {
    sheetName: "Department distribution",
    title: "Department Distribution",
    subtitle: formatExcelDateRange(metadata),
    columns: [
      { header: "Department", key: "department", width: 32 },
      { header: "Count", key: "count", width: 12, align: "right" },
    ],
    rows: data.departmentDistribution.map((row) => ({
      department: row.department,
      count: row.count,
    })),
  });

  addStyledDataSheet(workbook, {
    sheetName: "Chats to lead",
    title: "Chats-to-Lead Comparison",
    subtitle: formatExcelDateRange(metadata),
    columns: [
      { header: "Month", key: "month", width: 16 },
      { header: "Total chats", key: "totalChats", width: 14, align: "right" },
      { header: "Billable chats", key: "billableChats", width: 16, align: "right" },
      { header: "Billable ratio %", key: "billableRatio", width: 16, align: "right" },
    ],
    rows: chatsToLeadComparison.map((row) => ({
      month: row.monthName,
      totalChats: row.totalChats,
      billableChats: row.billableChats,
      billableRatio: row.billableRatio ?? "",
    })),
  });

  await finalizeWorkbook(workbook, metadata, reportExportFilename(metadata, "xlsx"));
}

export async function exportMonthWiseChatCountXlsx(data: MonthWiseChatCountResponse): Promise<void> {
  const workbook = createReportWorkbook();
  const metadata = data.reportMetadata;

  addStyledDataSheet(workbook, {
    sheetName: "Month-wise counts",
    title: reportExcelTitle("month_wise_chat_count"),
    subtitle: formatExcelDateRange(metadata),
    columns: [
      { header: "Month", key: "month", width: 16 },
      { header: "Visitors", key: "visitors", width: 12, align: "right" },
      { header: "Total chats", key: "totalChats", width: 14, align: "right" },
      { header: "Billable chats", key: "billableChats", width: 16, align: "right" },
      { header: "Partial month", key: "partialMonth", width: 14, align: "center" },
    ],
    rows: data.months.map((row) => ({
      month: row.monthLabel,
      visitors: row.visitors,
      totalChats: row.totalChats,
      billableChats: row.billableChats,
      partialMonth: row.isPartialMonth ? "Yes" : "No",
    })),
  });

  await finalizeWorkbook(workbook, metadata, reportExportFilename(metadata, "xlsx"));
}

export async function exportElementToPdf(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}

export async function exportElementToPng(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });
  await new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob: Blob | null) => {
      if (!blob) {
        reject(new Error("Could not create PNG."));
        return;
      }
      triggerBlobDownload(blob, filename);
      resolve();
    }, "image/png");
  });
}

export type ReportExportPayload =
  | { reportType: "monthly_chat_summary"; data: MonthlyChatSummaryResponse }
  | { reportType: "month_wise_chat_count"; data: MonthWiseChatCountResponse }
  | { reportType: "traffic_chat_conversion_ratios"; data: TrafficConversionRatiosResponse }
  | { reportType: "chat_transcripts_report"; data: ChatTranscriptsReportResponse }
  | { reportType: "visitor_info_with_transcript"; data: VisitorInfoWithTranscriptReportResponse }
  | { reportType: "website_distribution_report"; data: WebsiteDistributionReportResponse };

export async function exportReport(payload: ReportExportPayload, options?: {
  reportElement?: HTMLElement | null;
  chartElement?: HTMLElement | null;
}): Promise<void> {
  const format = REPORT_EXPORT_FORMAT[payload.reportType];
  const metadata = payload.data.reportMetadata;
  const filename = reportExportFilename(metadata, format);

  if (format === "pdf") {
    if (payload.reportType === "monthly_chat_summary") {
      await exportMonthlySummaryPdf(payload.data, filename);
      return;
    }
    const element = options?.reportElement;
    if (!element) throw new Error("Report content is not ready for PDF export.");
    await exportElementToPdf(element, filename);
    return;
  }

  if (format === "png") {
    const element = options?.chartElement ?? options?.reportElement;
    if (!element) throw new Error("Chart is not ready for PNG export.");
    await exportElementToPng(element, filename);
    return;
  }

  switch (payload.reportType) {
    case "traffic_chat_conversion_ratios":
      await exportTrafficConversionXlsx(payload.data);
      break;
    case "chat_transcripts_report":
      await exportChatTranscriptsXlsx(payload.data);
      break;
    case "visitor_info_with_transcript":
      await exportVisitorInfoXlsx(payload.data);
      break;
    case "website_distribution_report":
      await exportWebsiteDistributionXlsx(payload.data);
      break;
    default:
      throw new Error("Unsupported XLSX export for this report type.");
  }
}
