import { EMAIL_ROUTES, resellerOwnMailEditPath } from './email.constants';
import {
  safeSessionGet,
  safeSessionRemove,
  safeSessionSet,
} from '@/lib/storage/safe-web-storage';

export const EMAIL_RESELLER_STORAGE_KEY = 'converge:email-config-reseller-id';

export function readEmailResellerFromStorage(): string | null {
  return safeSessionGet(EMAIL_RESELLER_STORAGE_KEY)?.trim() || null;
}

export function writeEmailResellerToStorage(resellerId: string | null): void {
  if (resellerId?.trim()) {
    safeSessionSet(EMAIL_RESELLER_STORAGE_KEY, resellerId.trim());
  } else {
    safeSessionRemove(EMAIL_RESELLER_STORAGE_KEY);
  }
}

export function buildEmailTabHref(path: string, resellerId: string | null): string {
  const id = resellerId?.trim();
  if (!id) return path;
  if (path === EMAIL_ROUTES.connection || path === EMAIL_ROUTES.setupReseller) {
    return resellerOwnMailEditPath(id);
  }
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}resellerId=${encodeURIComponent(id)}`;
}
