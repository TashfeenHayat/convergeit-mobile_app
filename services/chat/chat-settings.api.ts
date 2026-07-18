import { apiClient } from "@/api";
import { unwrapChatHttpData } from "./http";
import type {
  PatchChatRouteBody,
  ReplaceCannedResponsesBody,
  ReplaceDepartmentNotifyEmailsBody,
  UpsertChatRouteBody,
  UpsertWebsiteChatSettingsBody,
  WebsiteChatSettingsBundle,
} from "./chat-settings.types";

function settingsPath(websiteId: string): string {
  return `/chat/settings/websites/${encodeURIComponent(websiteId)}`;
}

export async function fetchWebsiteChatSettings(
  websiteId: string,
): Promise<WebsiteChatSettingsBundle> {
  const { data } = await apiClient.get<unknown>(settingsPath(websiteId));
  return unwrapChatHttpData<WebsiteChatSettingsBundle>(data);
}

export async function saveWebsiteChatSettings(
  websiteId: string,
  body: UpsertWebsiteChatSettingsBody,
): Promise<WebsiteChatSettingsBundle["settings"]> {
  const { data } = await apiClient.put<unknown>(settingsPath(websiteId), body);
  return unwrapChatHttpData(data);
}

export async function createChatRoute(
  websiteId: string,
  body: UpsertChatRouteBody,
): Promise<unknown> {
  const { data } = await apiClient.put<unknown>(`${settingsPath(websiteId)}/routes`, body);
  return unwrapChatHttpData(data);
}

export async function patchChatRoute(
  websiteId: string,
  routeId: string,
  body: PatchChatRouteBody,
): Promise<unknown> {
  const { data } = await apiClient.patch<unknown>(
    `${settingsPath(websiteId)}/routes/${encodeURIComponent(routeId)}`,
    body,
  );
  return unwrapChatHttpData(data);
}

export async function deleteChatRoute(websiteId: string, routeId: string): Promise<void> {
  await apiClient.delete(
    `${settingsPath(websiteId)}/routes/${encodeURIComponent(routeId)}`,
  );
}

export async function replaceDepartmentNotifyEmails(
  websiteId: string,
  body: ReplaceDepartmentNotifyEmailsBody,
): Promise<unknown> {
  const { data } = await apiClient.put<unknown>(
    `${settingsPath(websiteId)}/department-emails`,
    body,
  );
  return unwrapChatHttpData(data);
}

export async function replaceCannedResponses(
  websiteId: string,
  body: ReplaceCannedResponsesBody,
): Promise<unknown> {
  const { data } = await apiClient.put<unknown>(
    `${settingsPath(websiteId)}/canned-responses`,
    body,
  );
  return unwrapChatHttpData(data);
}

