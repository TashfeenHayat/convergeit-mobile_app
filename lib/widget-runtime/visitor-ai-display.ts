/**
 * When POST /ai/visitor/respond retrieves KB chunks but the LLM step fails, backends often still
 * return a canned `response` while `knowledgeMatches` carries usable text. Prefer showing KB text
 * in that case so FAQ/text-trained widgets remain helpful.
 */

function isLikelyUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim());
}

/** True when the model body is missing or clearly a generic failure string. */
export function isDegradedVisitorAiReply(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  return (
    /temporarily unavailable/i.test(t) ||
    /try again in a moment/i.test(t) ||
    /unable to (generate|produce|complete) a reply/i.test(t) ||
    /could not generate/i.test(t)
  );
}

function readSnippetFromMatch(m: Record<string, unknown>): string {
  const candidates = [m.snippet, m.text, m.content, m.chunk, m.body, m.excerpt, m.preview];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) return c.trim();
  }
  const ref = typeof m.sourceRef === "string" ? m.sourceRef.trim() : "";
  return ref;
}

/** Short line for "Sources:" — avoid repeating full FAQ text already shown in the bubble. */
export function formatKnowledgeMatchCitation(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const m = raw as Record<string, unknown>;
  const ref = typeof m.sourceRef === "string" ? m.sourceRef.trim() : "";
  if (ref && isLikelyUrl(ref)) return ref;
  if (ref.length > 0 && ref.length <= 96) return ref;
  const title = typeof m.title === "string" ? m.title.trim() : "";
  if (title) return title.length > 96 ? `${title.slice(0, 93)}…` : title;
  const sid = typeof m.sourceId === "string" ? m.sourceId.trim() : "";
  return sid ? `Source ${sid.slice(0, 8)}…` : "";
}

/** Concatenate up to `max` distinct KB snippets for display when the LLM reply is degraded. */
export function extractKnowledgeSnippetsForFallback(
  knowledgeMatches: unknown,
  max = 3,
): string {
  if (!Array.isArray(knowledgeMatches) || knowledgeMatches.length === 0) return "";
  const parts: string[] = [];
  const seen = new Set<string>();
  for (const raw of knowledgeMatches) {
    if (!raw || typeof raw !== "object") continue;
    const s = readSnippetFromMatch(raw as Record<string, unknown>);
    if (!s || seen.has(s)) continue;
    seen.add(s);
    parts.push(s);
    if (parts.length >= max) break;
  }
  if (!parts.length) return "";
  return parts.join("\n\n—\n\n");
}

export function resolveVisitorAiMessageContent(
  response: string,
  knowledgeMatches?: unknown,
  topKnowledgeMatch?: unknown,
): string {
  const primary = (response ?? "").trim();
  if (!isDegradedVisitorAiReply(primary)) return primary;
  const kb = extractKnowledgeSnippetsForFallback(knowledgeMatches);
  if (kb) return kb;
  if (topKnowledgeMatch && typeof topKnowledgeMatch === "object") {
    const preview = (topKnowledgeMatch as { chunkPreview?: string }).chunkPreview;
    if (typeof preview === "string" && preview.trim().length > 0) {
      return preview.trim();
    }
  }
  return primary;
}

/** Read `content` from a widget conversation message DTO or loose API object. */
export function readWidgetMessageContent(msg: unknown): string {
  if (!msg || typeof msg !== "object") return "";
  const m = msg as Record<string, unknown>;
  return typeof m.content === "string" ? m.content.trim() : "";
}
