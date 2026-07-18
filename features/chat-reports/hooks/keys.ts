import type { ChatReportQuery } from "@/services/chat/reports.types";

export const chatReportKeys = {
  all: ["chat-reports"] as const,
  overview: (query: ChatReportQuery) => [...chatReportKeys.all, "overview", query] as const,
  qaQuality: (query: ChatReportQuery) => [...chatReportKeys.all, "qa-quality", query] as const,
};
