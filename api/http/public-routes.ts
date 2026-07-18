import type { InternalAxiosRequestConfig } from 'axios';
import { pathFromConfig } from './http-path';

/**
 * Routes that must not send Bearer and must not trigger refresh-retry logic
 * (except refresh itself, which clears session on failure).
 */
/** Guest link REST — uses guest JWT from the caller, not dashboard session. */
export function isGuestChatRoute(config: InternalAxiosRequestConfig): boolean {
  const path = pathFromConfig(config);
  return path.startsWith('/chat/guest');
}

/**
 * Public visitor widget REST — must never attach dashboard Bearer or run auth refresh / logout.
 */
export function isWidgetVisitorRoute(config: InternalAxiosRequestConfig): boolean {
  const path = pathFromConfig(config);
  if (path.startsWith('/widget/')) return true;
  if (path.startsWith('/chat/widget/')) return true;
  if (path === '/ai/visitor/respond' || path.endsWith('/ai/visitor/respond')) {
    return true;
  }
  return false;
}

/** Public invoice pay links — no dashboard session required. */
export function isPublicBillingRoute(config: InternalAxiosRequestConfig): boolean {
  const path = pathFromConfig(config);
  return path.startsWith('/public/billing');
}

export function isPublicAuthRoute(config: InternalAxiosRequestConfig): boolean {
  const method = (config.method ?? 'get').toLowerCase();
  const path = pathFromConfig(config);

  if (isGuestChatRoute(config)) {
    return true;
  }

  if (isWidgetVisitorRoute(config)) {
    return true;
  }

  if (isPublicBillingRoute(config)) {
    return true;
  }

  if (method === 'get' && (path === '/health' || path.endsWith('/health'))) {
    return true;
  }
  if (method === 'post' && path.endsWith('/auth/login')) return true;
  if (method === 'post' && path.endsWith('/auth/refresh')) return true;
  if (method === 'post' && path.endsWith('/auth/logout')) return true;
  if (method === 'post' && path.endsWith('/auth/verify-access')) return true;
  if (method === 'post' && path.includes('/auth/password-reset/')) return true;

  return false;
}
