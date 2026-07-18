import { apiClient } from "../http/axios-instance";
import type {
  PlatformThemeMeEnvelope,
  PlatformThemePatchBody,
} from "../types/platform-theme.types";

export async function getMyPlatformTheme(): Promise<PlatformThemeMeEnvelope> {
  const { data } = await apiClient.get<PlatformThemeMeEnvelope>("/platform-theme/me");
  return data;
}

export async function patchMyPlatformTheme(
  body: PlatformThemePatchBody,
): Promise<PlatformThemeMeEnvelope> {
  const { data } = await apiClient.patch<PlatformThemeMeEnvelope>("/platform-theme/me", body);
  return data;
}
