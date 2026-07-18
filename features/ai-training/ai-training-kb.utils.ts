import type {
  AssistantSourceType,
  ChatbotSourceType,
  KnowledgeScrapeProgress,
  KnowledgeTrainingTier,
} from "@/api/ai-knowledge/types";
import type { CreateKnowledgeSourceResult } from "@/api/ai-knowledge/types";

export type AiTrainingKbVariant = "assistant" | "chatbot";

export const CHATBOT_SOURCE_TYPE_OPTIONS: { label: string; value: ChatbotSourceType }[] = [
  { label: "Website URL (auto scrape)", value: "URL" },
  { label: "Visitor FAQs (paste text)", value: "FAQ" },
];

export const CHATBOT_WEBSITE_URL_HELPER =
  "Paste your homepage or any page on your registered domain. We find sitemap.xml (robots.txt), crawl same-site pages (up to the configured page limit), and index them — no sitemap link needed.";

export const ASSISTANT_WEBSITE_URL_HELPER =
  "Paste a page on your registered domain. We auto-find the sitemap, scrape the site, and index it for AI Assistant — separate from visitor chatbot and inbox copilot.";

export const FAQ_PASTE_EXAMPLE_CHATBOT = `What is your return policy?
Returns accepted within 14 days with receipt.

Q: What are your hours?
A: Monday–Friday 9am–6pm EST.`;

export const FAQ_PASTE_EXAMPLE_ASSISTANT = `Q: How do I reset a customer password?
A: Open CRM → Users → Reset password, then confirm by email.

What is the escalation path for billing disputes?
Route to Billing L2 via the #billing-escalations channel.`;

/** Shown in UI; backend default is higher (see KB_WEB_MAX_PAGES). */
export const KB_WEB_MAX_PAGES_HINT = 25;

/** Poll while sources are indexing — live scrape progress updates. */
export const KB_TRAINING_SOURCES_POLL_MS = 4_000;

export const KB_BACKGROUND_TRAINING_STARTED_MESSAGE =
  "We train in two steps: basic pages first (test in a few minutes), then the rest of your site in the background until fully trained.";

export function isBasicTrainingReady(
  progress: KnowledgeScrapeProgress | null | undefined,
  tier: KnowledgeTrainingTier | null | undefined,
): boolean {
  if (tier === "basic_ready" || tier === "full") return true;
  return progress?.trainingTier === "basic_ready" || progress?.trainingTier === "full";
}

export function formatTrainingTierBanner(
  progress: KnowledgeScrapeProgress | null | undefined,
  tier: KnowledgeTrainingTier | null | undefined,
): { severity: "success" | "info"; title: string; body: string } | null {
  const t = tier ?? progress?.trainingTier;
  if (t === "basic_ready") {
    return {
      severity: "success",
      title: "Basic training ready — test now",
      body:
        "Main pages are indexed. Open Automation studio and test chat — answers use basic pages for now. The rest of your site is still scraping in the background.",
    };
  }
  if (t === "full") {
    const done = progress?.pagesDone ?? 0;
    const total = progress?.pagesTotal;
    const pieces = progress?.chunksIndexed ?? 0;
    const uiPhase = resolveFullScrapeUiPhase(progress);
    const countTail =
      total != null && total > 0
        ? ` (${Math.min(done, total)}/${total} pages).`
        : ".";
    let body: string;
    if (uiPhase === "finishing_pages") {
      body =
        `All planned pages are queued${countTail} Finishing slow pages in parallel — ` +
        `${pieces} piece${pieces === 1 ? "" : "s"} indexed so far. Test chat already works on indexed content.`;
    } else if (uiPhase === "embedding") {
      body =
        `All pages scraped${countTail} Batch embedding ${pieces} piece${pieces === 1 ? "" : "s"} into the search index — almost done.`;
    } else {
      body =
        `Background scrape continues${countTail} You'll be fully trained soon — test chat already works on indexed content.`;
    }
    return {
      severity: "info",
      title:
        uiPhase === "embedding"
          ? "Full training · embedding"
          : uiPhase === "finishing_pages"
            ? "Full training · finishing pages"
            : "Full training in progress",
      body,
    };
  }
  if (t === "basic" && progress) {
    return {
      severity: "info",
      title: "Basic training starting",
      body: `Indexing priority pages first (${Math.min(progress.basicPagesDone, progress.basicPagesTotal)}/${progress.basicPagesTotal || "…"}). You can test shortly after basic training completes.`,
    };
  }
  return null;
}

