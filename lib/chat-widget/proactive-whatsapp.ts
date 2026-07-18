import { validateSingleHttpUrl } from "./widget-field-validation";

/** Normalize phone digits or partial input into a wa.me link. */
export function normalizeWhatsAppHref(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}`;
}

export function validateWhatsAppHref(raw: string): string | null {
  const href = normalizeWhatsAppHref(raw);
  if (!href) return "Enter a WhatsApp number or link.";
  const base = validateSingleHttpUrl(href, { label: "WhatsApp link" });
  if (base) return base;
  const lower = href.toLowerCase();
  if (!lower.includes("wa.me") && !lower.includes("whatsapp.com")) {
    return "Use a wa.me or whatsapp.com link, or enter a phone number.";
  }
  return null;
}
