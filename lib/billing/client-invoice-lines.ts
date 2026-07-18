export type ClientInvoiceLineParts = {
  softwarePackage: number;
  supportFee: number;
  chatUsage: number;
  billableChats: number;
  chargeableChats: number;
  costPerChat: number;
  freeChatsUsed: number;
  /**
   * Sum of software/support/chat components before discount/waiver.
   * Derived from displayed components, not stored in DB.
   */
  preDiscountSubtotal: number;
  /**
   * Effective discount for this line:
   * (preDiscountSubtotal - lineTotal), if lineTotal is provided.
   */
  effectiveDiscount: number;
};

export type ClientInvoiceItemRowKind = "site-header" | "charge" | "discount" | "site-total";

export type ClientInvoiceItemRow = {
  siteIndex: number;
  rowKind: ClientInvoiceItemRowKind;
  description: string;
  rate: string | null;
  quantity: string | null;
  amount: number | null;
};

export type ClientInvoiceLineInput = {
  id?: string;
  websiteId?: string;
  websiteUrl?: string;
  websiteName?: string | null;
  childCompanyName?: string | null;
  totalChats?: number;
  modulesFee?: number;
  platformFee: number;
  aiToolsFee: number;
  extraCharges?: number;
  chatCharges: number;
  lineTotal?: number;
  billableChats?: number;
  chargeableChats?: number;
  costPerChat?: number | null;
};

function formatMoney(currency: string, amount: number): string {
  return `${currency} ${amount.toFixed(2)}`;
}

function formatPeriodRate(currency: string, amount: number): string {
  return `${formatMoney(currency, amount)} / period`;
}

function formatChatRate(currency: string, amount: number): string {
  return `${formatMoney(currency, amount)} / chat`;
}

function formatChatQuantity(parts: ClientInvoiceLineParts): string {
  const segments = [`${parts.chargeableChats} chargeable`];
  if (parts.freeChatsUsed > 0) {
    segments.push(`${parts.freeChatsUsed} free`);
  }
  if (parts.billableChats > 0) {
    segments.push(`${parts.billableChats} billable`);
  }
  return segments.join(" · ");
}

export function clientInvoiceLineParts(row: {
  modulesFee?: number;
  platformFee: number;
  aiToolsFee: number;
  extraCharges?: number;
  chatCharges: number;
  lineTotal?: number;
  billableChats?: number;
  chargeableChats?: number;
  costPerChat?: number | null;
}): ClientInvoiceLineParts {
  const round2 = (v: number) => Math.round(v * 100) / 100;

  const softwarePackage = row.modulesFee ?? 0;
  const supportFee = row.platformFee + row.aiToolsFee + (row.extraCharges ?? 0);
  const chatUsage = row.chatCharges;

  const preDiscountSubtotal = round2(softwarePackage + supportFee + chatUsage);

  const billableChats = row.billableChats ?? 0;
  const chargeableChats = row.chargeableChats ?? 0;
  const costPerChat = row.costPerChat ?? 0;

  // Free included may exceed billable; show "free used" based on charged vs billable.
  const freeChatsUsed = Math.max(0, billableChats - chargeableChats);

  const effectiveDiscount =
    typeof row.lineTotal === "number"
      ? Math.max(0, round2(preDiscountSubtotal - row.lineTotal))
      : 0;

  return {
    softwarePackage,
    supportFee,
    chatUsage,
    billableChats,
    chargeableChats,
    costPerChat,
    freeChatsUsed,
    preDiscountSubtotal,
    effectiveDiscount,
  };
}

export function clientInvoiceLineTotal(parts: ClientInvoiceLineParts): number {
  return parts.softwarePackage + parts.supportFee + parts.chatUsage;
}

