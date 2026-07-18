import type { AuthTokenPair } from '@/api';
import type { ImpersonationUserSnapshot } from './impersonation-user';

export type ImpersonationSession = {
  originalTokenPair: AuthTokenPair;
  impersonatedUserId: string;
  impersonatedLicenseKey: string;
  startedAt: string;
  /** Target account (shown in header/banner while impersonating). */
  impersonatedUser?: ImpersonationUserSnapshot;
  /** Admin who started login-as (for banner context). */
  actorUser?: ImpersonationUserSnapshot;
};

/** In-memory session — SecureStore/cookies are not used for impersonation metadata on RN. */
let sessionMemory: ImpersonationSession | null = null;
let activeFlag = false;

export function getImpersonationSession(): ImpersonationSession | null {
  const parsed = sessionMemory;
  if (!parsed?.originalTokenPair?.accessToken || !parsed?.originalTokenPair?.refreshToken) {
    return null;
  }
  return parsed;
}

export function setImpersonationSession(session: ImpersonationSession): void {
  sessionMemory = session;
  activeFlag = true;
}

export function clearImpersonationSession(): void {
  sessionMemory = null;
  activeFlag = false;
}

/** True when login-as metadata exists in memory. */
export function isImpersonatingSessionActive(): boolean {
  if (getImpersonationSession()) return true;
  return activeFlag;
}
