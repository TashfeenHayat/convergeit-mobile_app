import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { listAdminWidgets, widgetResponseData } from "@/api/widgets/widgets.api";
import { parseWidgetsListEnvelope } from "../utils/map-settings-website";
import { chatSettingsKeys } from "./keys";

export type ChatSettingsWebsitesQuery = {
  search?: string;
  resellerId?: string;
  parentCompanyId?: string;
  childCompanyId?: string;
};

export function useChatSettingsWebsites(params: ChatSettingsWebsitesQuery, enabled = true) {
  return useQuery({
    queryKey: chatSettingsKeys.widgetsList(params),
    queryFn: async () => {
      const envelope = await listAdminWidgets({
        all: true,
        widgetType: "CHAT",
        search: params.search?.trim() || undefined,
        resellerId: params.resellerId?.trim() || undefined,
        parentCompanyId: params.parentCompanyId?.trim() || undefined,
        childCompanyId: params.childCompanyId?.trim() || undefined,
      });
      const raw = widgetResponseData(envelope);
      return parseWidgetsListEnvelope(raw);
    },
    enabled,
    staleTime: 60_000,
  });
}

export function formatWidgetsLoadError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const body = error.response?.data as { error?: { message?: string } } | undefined;
    const apiMsg = body?.error?.message;
    if (status === 403) {
      return (
        apiMsg ??
        "You need page:chat-widget and chat-widget:view (or update) permission. Log out and back in after roles are assigned."
      );
    }
    if (status === 401) return "Session expired — please sign in again.";
    if (apiMsg) return apiMsg;
  }
  return "Could not load websites from GET /widgets.";
}
