import { env } from "@/constants/env";

/** Resolved API origin for public widget/embed calls (no dashboard auth). */
export function getResolvedPublicApiBaseUrl(): string {
  const raw = env.apiBaseUrl;
  if (!raw) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL must be configured.");
  }
  return raw.replace(/\/+$/, "");
}
