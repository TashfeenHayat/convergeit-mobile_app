import { apiClient } from "../http/axios-instance";
import {
  formatKnowledgeMatchCitation,
  resolveVisitorAiMessageContent,
} from "@/lib/widget-runtime/visitor-ai-display";

export type AgentAiAction =
  | "suggested_reply"
  | "summarize"
  | "rewrite_tone"
  | "knowledge_lookup"
  | "coach_reply";

export interface AiAgentSuggestRequest {
  action: AgentAiAction;
  input: string;
  /** KB grounding — omit when empty; not required for `summarize`. */
  websiteId?: string;
  conversationId?: string;
  tone?: string;
}

export interface AgentSuggestParsed {
  reply: string;
  sources: string[];
}

function unwrapSuccessEnvelope(payload: unknown): unknown {
  if (
    payload !== null &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    "success" in payload &&
    (payload as { success?: unknown }).success === true &&
    "data" in payload
  ) {
    return (payload as { data: unknown }).data;
  }
  return payload;
}

function readKnowledgeMatches(data: unknown): unknown[] {
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];
  const o = data as Record<string, unknown>;
  const km = o.knowledgeMatches ?? o.knowledge_matches ?? o.matches ?? o.output;
  return Array.isArray(km) ? km : [];
}

function matchScore(item: unknown): number {
  if (!item || typeof item !== "object") return 0;
  const s = (item as Record<string, unknown>).score;
  return typeof s === "number" && Number.isFinite(s) ? s : 0;
}

function readMatchSnippet(item: unknown): string {
  if (!item || typeof item !== "object") return "";
  const o = item as Record<string, unknown>;
  for (const key of ["snippet", "text", "content", "chunk", "body", "excerpt"]) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/** Turn structured KB lines (Product Name, Description, …) into a visitor-style sentence. */
export function formatKbSnippetAsNaturalReply(snippet: string): string {
  const lines = snippet
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return "";

  const fields: Record<string, string> = {};
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key && val) fields[key] = val;
  }

  const name = fields["Product Name"] ?? fields["Name"] ?? fields["Title"];
  const desc = fields["Description"] ?? fields["Answer"] ?? fields["Body"];
  const priceRaw = fields["Price (USD)"] ?? fields["Price"];
  const use = fields["Use"] ?? fields["Usage"];
  const rating = fields["Rating"];

  if (name && desc) {
    const product = name.replace(/^our\s+/i, "").trim();
    const descClean = desc.replace(/\.$/, "").trim();
    let sentence = `Our ${product}`;
    if (/^(bluetooth|wireless|portable|smart|led|gaming|fitness)/i.test(descClean)) {
      sentence += ` are ${descClean.charAt(0).toLowerCase()}${descClean.slice(1)}`;
    } else {
      sentence += `: ${descClean}`;
    }
    if (priceRaw) {
      const p = priceRaw.startsWith("$") ? priceRaw : `$${priceRaw}`;
      sentence += `. They are priced at ${p}`;
    }
    if (rating) sentence += ` and rated ${rating}`;
    sentence += ".";
    if (use) sentence += ` Best for ${use.replace(/\.$/, "")}.`;
    return sentence;
  }

  if (fields.Question && fields.Answer) {
    return fields.Answer;
  }

  return lines.join("\n");
}

function replyFromKnowledgeMatches(matches: unknown[]): string {
  if (!matches.length) return "I couldn't find anything in the knowledge base for that question.";
  const sorted = [...matches].sort((a, b) => matchScore(b) - matchScore(a));
  const top = readMatchSnippet(sorted[0]);
  if (!top) return "I couldn't find anything in the knowledge base for that question.";
  return formatKbSnippetAsNaturalReply(top);
}

/**
 * Prefer a human-readable assistant string from `/ai/agent/suggest-reply` payloads
 * (envelope or flat; several possible field names).
 */
export function formatAgentSuggestResponse(payload: unknown): string {
  return parseAgentSuggestResponse(payload).reply;
}

/** Parse reply text + KB citation lines (same shape as visitor `/ai/visitor/respond`). */
export function parseAgentSuggestResponse(payload: unknown): AgentSuggestParsed {
  const data = unwrapSuccessEnvelope(payload);
  const knowledgeMatches = readKnowledgeMatches(data);

  if (knowledgeMatches.length > 0) {
    const action =
      data && typeof data === "object" && !Array.isArray(data)
        ? String((data as Record<string, unknown>).action ?? "").toLowerCase()
        : "";
    const sources = knowledgeMatches
      .map((m) => formatKnowledgeMatchCitation(m))
      .filter(Boolean)
      .slice(0, 3);

    if (action === "knowledge_lookup" || !hasPlainTextReply(data)) {
      return { reply: replyFromKnowledgeMatches(knowledgeMatches), sources };
    }
  }

  let primary = "";
  if (typeof data === "string" && data.trim()) {
    primary = data.trim();
  } else if (data && typeof data === "object" && !Array.isArray(data)) {
    const o = data as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    if (!Array.isArray(o.output)) {
      primary =
        str(o.output) ||
        str(o.reply) ||
        str(o.response) ||
        str(o.text) ||
        str(o.message) ||
        str(o.suggestedReply) ||
        str(o.suggested_reply) ||
        str(o.content) ||
        str(o.body);
    }
  }

  const topKm =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>).topKnowledgeMatch ??
        (data as Record<string, unknown>).top_knowledge_match
      : undefined;
  const reply = resolveVisitorAiMessageContent(primary, knowledgeMatches, topKm);
  const sources = knowledgeMatches
    .map((m) => formatKnowledgeMatchCitation(m))
    .filter(Boolean)
    .slice(0, 3);

  if (reply && !looksLikeRawJson(reply)) {
    return { reply, sources };
  }

  if (knowledgeMatches.length > 0) {
    return { reply: replyFromKnowledgeMatches(knowledgeMatches), sources };
  }

  if (data && typeof data === "object") {
    return { reply: "No answer available. Try rephrasing your question.", sources: [] };
  }

  return {
    reply: typeof payload === "string" ? payload : "No answer available.",
    sources: [],
  };
}

function hasPlainTextReply(data: unknown): boolean {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const o = data as Record<string, unknown>;
  if (Array.isArray(o.output)) return false;
  const str = (v: unknown) => (typeof v === "string" && v.trim().length > 0);
  return (
    str(o.reply) ||
    str(o.response) ||
    str(o.text) ||
    str(o.message) ||
    str(o.suggestedReply) ||
    str(o.content) ||
    str(o.body) ||
    (typeof o.output === "string" && o.output.trim().length > 0)
  );
}

function looksLikeRawJson(text: string): boolean {
  const t = text.trim();
  return t.startsWith("{") && t.includes('"action"');
}

export async function postAgentAiSuggestion(
  body: AiAgentSuggestRequest,
): Promise<unknown> {
  const payload: Record<string, unknown> = {
    action: body.action,
    input: body.input,
  };
  const wid = body.websiteId?.trim();
  if (wid) payload.websiteId = wid;
  const cid = body.conversationId?.trim();
  if (cid) payload.conversationId = cid;
  const tone = body.tone?.trim();
  if (tone) payload.tone = tone;

  const { data } = await apiClient.post<unknown>("/ai/agent/suggest-reply", payload);
  return data;
}
