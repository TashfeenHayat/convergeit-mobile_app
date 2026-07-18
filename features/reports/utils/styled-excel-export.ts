import ExcelJS from "exceljs";
import type { ReportMetadataBase, ReportType } from "@/api/reports/reports.types";
import { REPORT_TYPE_LABELS } from "../reports.constants";

const FONT = "Calibri";

const COLORS = {
  title: "FF1F4E79",
  subtitle: "FF5B9BD5",
  headerFill: "FF4472C4",
  headerFont: "FFFFFFFF",
  border: "FFD0D0D0",
  totalsFill: "FFE8EEF7",
} as const;

export type StyledExcelColumn = {
  header: string;
  key: string;
  width?: number;
  align?: "left" | "center" | "right";
};

function columnLetter(index: number): string {
  let letter = "";
  let n = index;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

function cellBorder(): Partial<ExcelJS.Borders> {
  const side: Partial<ExcelJS.Border> = { style: "thin", color: { argb: COLORS.border } };
  return { top: side, left: side, bottom: side, right: side };
}

export function formatExcelDateRange(metadata: ReportMetadataBase): string {
  if (!metadata.period) return "";
  const format = (iso: string) => {
    const date = new Date(iso);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };
  return `${format(metadata.period.from)} To ${format(metadata.period.to)}`;
}

export function formatExcelDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date
    .toLocaleString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
    .replace(" AM", " am")
    .replace(" PM", " pm");
}

export function excelDisplayText(value: string | null | undefined, emptyLabel = ""): string {
  if (value === null || value === undefined || String(value).trim() === "") return emptyLabel;
  return String(value);
}

export function reportExcelTitle(reportType: ReportType): string {
  const labels: Partial<Record<ReportType, string>> = {
    visitor_info_with_transcript: "Visitor Information Report",
    chat_transcripts_report: "Chat Transcripts Report",
    traffic_chat_conversion_ratios: "Traffic & Chat Conversion Report",
    website_distribution_report: "Website Distribution Report",
  };
  return labels[reportType] ?? `${REPORT_TYPE_LABELS[reportType]} Report`;
}

function applyHeaderStyle(cell: ExcelJS.Cell, align: ExcelJS.Alignment["horizontal"] = "left") {
  cell.font = { name: FONT, size: 11, bold: true, color: { argb: COLORS.headerFont } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerFill } };
  cell.alignment = { horizontal: align, vertical: "middle", wrapText: true };
  cell.border = cellBorder();
}

function applyDataStyle(
  cell: ExcelJS.Cell,
  align: ExcelJS.Alignment["horizontal"] = "left",
  bold = false,
  fill?: string,
) {
  cell.font = { name: FONT, size: 10, bold };
  cell.alignment = { horizontal: align, vertical: "middle", wrapText: true };
  cell.border = cellBorder();
  if (fill) {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
  }
}

export function addStyledDataSheet(
  workbook: ExcelJS.Workbook,
  options: {
    sheetName: string;
    title: string;
    subtitle?: string;
    columns: StyledExcelColumn[];
    rows: Record<string, ExcelJS.CellValue>[];
    totalsRowIndexes?: number[];
  },
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet(options.sheetName, {
    views: [{ showGridLines: false }],
  });
  const colCount = Math.max(options.columns.length, 1);
  const lastCol = columnLetter(colCount);

  sheet.mergeCells(`A1:${lastCol}1`);
  const titleCell = sheet.getCell("A1");
  titleCell.value = options.title;
  titleCell.font = { name: FONT, size: 18, bold: true, color: { argb: COLORS.title } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 30;

  let headerRowNum = 3;
  if (options.subtitle) {
    sheet.mergeCells(`A2:${lastCol}2`);
    const subtitleCell = sheet.getCell("A2");
    subtitleCell.value = options.subtitle;
    subtitleCell.font = { name: FONT, size: 12, color: { argb: COLORS.subtitle } };
    subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(2).height = 22;
    sheet.getRow(3).height = 10;
    headerRowNum = 4;
  }

  const headerRow = sheet.getRow(headerRowNum);
  options.columns.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = column.header;
    applyHeaderStyle(cell, column.align ?? "left");
  });
  headerRow.height = 24;

  const totalsSet = new Set(options.totalsRowIndexes ?? []);
  options.rows.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(headerRowNum + 1 + rowIndex);
    const isTotals = totalsSet.has(rowIndex);
    options.columns.forEach((column, colIndex) => {
      const cell = excelRow.getCell(colIndex + 1);
      const raw = row[column.key];
      cell.value = raw === null || raw === undefined ? "" : raw;
      applyDataStyle(cell, column.align ?? "left", isTotals, isTotals ? COLORS.totalsFill : undefined);
    });
    excelRow.height = 20;
  });

  options.columns.forEach((column, index) => {
    const excelColumn = sheet.getColumn(index + 1);
    excelColumn.width = column.width ?? 18;
  });

  sheet.views = [{ state: "frozen", ySplit: headerRowNum, showGridLines: false }];
  return sheet;
}

export function addMetadataSheet(workbook: ExcelJS.Workbook, metadata: ReportMetadataBase) {
  const rows: Array<{ Field: string; Value: string }> = [
    { Field: "Report type", Value: metadata.reportType },
    { Field: "Scope", Value: `${metadata.scope.name} (${metadata.scope.type})` },
  ];
  if (metadata.period) {
    rows.push({ Field: "Period", Value: metadata.period.label });
    rows.push({ Field: "From", Value: metadata.period.from });
    rows.push({ Field: "To", Value: metadata.period.to });
  }
  const hierarchy = [
    metadata.hierarchy.reseller?.name,
    metadata.hierarchy.parentCompany?.name,
    metadata.hierarchy.childCompany?.name,
    metadata.hierarchy.website?.name ?? metadata.hierarchy.website?.url,
  ]
    .filter(Boolean)
    .join(" → ");
  if (hierarchy) rows.push({ Field: "Hierarchy", Value: hierarchy });
  rows.push({ Field: "Exported", Value: new Date().toLocaleString() });

  addStyledDataSheet(workbook, {
    sheetName: "Report info",
    title: "Report Information",
    subtitle: formatExcelDateRange(metadata) || metadata.scope.name,
    columns: [
      { header: "Field", key: "Field", width: 28 },
      { header: "Value", key: "Value", width: 48 },
    ],
    rows,
  });
}

export async function downloadExcelWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function createReportWorkbook(): ExcelJS.Workbook {
  return new ExcelJS.Workbook();
}
