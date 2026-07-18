import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchChatTranscriptSuggestions } from "@/services/chat/transcript.api";
import type { TranscriptSuggestionKind } from "@/services/chat/transcript.types";
import type { TranscriptSearchSuggestion } from "../types";
import { chatTranscriptKeys } from "./keys";

type UseTranscriptSearchSuggestionsArgs = {
  kind: TranscriptSuggestionKind;
  query: string;
  enabled: boolean;
  listScope: {
    resellerId?: string;
    parentCompanyId?: string;
    childCompanyId?: string;
    websiteId?: string;
  };
};

export function useTranscriptSearchSuggestions({
  kind,
  query,
  enabled,
  listScope,
}: UseTranscriptSearchSuggestionsArgs) {
  const [debouncedQ, setDebouncedQ] = useState(query.trim());

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQ(query.trim()), 300);
    return () => clearTimeout(handle);
  }, [query]);

  const qEnabled = enabled && debouncedQ.length > 0;

  const suggestionsQuery = useQuery({
    queryKey: chatTranscriptKeys.suggestions(kind, debouncedQ, listScope),
    queryFn: () =>
      fetchChatTranscriptSuggestions({
        kind,
        q: debouncedQ,
        limit: 8,
        resellerId: listScope.resellerId,
        parentCompanyId: listScope.parentCompanyId,
        childCompanyId: listScope.childCompanyId,
        websiteId: listScope.websiteId,
      }),
    enabled: qEnabled,
    staleTime: 15_000,
  });

  const suggestions: TranscriptSearchSuggestion[] = (suggestionsQuery.data ?? []).map(
    (item) => ({
      id: item.id,
      label: item.label,
      subtitle: item.subtitle,
    }),
  );

  return {
    suggestions,
    isLoading: qEnabled && suggestionsQuery.isFetching,
  };
}
