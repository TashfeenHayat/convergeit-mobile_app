import type { InvoiceView } from "@/api/billing/invoice.api";

export function formatInvoiceWebsite(url: string | null | undefined): string {
  if (!url?.trim()) return "";
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

/** Client / parent company shown on combined parent invoices. */
export function invoiceTableCompany(row: InvoiceView): string {
  return row.parentCompanyName?.trim() || row.companyName?.trim() || "—";
}

/** Single site URL, or multi-site summary from line items. */
export function invoiceTableWebsite(row: InvoiceView): string {
  const direct = formatInvoiceWebsite(row.websiteUrl);
  if (direct) return direct;

  const items = row.lineItems ?? [];
  if (!items.length) return "—";

  if (items.length === 1) {
    const one = items[0];
    return formatInvoiceWebsite(one.websiteUrl) || one.websiteName?.trim() || "—";
  }

  const first =
    formatInvoiceWebsite(items[0].websiteUrl) || items[0].websiteName?.trim() || "site";
  return `${items.length} sites · ${first}`;
}

export function invoiceTableBillableChats(row: InvoiceView): number {
  const header = row.billableChats ?? row.totalChats;
  if (header != null && header > 0) return header;

  const fromLines = (row.lineItems ?? []).reduce((sum, line) => sum + (line.billableChats ?? 0), 0);
  if (fromLines > 0) return fromLines;

  return header ?? 0;
}

/** Prefer stored total; fall back to line-item sum when header total is zero. */
export function invoiceTableAmount(row: InvoiceView): number {
  if (row.totalAmount > 0) return row.totalAmount;

  const fromLines = (row.lineItems ?? []).reduce((sum, line) => sum + (line.lineTotal ?? 0), 0);
  if (fromLines > 0) return Math.round(fromLines * 100) / 100;

  if (row.subtotal != null && row.subtotal > 0) return row.subtotal;
  return row.totalAmount;
}

export function invoiceTablePeriod(row: InvoiceView): string {
  if (row.periodStart && row.periodEnd) return `${row.periodStart} → ${row.periodEnd}`;
  if (row.periodStart) return row.periodStart;
  return "—";
}

/** Shorter period label for dense list tables. */
export function invoiceTablePeriodCompact(row: InvoiceView): string {
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
