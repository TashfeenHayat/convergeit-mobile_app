import type { InternalAxiosRequestConfig } from "axios";

export function joinUrl(base: string, path: string): string {
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pathFromConfig(config: InternalAxiosRequestConfig): string {
  const u = config.url ?? "";
  if (u.startsWith("http")) {
    try {
      return new URL(u).pathname;
    } catch {
      return u;
    }
  }
  return u;
}
