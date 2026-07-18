import type { InvoiceLineItemView, InvoiceView } from "@/api/billing/invoice.api";
import { formatInvoiceWebsite } from "@/lib/billing/invoice-table-display";

export type InvoiceWebsiteTableRow = {
  rowId: string;
  invoiceId: string;
  invoiceNumber: string | null;
  status: string;
  currency: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  dueDate: string | null;
  parentCompanyName: string | null;
  companyName: string;
  websiteId: string;
  websiteUrl: string;
  websiteName: string | null;
  billableChats: number;
  amount: number;
};

function rowFromLine(invoice: InvoiceView, line: InvoiceLineItemView): InvoiceWebsiteTableRow {
  return {
    rowId: `${invoice.id}:${line.websiteId}`,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    currency: invoice.currency,
    periodStart: invoice.periodStart,
    periodEnd: invoice.periodEnd,
    dueDate: invoice.dueDate,
    parentCompanyName: invoice.parentCompanyName,
    companyName: invoice.companyName,
    websiteId: line.websiteId,
    websiteUrl: line.websiteUrl,
    websiteName: line.websiteName,
    billableChats: line.billableChats ?? 0,
    amount: line.lineTotal ?? 0,
  };
}

function rowFromHeader(invoice: InvoiceView): InvoiceWebsiteTableRow {
  return {
    rowId: `${invoice.id}:header`,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    currency: invoice.currency,
    periodStart: invoice.periodStart,
    periodEnd: invoice.periodEnd,
    dueDate: invoice.dueDate,
    parentCompanyName: invoice.parentCompanyName,
    companyName: invoice.companyName,
    websiteId: invoice.websiteId ?? invoice.id,
    websiteUrl: invoice.websiteUrl ?? "",
    websiteName: invoice.websiteName,
    billableChats: invoice.billableChats ?? invoice.totalChats ?? 0,
    amount: invoice.totalAmount,
  };
}

/** One table row per website line on combined parent invoices. */
export function flattenInvoicesToWebsiteRows(invoices: InvoiceView[]): InvoiceWebsiteTableRow[] {
  const rows: InvoiceWebsiteTableRow[] = [];
  for (const invoice of invoices) {
    const items = invoice.lineItems ?? [];
    if (items.length > 0) {
      for (const line of items) {
        rows.push(rowFromLine(invoice, line));
      }
    } else {
      rows.push(rowFromHeader(invoice));
    }
  }
  return rows;
}

export function websiteRowLabel(row: InvoiceWebsiteTableRow): string {
  return formatInvoiceWebsite(row.websiteUrl) || row.websiteName?.trim() || "—";
}

export function websiteRowClient(row: InvoiceWebsiteTableRow): string {
  return row.parentCompanyName?.trim() || row.companyName?.trim() || "—";
}

export function websiteRowPeriod(row: InvoiceWebsiteTableRow): string {
  if (!row.periodStart && !row.periodEnd) return "—";
  if (!row.periodStart || !row.periodEnd) return row.periodStart ?? row.periodEnd ?? "—";

  const start = new Date(`${row.periodStart}T00:00:00Z`);
  const end = new Date(`${row.periodEnd}T00:00:00Z`);
  const sameMonth =
    start.getUTCFullYear() === end.getUTCFullYear() && start.getUTCMonth() === end.getUTCMonth();

  if (sameMonth) {
    const monthYear = start.toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
    return `${monthYear} (${start.getUTCDate()}–${end.getUTCDate()})`;
  }

  return `${row.periodStart} – ${row.periodEnd}`;
}
