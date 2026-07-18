import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchChatTranscriptDetail,
  fetchChatTranscripts,
} from "@/services/chat/transcript.api";
import type { TranscriptListFilters } from "@/services/chat/transcript.types";
import { chatTranscriptKeys } from "./keys";

export function useChatTranscripts(
  initialConversationId?: string | null,
  options?: { apiEnabled?: boolean },
) {
  const apiEnabled = options?.apiEnabled !== false;
  const [page, setPage] = useState(1);
  const [listFilters, setListFilters] = useState<TranscriptListFilters>({});
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    initialConversationId ?? null,
  );

  const queryFilters = useMemo(
    (): TranscriptListFilters => ({
      ...listFilters,
      page,
      limit: 25,
    }),
    [listFilters, page],
  );

  const listQuery = useQuery({
    queryKey: chatTranscriptKeys.list(queryFilters),
    queryFn: () => fetchChatTranscripts(queryFilters),
    enabled: apiEnabled,
  });

  const detailQuery = useQuery({
    queryKey: chatTranscriptKeys.detail(selectedConversationId ?? ""),
    queryFn: () => fetchChatTranscriptDetail(selectedConversationId!),
    enabled: apiEnabled && Boolean(selectedConversationId),
  });

  const patchFilters = useCallback((patch: Partial<TranscriptListFilters>) => {
    setListFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }, []);

  const selectConversation = useCallback((id: string | null) => {
    setSelectedConversationId(id);
  }, []);

  const selectedRow = useMemo(() => {
    if (!selectedConversationId) return null;
    return (
      listQuery.data?.items.find((r) => r.id === selectedConversationId) ?? null
    );
  }, [listQuery.data?.items, selectedConversationId]);

  return {
    page,
    setPage,
    listFilters,
    patchFilters,
    listQuery,
    items: listQuery.data?.items ?? [],
    total: listQuery.data?.total ?? 0,
    totalPages: listQuery.data?.totalPages ?? 1,
    selectedConversationId,
    selectConversation,
    selectedRow,
    detailQuery,
    detail: detailQuery.data ?? null,
    detailLoading: detailQuery.isLoading,
    detailError: detailQuery.error,
  };
}