export function buildClientInvoiceItemRows(
  line: ClientInvoiceLineInput,
  options: { currency: string; siteIndex: number },
): ClientInvoiceItemRow[] {
  const { currency, siteIndex } = options;
  const parts = clientInvoiceLineParts(line);
  const rows: ClientInvoiceItemRow[] = [];

  const websiteLabel = line.websiteName?.trim() || line.websiteUrl?.trim() || "Website";
  const childCompany = line.childCompanyName?.trim();
  const siteHeader = childCompany ? `${websiteLabel} · ${childCompany}` : websiteLabel;

  rows.push({
    siteIndex,
    rowKind: "site-header",
    description: siteHeader,
    rate: null,
    quantity: null,
    amount: null,
  });

  if (parts.softwarePackage > 0) {
    rows.push({
      siteIndex,
      rowKind: "charge",
      description: "Software package",
      rate: formatPeriodRate(currency, parts.softwarePackage),
      quantity: "1",
      amount: parts.softwarePackage,
    });
  }

  if (line.platformFee > 0) {
    rows.push({
      siteIndex,
      rowKind: "charge",
      description: "Platform support fee",
      rate: formatPeriodRate(currency, line.platformFee),
      quantity: "1",
      amount: line.platformFee,
    });
  }

  if (line.aiToolsFee > 0) {
    rows.push({
      siteIndex,
      rowKind: "charge",
      description: "AI tools fee",
      rate: formatPeriodRate(currency, line.aiToolsFee),
      quantity: "1",
      amount: line.aiToolsFee,
    });
  }

  if ((line.extraCharges ?? 0) > 0) {
    rows.push({
      siteIndex,
      rowKind: "charge",
      description: "Extra charges",
      rate: "—",
      quantity: "1",
      amount: line.extraCharges ?? 0,
    });
  }

  const showChatRow =
    parts.chatUsage > 0 ||
    parts.chargeableChats > 0 ||
    parts.billableChats > 0 ||
    parts.costPerChat > 0;

  if (showChatRow) {
    rows.push({
      siteIndex,
      rowKind: "charge",
      description: "Chat usage",
      rate: formatChatRate(currency, parts.costPerChat),
      quantity: formatChatQuantity(parts),
      amount: parts.chatUsage,
    });
  }

  if (parts.effectiveDiscount > 0) {
    rows.push({
      siteIndex,
      rowKind: "discount",
      description: "Discount",
      rate: "—",
      quantity: "—",
      amount: -parts.effectiveDiscount,
    });
  }

  rows.push({
    siteIndex,
    rowKind: "site-total",
    description: "Site total",
    rate: null,
    quantity: null,
    amount: line.lineTotal ?? parts.preDiscountSubtotal - parts.effectiveDiscount,
  });

  return rows;
}

export function buildInvoiceItemRowsFromLines(
  lines: ClientInvoiceLineInput[],
  currency: string,
): ClientInvoiceItemRow[] {
  return lines.flatMap((line, index) =>
    buildClientInvoiceItemRows(line, { currency, siteIndex: index + 1 }),
  );
}

/** Build line inputs from stored line items, or a single synthetic row from invoice header fields. */
export function normalizeInvoiceLineInputs(invoice: {
  id: string;
  websiteId?: string | null;
  websiteUrl?: string | null;
  websiteName?: string | null;
  companyName?: string | null;
  totalChats?: number | null;
  billableChats?: number | null;
  freeChatsIncluded?: number | null;
  costPerChat?: number | null;
  platformFee?: number | null;
  aiToolsFee?: number | null;
  extraCharges?: number | null;
  totalAmount: number;
  lineItems?: ClientInvoiceLineInput[];
}): ClientInvoiceLineInput[] {
  if (invoice.lineItems?.length) {
    return invoice.lineItems;
  }

  const billableChats = invoice.billableChats ?? 0;
  const freeChats = invoice.freeChatsIncluded ?? 0;
  const chargeableChats = Math.max(0, billableChats - freeChats);
  const costPerChat = invoice.costPerChat ?? 0;
  const platformFee = invoice.platformFee ?? 0;
  const aiToolsFee = invoice.aiToolsFee ?? 0;
  const extraCharges = invoice.extraCharges ?? 0;
  const chatCharges = chargeableChats * costPerChat;

  return [
    {
      id: invoice.id,
      websiteId: invoice.websiteId ?? undefined,
      websiteUrl: invoice.websiteUrl ?? undefined,
      websiteName: invoice.websiteName,
      childCompanyName: invoice.companyName,
      totalChats: invoice.totalChats ?? 0,
      billableChats,
      chargeableChats,
      costPerChat,
      chatCharges,
      platformFee,
      aiToolsFee,
      extraCharges,
      modulesFee: Math.max(
        0,
        invoice.totalAmount - platformFee - aiToolsFee - extraCharges - chatCharges,
      ),
      lineTotal: invoice.totalAmount,
    },
  ];
}
