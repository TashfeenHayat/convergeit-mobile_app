function capitalizeWordSegment(segment: string): string {
  if (!segment) return segment;
  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
}

/** Title case: capitalize each word (space-separated); hyphen segments too. */
export function sidebarNavLabel(text: string): string {
  if (!text) return text;
  return text
    .split(/\s+/)
    .map((word) =>
      word.includes("-") ? word.split("-").map(capitalizeWordSegment).join("-") : capitalizeWordSegment(word),
    )
    .join(" ");
}
