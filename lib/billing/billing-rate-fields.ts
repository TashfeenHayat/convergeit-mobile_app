export const BILLING_CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "AED", label: "AED" },
  { value: "PKR", label: "PKR" },
];

export type BillingRateFieldsValues = {
  currency: string;
  billingCycle: "monthly" | "yearly";
  clientBillingMode: "trial" | "live";
  clientTrialDays: string;
  costPerChat: string;
  freeChats: string;
  monthlyChats: string;
  platformFee: string;
  aiToolsFee: string;
  modulesFee: string;
};

export type BillingEnabledService = {
  code: string;
  name: string;
};

export function defaultBillingRateFields(currency = "USD"): BillingRateFieldsValues {
  return {
    currency,
    billingCycle: "monthly",
    clientBillingMode: "trial",
    clientTrialDays: "14",
    costPerChat: "0",
    freeChats: "0",
    monthlyChats: "",
    platformFee: "0",
    aiToolsFee: "0",
    modulesFee: "0",
  };
}

export function calcChatCharges(
  billableChats: number,
  freeChatsIncluded: number,
  costPerChat: number,
): number {
  const chargeableChats = Math.max(0, billableChats - Math.max(0, freeChatsIncluded));
  return roundMoney(chargeableChats * Math.max(0, costPerChat));
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function resolveModulesFeeMonthly(
  typedModulesFee: string,
  profileModulesFee?: number | null,
  contractModulesFee?: number | null,
): number {
  const raw = typedModulesFee.trim();
  if (raw) {
    const value = Number(raw);
    if (Number.isFinite(value) && value >= 0) return value;
  }
  if (
    profileModulesFee != null &&
    Number.isFinite(profileModulesFee) &&
    profileModulesFee >= 0
  ) {
    return profileModulesFee;
  }
  if (
    contractModulesFee != null &&
    Number.isFinite(contractModulesFee) &&
    contractModulesFee >= 0
  ) {
    return contractModulesFee;
  }
  return 0;
}

export type DraftLineComputed = {
  modulesFee: number;
  platformFee: number;
  aiToolsFee: number;
  extraCharges: number;
  chatCharges: number;
  billableChats: number;
  chargeableChats: number;
  costPerChat: number;
  lineSubtotal: number;
  softwarePackage: number;
  supportFee: number;
  chatUsage: number;
};

export function computeDraftLineTotals(
  draft: Pick<
    BillingRateFieldsValues,
    | "costPerChat"
    | "freeChats"
    | "monthlyChats"
    | "platformFee"
    | "aiToolsFee"
    | "modulesFee"
  > & {
    billableChats: number;
    extraCharges: string;
  },
): DraftLineComputed {
  const modulesFee = Number(draft.modulesFee) || 0;
  const platformFee = Number(draft.platformFee) || 0;
  const aiToolsFee = Number(draft.aiToolsFee) || 0;
  const extraCharges = Number(draft.extraCharges) || 0;
  const costPerChat = Number(draft.costPerChat) || 0;
  const freeChatsIncluded = Number(draft.freeChats) || 0;
  const billableChats = draft.monthlyChats.trim()
    ? Number(draft.monthlyChats) || 0
    : draft.billableChats;
  const chargeableChats = Math.max(0, billableChats - Math.max(0, freeChatsIncluded));
  const chatCharges = calcChatCharges(billableChats, freeChatsIncluded, costPerChat);
  const lineSubtotal = roundMoney(modulesFee + platformFee + aiToolsFee + extraCharges + chatCharges);

  return {
    modulesFee,
    platformFee,
    aiToolsFee,
    extraCharges,
    chatCharges,
    billableChats,
    chargeableChats,
    costPerChat,
    lineSubtotal,
    softwarePackage: modulesFee,
    supportFee: platformFee + aiToolsFee + extraCharges,
    chatUsage: chatCharges,
  };
}