export const ASSISTANT_SOURCE_TYPE_OPTIONS: { label: string; value: AssistantSourceType }[] = [
  { label: "Website URL (auto scrape)", value: "URL" },
  { label: "FAQ / policy text", value: "FAQ" },
  { label: "Excel Sheet File", value: "EXCEL" },
  { label: "PDF document", value: "PDF" },
  { label: "Word document (DOCX)", value: "DOCX" },
  { label: "SOP / procedure text", value: "SOP" },
];

export const ASSISTANT_PDF_ACCEPT = "application/pdf,.pdf";
export const ASSISTANT_DOCX_ACCEPT =
  ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const ASSISTANT_EXCEL_ACCEPT =
  ".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv";

export function assistantFileAcceptForSourceType(sourceType: string): string {
  if (sourceType === "DOCX") return ASSISTANT_DOCX_ACCEPT;
  if (sourceType === "EXCEL") return ASSISTANT_EXCEL_ACCEPT;
  return ASSISTANT_PDF_ACCEPT;
}

export function assistantFileUploadButtonLabel(sourceType: string): string {
  if (sourceType === "DOCX") return "Choose DOCX file";
  if (sourceType === "EXCEL") return "Choose Excel file";
  return "Choose PDF file";
}

/** After page counter hits total: parallel fetches still running vs Gemini embed. */
export type FullScrapeUiPhase = "scraping" | "finishing_pages" | "embedding";

export function resolveFullScrapeUiPhase(
  progress: KnowledgeScrapeProgress | null | undefined,
): FullScrapeUiPhase | null {
  if (!progress) return null;
  if (progress.trainingTier !== "full") return null;
  if (progress.pagesTotal == null || progress.pagesTotal <= 0) return "scraping";
  const done = Math.min(progress.pagesDone, progress.pagesTotal);
  if (done < progress.pagesTotal) return "scraping";
  if ((progress.activePages?.length ?? 0) > 0) return "finishing_pages";
  return "embedding";
}

export function formatScrapeProgressLabel(
  progress: KnowledgeScrapeProgress | null | undefined,
): string | null {
  if (!progress) return null;
  if (
    progress.trainingTier === "basic" &&
    progress.basicPagesTotal > 0
  ) {
    const done = Math.min(progress.basicPagesDone, progress.basicPagesTotal);
    const tail =
      done >= progress.basicPagesTotal && progress.chunksIndexed === 0
        ? " · batch embedding…"
        : "";
    return `Basic ${done}/${progress.basicPagesTotal} · ${progress.chunksIndexed} pieces${tail}`;
  }
  if (progress.pagesTotal != null && progress.pagesTotal > 0) {
    const done = Math.min(progress.pagesDone, progress.pagesTotal);
    const prefix =
      progress.trainingTier === "full" || progress.trainingTier === "basic_ready"
        ? "Full "
        : "";
    const uiPhase = resolveFullScrapeUiPhase(progress);
    const phaseTail =
      uiPhase === "finishing_pages"
        ? " · finishing last pages…"
        : uiPhase === "embedding"
          ? " · batch embedding…"
          : "";
    return `${prefix}${done}/${progress.pagesTotal} pages · ${progress.chunksIndexed} pieces${phaseTail}`;
  }
  if (progress.pagesDone > 0) {
    return `${progress.pagesDone} page${progress.pagesDone === 1 ? "" : "s"} · ${progress.chunksIndexed} pieces`;
  }
  return "Starting scrape…";
}

