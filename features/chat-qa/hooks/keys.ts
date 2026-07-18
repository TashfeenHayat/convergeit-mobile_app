import type { QaQueueFilters } from "@/services/chat/qa.types";

export const chatQaKeys = {
  all: ["chat-qa"] as const,
  queue: (filters: QaQueueFilters) => [...chatQaKeys.all, "queue", filters] as const,
  bundle: (conversationId: string) =>
    [...chatQaKeys.all, "bundle", conversationId] as const,
};
