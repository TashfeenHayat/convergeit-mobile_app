import { resolveWebsiteRowUrlLabels } from "./format-website-display-url";

/** Max width for SelectField / autocomplete options (single line). */
export const WEBSITE_SELECT_LABEL_MAX_LEN = 44;

function truncateEnd(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(1, maxLength - 1))}…`;
}

/**
 * One-line website label for dropdowns: host + path only, no UTM query string.
 */
export function formatWebsiteSelectLabel(
  name?: string | null,
  url?: string | null,
  fallbackId?: string,
  maxLength = WEBSITE_SELECT_LABEL_MAX_LEN,
): string {
  const u = String(url ?? "").trim();
  const n = String(name ?? "").trim();

  if (u || n) {
    const { primary, secondary } = resolveWebsiteRowUrlLabels(n, u);
    if (secondary) {
      const namePart = truncateEnd(primary, Math.min(22, maxLength - 12));
      const urlPart = truncateEnd(secondary, Math.min(28, maxLength - namePart.length - 3));
      return truncateEnd(`${namePart} · ${urlPart}`, maxLength);
    }
    return truncateEnd(primary, maxLength);
  }

  const id = String(fallbackId ?? "").trim();
  return id ? truncateEnd(id, 12) : "Website";
}

/** Map assignment/API website row → `{ value, label }` for SelectField. */
export function websiteAssignmentItemToSelectOption(item: {
  websiteId: string;
  name?: string | null;
  url?: string | null;
}): { value: string; label: string } {
  return {
    value: item.websiteId,
    label: formatWebsiteSelectLabel(item.name, item.url, item.websiteId),
  };
}
