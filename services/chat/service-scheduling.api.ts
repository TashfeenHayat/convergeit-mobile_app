import { apiClient } from "@/api";
import { unwrapChatHttpData } from "./http";
import type {
  ServiceSchedulingBundle,
  UpsertServiceSchedulingBody,
  UpsertVisitorTopicsBody,
  VisitorTopicsBundle,
} from "./service-scheduling.types";

function serviceSchedulingPath(websiteId: string): string {
  return `/chat/settings/websites/${encodeURIComponent(websiteId)}/service-scheduling`;
}

function visitorTopicsPath(websiteId: string): string {
  return `/chat/settings/websites/${encodeURIComponent(websiteId)}/visitor-topics`;
}

export async function fetchServiceScheduling(
  websiteId: string,
): Promise<ServiceSchedulingBundle> {
  const { data } = await apiClient.get<unknown>(serviceSchedulingPath(websiteId));
  return unwrapChatHttpData<ServiceSchedulingBundle>(data);
}

export async function fetchVisitorTopics(websiteId: string): Promise<VisitorTopicsBundle> {
  const { data } = await apiClient.get<unknown>(visitorTopicsPath(websiteId));
  return unwrapChatHttpData<VisitorTopicsBundle>(data);
}

export async function saveServiceScheduling(
  websiteId: string,
  body: UpsertServiceSchedulingBody,
): Promise<ServiceSchedulingBundle> {
  const { data } = await apiClient.put<unknown>(serviceSchedulingPath(websiteId), body);
  return unwrapChatHttpData<ServiceSchedulingBundle>(data);
}

export async function deleteServiceScheduling(
  websiteId: string,
): Promise<ServiceSchedulingBundle> {
  const { data } = await apiClient.delete<unknown>(serviceSchedulingPath(websiteId));
  return unwrapChatHttpData<ServiceSchedulingBundle>(data);
}

export async function saveVisitorTopics(
  websiteId: string,
  body: UpsertVisitorTopicsBody,
): Promise<VisitorTopicsBundle> {
  const { data } = await apiClient.put<unknown>(visitorTopicsPath(websiteId), body);
  return unwrapChatHttpData<VisitorTopicsBundle>(data);
}
