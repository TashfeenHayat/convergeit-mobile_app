export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

export function getStripeWebhookUrl(): string {
  return `${getApiBaseUrl()}/webhooks/stripe`;
}

export function getResellerStripeWebhookUrl(webhookSlug: string): string {
  const slug = webhookSlug.trim();
  return `${getApiBaseUrl()}/pay/${encodeURIComponent(slug)}`;
}

export function getPublicPayBaseUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/pay`;
  }
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "") + "/pay";
}