export function formatScrapePhaseLabel(
  progress: KnowledgeScrapeProgress | null | undefined,
): string {
  if (!progress) return "Preparing scrape…";
  if (progress.trainingTier === "basic") {
    return progress.currentPage ? "Basic training · scraping page" : "Basic training · priority pages";
  }
  if (progress.trainingTier === "basic_ready") {
    return "Basic ready · starting full site scrape";
  }
  if (progress.trainingTier === "full") {
    const uiPhase = resolveFullScrapeUiPhase(progress);
    if (uiPhase === "finishing_pages") {
      return progress.currentPage
        ? "Full training · finishing last pages"
        : "Full training · finishing last pages";
    }
    if (uiPhase === "embedding") {
      return "Full training · batch embedding";
    }
    switch (progress.phase) {
      case "discovering":
        return "Full training · finding remaining pages";
      case "scraping":
        return progress.currentPage ? "Full training · scraping page" : "Full training · background scrape";
      default:
        return "Full training in progress";
    }
  }
  switch (progress.phase) {
    case "discovering":
      return "Finding sitemap & page list";
    case "scraping":
      return progress.currentPage ? "Scraping page" : "Scraping site";
    case "done":
      return "Scrape complete";
    default:
      return progress.pagesDone > 0 ? "Scraping site" : "Starting scrape…";
  }
}

export function formatDurationSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/** Path + host for live scrape display (not full URL noise). */
export function formatScrapePageDisplay(
  url: string | null | undefined,
  title?: string | null,
): string | null {
  const t = title?.trim();
  if (t && t !== url?.trim()) return t;
  const raw = url?.trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    const search = parsed.search ?? "";
    const display = `${parsed.hostname}${path}${search}`;
    return display.length > 72 ? `${display.slice(0, 69)}…` : display;
  } catch {
    return raw.length > 72 ? `${raw.slice(0, 69)}…` : raw;
  }
}

export function computeCurrentPageElapsedSec(
  progress: KnowledgeScrapeProgress,
  nowMs = Date.now(),
): number | null {
  const startedAt = progress.currentPage?.startedAt;
  if (!startedAt) return null;
  const pageMs = Date.parse(startedAt);
  if (!Number.isFinite(pageMs)) return null;
  return Math.max(0, Math.floor((nowMs - pageMs) / 1000));
}

export function computeAvgSecPerPage(
  progress: KnowledgeScrapeProgress,
  nowMs = Date.now(),
): number | null {
  const done =
    progress.trainingTier === "basic" && progress.basicPagesTotal > 0
      ? progress.basicPagesDone
      : progress.pagesDone;
  if (done <= 0) return null;
  const startedMs = Date.parse(progress.startedAt);
  if (!Number.isFinite(startedMs)) return null;
  return Math.max(1, Math.round((nowMs - startedMs) / 1000 / done));
}

export function computeScrapeTiming(
  progress: KnowledgeScrapeProgress,
  nowMs = Date.now(),
): { elapsedSec: number; etaSec: number | null } {
  const startedMs = Date.parse(progress.startedAt);
  const elapsedSec = Number.isFinite(startedMs)
    ? Math.max(0, Math.floor((nowMs - startedMs) / 1000))
    : 0;
  let etaSec: number | null = null;
  if (
    progress.pagesTotal != null &&
    progress.pagesTotal > 0 &&
    progress.pagesDone > 0 &&
    progress.pagesDone < progress.pagesTotal &&
    Number.isFinite(startedMs)
  ) {
    const avgMs = (nowMs - startedMs) / progress.pagesDone;
    etaSec = Math.max(
      0,
      Math.ceil((avgMs * (progress.pagesTotal - progress.pagesDone)) / 1000),
    );
  } else {
    const uiPhase = resolveFullScrapeUiPhase(progress);
    if (uiPhase === "finishing_pages") {
      etaSec = 180;
    } else if (uiPhase === "embedding") {
      etaSec = 120;
    }
  }
  return { elapsedSec, etaSec };
}

/** Shown when computeScrapeTiming has no ETA (legacy fallback). */
export function formatScrapeEtaHint(
  progress: KnowledgeScrapeProgress,
  timing: { etaSec: number | null },
): string | null {
  if (timing.etaSec != null) return null;
  const uiPhase = resolveFullScrapeUiPhase(progress);
  if (uiPhase === "finishing_pages") return "Finishing last pages…";
  if (uiPhase === "embedding") return "Embedding chunks…";
  if (progress.pagesDone > 0) return "Estimating time…";
  return null;
}

