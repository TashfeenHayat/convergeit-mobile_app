import type { PlatformStripeConfig } from "@/api/billing/stripe-config.api";
import type { ResellerBillingPolicyView } from "@/api/billing/reseller-billing-policy.api";

export type PaymentSetupTone = "success" | "warning";

export type PaymentSetupStatus = {
  ok: boolean;
  label: string;
  tone: PaymentSetupTone;
};

export function isPlatformStripeApiReady(stripe?: PlatformStripeConfig | null): boolean {
  return Boolean(stripe?.hasSecretKey && stripe?.publishableKey?.trim());
}

export function isPlatformStripeWebhookReady(stripe?: PlatformStripeConfig | null): boolean {
  return Boolean(stripe?.hasWebhookSecret);
}

export function isResellerStripeApiReady(policy?: ResellerBillingPolicyView | null): boolean {
  return Boolean(policy?.hasSecretKey && policy?.publishableKey?.trim());
}

export function isResellerStripeWebhookReady(policy?: ResellerBillingPolicyView | null): boolean {
  return Boolean(policy?.hasWebhookSecret);
}

/** Checkout works once Stripe API keys are saved and payments are enabled. */
export function isPlatformPaymentSetupComplete(stripe?: PlatformStripeConfig | null): boolean {
  return isPlatformStripeApiReady(stripe) && stripe?.isEnabled !== false;
}

export function isResellerPaymentSetupComplete(policy?: ResellerBillingPolicyView | null): boolean {
  return isResellerStripeApiReady(policy) && policy?.isEnabled !== false;
}

export function getPlatformPaymentSetupStatus(
  stripe?: PlatformStripeConfig | null,
): PaymentSetupStatus {
  if (!isPlatformStripeApiReady(stripe)) {
    return { ok: false, label: "Add Stripe keys", tone: "warning" };
  }
  if (stripe?.isEnabled === false) {
    return { ok: false, label: "Payments disabled", tone: "warning" };
  }
  if (!isPlatformStripeWebhookReady(stripe)) {
    return { ok: true, label: "Payments ready", tone: "success" };
  }
  return { ok: true, label: "Payments ready", tone: "success" };
}

export function getResellerPaymentSetupStatus(
  policy?: ResellerBillingPolicyView | null,
): PaymentSetupStatus {
  if (!isResellerStripeApiReady(policy)) {
    return { ok: false, label: "Add Stripe keys", tone: "warning" };
  }
  if (policy?.isEnabled === false) {
    return { ok: false, label: "Payments disabled", tone: "warning" };
  }
  if (!isResellerStripeWebhookReady(policy)) {
    return { ok: true, label: "Payments ready", tone: "success" };
  }
  return { ok: true, label: "Payments ready", tone: "success" };
}
