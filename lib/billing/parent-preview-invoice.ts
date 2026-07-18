import type { ParentBillingPreview } from "@/api/billing/agency-billing-contract.api";
import type { InvoiceView } from "@/api/billing/invoice.api";

export function parentPreviewToInvoiceView(
  parent: ParentBillingPreview,
  options: {
    currency: string;
    periodStart: string;
    periodEnd: string;
    freeChatsPerMonth: number;
    costPerChat: number;
  },
): InvoiceView {
  const lineItems = parent.websites.map((row) => ({
    id: row.websiteId,
    websiteId: row.websiteId,
    websiteUrl: row.websiteUrl,
    websiteName: row.websiteName,
    childCompanyName: row.childCompanyName,
    totalChats: row.totalChats,
    billableChats: row.billableChats,
    chargeableChats: row.chargeableChats,
    costPerChat: row.costPerChat,
    chatCharges: row.chatCharges,
    platformFee: row.platformFee,
    aiToolsFee: row.aiToolsFee,
    extraCharges: row.extraCharges,
    modulesFee: row.modulesFee,
    lineTotal: row.lineTotal,
  }));

  return {
    id: `preview-${parent.parentCompanyId}`,
    invoiceNumber: parent.existingInvoice?.invoiceNumber ?? "PREVIEW",
    status: parent.existingInvoice?.status ?? "pending",
    currency: options.currency,
    companyId: parent.parentCompanyId,
    companyName: parent.parentCompanyName,
    websiteId: null,
    websiteName: null,
    websiteUrl: null,
    resellerId: null,
    resellerName: null,
    periodStart: options.periodStart,
    periodEnd: options.periodEnd,
    totalChats: lineItems.reduce((sum, row) => sum + row.totalChats, 0),
    billableChats: lineItems.reduce((sum, row) => sum + row.billableChats, 0),
    freeChatsIncluded: options.freeChatsPerMonth,
    costPerChat: options.costPerChat,
    platformFee: lineItems.reduce((sum, row) => sum + row.platformFee, 0),
    aiToolsFee: lineItems.reduce((sum, row) => sum + row.aiToolsFee, 0),
    extraCharges: lineItems.reduce((sum, row) => sum + row.extraCharges, 0),
    subtotal: parent.subtotal,
    discountAmount: 0,
    totalAmount: parent.subtotal,
    issuedDate: new Date().toISOString().slice(0, 10),
    dueDate: null,
    paidDate: null,
    notes: null,
    publicPaymentToken: null,
    parentCompanyId: parent.parentCompanyId,
    parentCompanyName: parent.parentCompanyName,
    isAgencySelfBill: false,
    lineItems,
  };
}