export function hostFromWebsiteUrl(url: string): string | null {
  const t = url.trim();
  if (!t) return null;
  try {
    return new URL(t.startsWith("http") ? t : `https://${t}`).hostname;
  } catch {
    return null;
  }
}

export function isWebSourceType(sourceType: string): boolean {
  return sourceType === "URL" || sourceType === "WEB_CRAWL" || sourceType === "SITEMAP";
}

export function sourceTypeHumanLabel(sourceType: string): string {
  if (sourceType === "SITEMAP" || sourceType === "WEB_CRAWL") {
    return "Website URL (auto scrape)";
  }
  const found =
    CHATBOT_SOURCE_TYPE_OPTIONS.find((o) => o.value === sourceType) ??
    ASSISTANT_SOURCE_TYPE_OPTIONS.find((o) => o.value === sourceType);
  return found?.label ?? sourceType;
}

export type AiTrainingSourceCategory = "website" | "faq" | "documents" | "procedures";

export function categoryForSourceType(
  sourceType: string,
  variant: AiTrainingKbVariant,
): AiTrainingSourceCategory {
  if (sourceType === "FAQ") return "faq";
  if (sourceType === "SOP") return "procedures";
  if (isFileUploadSourceType(sourceType)) return "documents";
  if (isWebSourceType(sourceType)) return "website";
  return "faq";
}

export function sourceCategoriesForVariant(
  variant: AiTrainingKbVariant,
): { id: AiTrainingSourceCategory; label: string; description: string }[] {
  if (variant === "chatbot") {
    return [
      {
        id: "website",
        label: "Website scraping",
        description: "Paste your website URL — we find the sitemap and scrape automatically.",
      },
      {
        id: "faq",
        label: "Visitor FAQs",
        description: "Paste questions and answers the public chatbot should know.",
      },
    ];
  }
  return [
    {
      id: "website",
      label: "Website scraping",
      description:
        "Paste your website URL — we find the sitemap and scrape for Agent Copilot.",
    },
    {
      id: "faq",
      label: "FAQs & policies",
      description: "Text knowledge for Agent Copilot and internal AI.",
    },
    {
      id: "documents",
      label: "Documents",
      description: "Upload or link PDF, Word, or Excel files.",
    },
    {
      id: "procedures",
      label: "Procedures (SOP)",
      description: "Step-by-step internal workflows.",
    },
  ];
}

export type SourceMethodCard = {
  value: string;
  title: string;
  summary: string;
  bestFor: string;
  flowSteps: string[];
};

