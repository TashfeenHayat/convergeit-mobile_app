import type {
  TranscriptListFilters,
  TranscriptSuggestionKind,
} from "@/services/chat/transcript.types";

export const chatTranscriptKeys = {
  all: ["chat-transcripts"] as const,
  list: (filters: TranscriptListFilters) =>
    [...chatTranscriptKeys.all, "list", filters] as const,
  detail: (conversationId: string) =>
    [...chatTranscriptKeys.all, "detail", conversationId] as const,
  suggestions: (
    kind: TranscriptSuggestionKind,
    q: string,
    scope: {
      resellerId?: string;
      parentCompanyId?: string;
      childCompanyId?: string;
      websiteId?: string;
    },
  ) => [...chatTranscriptKeys.all, "suggestions", kind, q, scope] as const,
};
