import type { PlatformLlmProvider } from "@/api/ai-training/platform-llm.api";

export type LlmProviderCode = PlatformLlmProvider["code"];

export const LLM_PROVIDER_ORDER: LlmProviderCode[] = [
  "GEMINI",
  "OPENAI",
  "GROQ",
  "ANTHROPIC",
];

export const LLM_PROVIDER_META: Record<
  LlmProviderCode,
  {
    name: string;
    shortName: string;
    description: string;
    docsHint: string;
    supportsBaseUrl: boolean;
    supportsEmbedding: boolean;
    defaultGenerationModel: string;
    defaultEmbeddingModel?: string;
    defaultBaseUrl?: string;
  }
> = {
  GEMINI: {
    name: "Google Gemini",
    shortName: "Gemini",
    description: "Generation and embeddings for balanced website AI profiles.",
    docsHint: "Google AI Studio / Gemini API key",
    supportsBaseUrl: false,
    supportsEmbedding: true,
    defaultGenerationModel: "gemini-2.5-flash",
    defaultEmbeddingModel: "gemini-embedding-001",
  },
  OPENAI: {
    name: "OpenAI",
    shortName: "OpenAI",
    description: "GPT models for copilot and high-quality generation profiles.",
    docsHint: "OpenAI platform API key (sk-…)",
    supportsBaseUrl: false,
    supportsEmbedding: true,
    defaultGenerationModel: "gpt-4o-mini",
    defaultEmbeddingModel: "text-embedding-3-small",
  },
  GROQ: {
    name: "Groq",
    shortName: "Groq",
    description: "Fast inference via OpenAI-compatible API for low-latency chatbot.",
    docsHint: "Groq console API key",
    supportsBaseUrl: true,
    supportsEmbedding: false,
    defaultGenerationModel: "llama-3.3-70b-versatile",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
  },
  ANTHROPIC: {
    name: "Anthropic Claude",
    shortName: "Claude",
    description: "Claude models for high-quality copilot and chatbot generation.",
    docsHint: "Anthropic console API key (sk-ant-…)",
    supportsBaseUrl: false,
    supportsEmbedding: false,
    defaultGenerationModel: "claude-sonnet-4-20250514",
  },
};