export function sourceMethodCardsForCategory(
  category: AiTrainingSourceCategory,
  variant: AiTrainingKbVariant,
  registeredHost: string | null,
): SourceMethodCard[] {
  const host = registeredHost ?? "your-registered-domain.com";

  if (category === "website") {
    const assistantFlow = variant === "assistant";
    return [
      {
        value: "URL",
        title: "Website URL",
        summary: assistantFlow
          ? `Paste any page on ${host} — we auto-find the sitemap and scrape for agents.`
          : `Paste any page on ${host} — we auto-find the sitemap and scrape your site.`,
        bestFor: assistantFlow
          ? "Public site pages agents should know — separate from visitor chatbot training."
          : "You only need your homepage; no sitemap.xml link required.",
        flowSteps: assistantFlow
          ? [
              "You paste one https URL (usually your homepage).",
              "We read robots.txt, discover sitemap.xml, and collect page URLs.",
              `Up to ~${KB_WEB_MAX_PAGES_HINT} pages are scraped, chunked, and embedded in the background.`,
              "When status is Indexed, agents can answer from that content in the copilot.",
            ]
          : [
              "You paste one https URL (usually your homepage).",
              "We read robots.txt, discover sitemap.xml, and collect page URLs.",
              `Up to ~${KB_WEB_MAX_PAGES_HINT} pages are scraped, chunked, and embedded in the background.`,
              "When status is Indexed, the visitor chatbot can answer from that content.",
            ],
      },
    ];
  }

  if (category === "faq") {
    return [
      {
        value: "FAQ",
        title: variant === "chatbot" ? "Visitor FAQ text" : "FAQ / policy text",
        summary:
          variant === "chatbot"
            ? "Questions visitors ask — returns, hours, shipping, product basics."
            : "Internal Q&A for agents — policies, product notes, support scripts.",
        bestFor: "Content that is already written as Q&A, not full web pages.",
        flowSteps: [
          "You paste one or more question + answer pairs (see supported formats below).",
          "We parse each pair into structured FAQ chunks.",
          "Each pair is embedded separately so the bot matches the right answer.",
          variant === "chatbot"
            ? "Stored for the public widget only — not mixed with assistant knowledge."
            : "Stored for Agent Copilot / internal assistant scope.",
        ],
      },
    ];
  }

  if (category === "documents") {
    return [
      {
        value: "PDF",
        title: "PDF document",
        summary: "Upload a file or provide a public PDF URL (max 100 MB).",
        bestFor: "Policies, brochures, manuals.",
        flowSteps: [
          "You upload a PDF or paste a public HTTPS link.",
          "Text is extracted from the document.",
          "Pages/sections are chunked and indexed for the assistant.",
        ],
      },
      {
        value: "DOCX",
        title: "Word document",
        summary: "Upload .docx or link to a public Word file.",
        bestFor: "SOPs and formatted internal docs.",
        flowSteps: [
          "You upload DOCX or provide a public URL.",
          "Document text is extracted and chunked.",
          "Indexed for assistant retrieval.",
        ],
      },
      {
        value: "EXCEL",
        title: "Excel / CSV catalog",
        summary: "Product sheets, price lists, SKU tables.",
        bestFor: "Structured tabular reference data.",
        flowSteps: [
          "You upload .xlsx, .xls, or .csv (or public file URL).",
          "Rows are parsed into searchable chunks.",
          "Indexed for the assistant.",
        ],
      },
    ];
  }

  if (category === "procedures") {
    return [
      {
        value: "SOP",
        title: "Procedure (SOP)",
        summary: "Step-by-step instructions for agents (min. 20 characters).",
        bestFor: "Escalation flows, troubleshooting checklists, internal how-tos.",
        flowSteps: [
          "You paste the full procedure text.",
          "Content is stored as one indexed document for the assistant.",
          "Agents can retrieve it during live chat copilot.",
        ],
      },
    ];
  }

  return [];
}

export function defaultSourceTypeForCategory(
  category: AiTrainingSourceCategory,
  variant: AiTrainingKbVariant,
): string {
  const cards = sourceMethodCardsForCategory(category, variant, null);
  return cards[0]?.value ?? defaultSourceTypeForVariant(variant);
}

export function suggestedSourceRef(
  sourceType: string,
  websiteUrl: string,
): string {
  const host = hostFromWebsiteUrl(websiteUrl);
  if (!host) return "";
  const root = `https://${host}`;
  switch (sourceType) {
    case "SITEMAP":
      return `${root}/sitemap.xml`;
    case "WEB_CRAWL":
      return root;
    case "URL":
      return root;
    default:
      return "";
  }
}

export function sourceInputLabel(sourceType: string): string {
  switch (sourceType) {
    case "FAQ":
      return "FAQ content";
    case "SOP":
      return "Procedure text";
    case "SITEMAP":
    case "WEB_CRAWL":
    case "URL":
      return "Website URL";
    default:
      return isFileUploadSourceType(sourceType) ? "Document URL (optional if uploading)" : "Source";
  }
}

export function sourceRefHelperText(
  sourceType: string,
  variant: AiTrainingKbVariant,
): string {
  switch (sourceType) {
    case "FAQ":
      return variant === "chatbot"
        ? "Separate blocks per Q&A. Lines ending with ? start a question; Q:/A: and numbered lists also work."
        : "One or more Q&A pairs for Agent Copilot — not shared with the visitor chatbot.";
    case "SOP":
      return "Paste the full procedure (minimum 20 characters).";
    case "URL":
    case "WEB_CRAWL":
    case "SITEMAP":
      return variant === "assistant"
        ? ASSISTANT_WEBSITE_URL_HELPER
        : CHATBOT_WEBSITE_URL_HELPER;
    case "PDF":
      return variant === "assistant"
        ? "Public PDF URL, or upload a file below (max 100 MB)."
        : "PDF is not allowed on the chatbot API.";
    case "DOCX":
      return "Public .docx URL, or upload a Word file below (max 100 MB).";
    case "EXCEL":
      return "Upload a workbook (.xlsx, .xls, .csv) or paste a public HTTPS URL to the file (max 100 MB).";
    default:
      return "Value depends on source type.";
  }
}

