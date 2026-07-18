/** XSS-safe plain text rendering (trim + normalize newlines only). Prefer this over dangerouslySetInnerHTML. */
export function normalizeChatMessageText(raw: string | undefined | null): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/\r\n/g, "\n").trim();
}

/** Escape entities for inserting user content into DOM text nodes or when building HTML-as-string intentionally. */
export function escapeHtmlTextContent(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