export function isValidOptionalMetadataJson(raw: string): boolean {
  const t = raw.trim();
  if (!t) return true;
  try {
    JSON.parse(t);
    return true;
  } catch {
    return false;
  }
}

export function defaultSourceTypeForVariant(variant: AiTrainingKbVariant): string {
  return variant === "chatbot" ? "URL" : "FAQ";
}

export function submitLabelForSourceType(sourceType: string, createBusy: boolean): string {
  if (createBusy) return "Starting training…";
  switch (sourceType) {
    case "SITEMAP":
    case "WEB_CRAWL":
    case "URL":
      return "Start site training";
    case "FAQ":
      return "Save FAQs & index";
    case "SOP":
      return "Save procedure & index";
    case "PDF":
    case "DOCX":
    case "EXCEL":
      return "Upload & index document";
    default:
      return "Create & index";
  }
}

export function sourceTypeOptionsForVariant(variant: AiTrainingKbVariant) {
  return variant === "chatbot" ? CHATBOT_SOURCE_TYPE_OPTIONS : ASSISTANT_SOURCE_TYPE_OPTIONS;
}

export function isTextSourceType(sourceType: string): boolean {
  return sourceType === "FAQ" || sourceType === "SOP";
}

export function isFileUploadSourceType(sourceType: string): boolean {
  return sourceType === "PDF" || sourceType === "DOCX" || sourceType === "EXCEL";
}

export function formatSourceRefForDisplay(item: {
  sourceRef: string;
  title: string | null;
  sourceType: string;
}): string {
  const title = (item.title ?? "").trim();
  const ref = (item.sourceRef ?? "").trim();
  if (title) return title;
  if (ref.startsWith("kb-upload") || ref.startsWith("kb-upload-docx:")) {
    return "Uploaded file";
  }
  if (ref.length > 80) return `${ref.slice(0, 77)}…`;
  return ref || "—";
}

export function isReindexBulkResult(
  payload: CreateKnowledgeSourceResult | { count?: number; results?: unknown[] },
): payload is { count: number; results: CreateKnowledgeSourceResult[] } {
  return typeof (payload as { count?: number }).count === "number";
}

/** Training table / toast — hide `form:` API prefix and raw URLs. */
export function formatKbErrorForDisplay(message: string | null | undefined): string {
  const raw = (message ?? "").trim().replace(/^(form:\s*)+/i, "");
  if (!raw) return "Training could not finish. Try reindexing this source.";

  if (/could not fetch url|failed to fetch url/i.test(raw)) {
    return "We could not reach this website. It may block bots or be temporarily offline.";
  }
  if (/no indexable|no readable content|could not index|could not extract text/i.test(raw)) {
    return "We could not extract enough text from this page. Try reindexing, or enable Playwright on the KB worker.";
  }
  if (/https?:\/\//i.test(raw) && raw.length > 80) {
    return "We could not load this website. Verify the URL is public.";
  }
  return raw.length > 220 ? `${raw.slice(0, 217)}…` : raw;
}

export function toastMessageForCreateResult(result: CreateKnowledgeSourceResult): {
  variant: "success" | "error";
  message: string;
} {
  if (result.status === "failed") {
    return {
      variant: "error",
      message:
        formatKbErrorForDisplay(result.errorMessage) ||
        "Indexing failed. Check the source list for details.",
    };
  }
  if (result.status === "processing") {
    return {
      variant: "success",
      message: KB_BACKGROUND_TRAINING_STARTED_MESSAGE,
    };
  }
  const chunks = result.indexedChunks ?? 0;
  return {
    variant: "success",
    message:
      result.status === "indexed"
        ? `Training complete — indexed ${chunks} searchable piece${chunks === 1 ? "" : "s"}.`
        : "Source created. Indexing may still be in progress.",
  };
}
