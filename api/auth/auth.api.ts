import { apiClient } from '@/api/http/axios-instance';
import {
  clearTokens,
  getRefreshToken,
  getTokenPair,
  setTokenPair,
} from '@/api/storage/auth-cookies';
import type {
  ApiEnvelope,
  AuthMeResponse,
  AuthTokenPair,
  HealthResponse,
  LoginAsRequestBody,
  LoginRequestBody,
  LoginResponseEnvelope,
  LoginSuccessData,
  LogoutRequestBody,
  PasswordResetConfirmBody,
  PasswordResetMessageResponse,
  PasswordResetRequestBody,
  PasswordResetVerifyBody,
  PasswordResetVerifyResponse,
  RefreshRequestBody,
  VerifyAccessBodyRequest,
} from '@/api/types/auth.types';
import {
  clearImpersonationSession,
  getImpersonationSession,
  isImpersonatingSessionActive,
  setImpersonationSession,
} from '@/lib/auth/impersonation-session';
import { snapshotFromAuthApiUser } from '@/lib/auth/impersonation-user';

function decodeJwtPayloadJson(segment: string): string {
  const b64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const padded = b64 + pad;
  if (typeof globalThis.atob === 'function') {
    return globalThis.atob(padded);
  }
  // Minimal base64 decode for Hermes environments without atob
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let str = '';
  let buffer = 0;
  let bits = 0;
  for (const ch of padded.replace(/=+$/, '')) {
    const val = chars.indexOf(ch);
    if (val < 0) continue;
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      str += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return str;
}

export async function getHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>('/health');
  return data;
}

export async function login(body: LoginRequestBody): Promise<LoginSuccessData> {
  // Wipe any stale session so a prior failed/partial login cannot poison this attempt.
  await clearTokens();

  const payloadBody = {
    email: body.email.trim(),
    password: body.password,
    licenseKey: body.licenseKey.trim(),
  };
  const url = `${apiClient.defaults.baseURL}/auth/login`;

  if (__DEV__) {
    console.log('[AUTH][LOGIN] ── request ──────────────────────────');
    console.log('[AUTH][LOGIN] method : POST');
    console.log('[AUTH][LOGIN] url    :', url);
    console.log('[AUTH][LOGIN] body   :', {
      email: payloadBody.email,
      password: payloadBody.password,
      licenseKey: payloadBody.licenseKey,
    });
    console.log('[AUTH][LOGIN] tokens cleared before hit');
  }

  const { data } = await apiClient.post<LoginResponseEnvelope>(
    '/auth/login',
    payloadBody,
  );
  const payload = data?.data;
  if (!payload?.accessToken || !payload?.refreshToken) {
    throw new Error(
      (data as { message?: string })?.message ||
        'Login response missing tokens. Check API base URL.',
    );
  }
  await setTokenPair(
    {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    },
    {
      accessExpiresIn: payload.expiresIn,
      refreshExpiresIn: payload.refreshExpiresIn,
    },
  );

  if (__DEV__) {
    console.log('[AUTH][LOGIN] ── success ──────────────────────────');
    console.log('[AUTH][LOGIN] url    :', url);
    console.log('[AUTH][LOGIN] user   :', payload.user?.email ?? '(no email)');
  }

  return payload;
}

function actorSnapshotFromAccessToken(accessToken: string | null | undefined) {
  if (!accessToken?.trim()) return undefined;
  try {
    const segments = accessToken.trim().split('.');
    if (segments.length < 2) return undefined;
    const payload = JSON.parse(decodeJwtPayloadJson(segments[1]!)) as {
      userId?: string;
      email?: string;
    };
    const id = payload.userId?.trim();
    const email = payload.email?.trim();
    if (!id || !email) return undefined;
    return { id, email, displayName: email };
  } catch {
    return undefined;
  }
}

export async function applyLoginAsTokenPair(
  data: LoginSuccessData,
): Promise<void> {
  await setTokenPair(
    {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    },
    {
      accessExpiresIn: data.expiresIn,
      refreshExpiresIn: data.refreshExpiresIn,
    },
  );
}

export async function loginAs(
  body: LoginAsRequestBody,
): Promise<LoginSuccessData> {
  const originalTokenPair = getTokenPair();
  const actorUser = actorSnapshotFromAccessToken(originalTokenPair?.accessToken);
  const { data } = await apiClient.post<LoginResponseEnvelope>(
    '/auth/login-as',
    body,
  );
  const loginData = data.data;
  const impersonatedUser = snapshotFromAuthApiUser(loginData.user);

  if (originalTokenPair && !isImpersonatingSessionActive()) {
    setImpersonationSession({
      originalTokenPair,
      impersonatedUserId: body.targetUserId,
      impersonatedLicenseKey: body.licenseKey ?? '',
      startedAt: new Date().toISOString(),
      impersonatedUser: impersonatedUser ?? undefined,
      actorUser,
    });
  } else if (isImpersonatingSessionActive()) {
    const existing = getImpersonationSession();
    if (existing) {
      setImpersonationSession({
        ...existing,
        impersonatedUserId: body.targetUserId,
        impersonatedLicenseKey:
          body.licenseKey ?? existing.impersonatedLicenseKey,
        impersonatedUser: impersonatedUser ?? existing.impersonatedUser,
      });
    }
  }

  await applyLoginAsTokenPair(loginData);
  return loginData;
}

export async function verifyBearer(): Promise<void> {
  await apiClient.get('/auth/verify');
}

export async function verifyAccessBody(
  body: VerifyAccessBodyRequest,
): Promise<void> {
  await apiClient.post('/auth/verify-access', body);
}

export async function getMe(options?: {
  permissionsBreakdown?: boolean;
}): Promise<AuthMeResponse> {
  const { data } = await apiClient.get<AuthMeResponse>('/auth/me', {
    params:
      options?.permissionsBreakdown === true
        ? { permissionsBreakdown: '1' }
        : undefined,
  });
  return data;
}

export async function refresh(
  body: RefreshRequestBody,
): Promise<AuthTokenPair> {
  const { data } = await apiClient.post<
    AuthTokenPair | ApiEnvelope<AuthTokenPair | LoginSuccessData>
  >('/auth/refresh', body);
  const root =
    typeof data === 'object' && data !== null && 'data' in data
      ? (data as ApiEnvelope<AuthTokenPair | LoginSuccessData>).data
      : (data as AuthTokenPair | LoginSuccessData);
  const tokenPair: AuthTokenPair = {
    accessToken: String(root.accessToken ?? '').trim(),
    refreshToken: String(root.refreshToken ?? '').trim(),
  };
  const loginMeta =
    root && typeof root === 'object' ? (root as LoginSuccessData) : null;
  await setTokenPair(tokenPair, {
    accessExpiresIn: loginMeta?.expiresIn,
    refreshExpiresIn: loginMeta?.refreshExpiresIn,
  });
  return tokenPair;
}

/** Web-compatible: logout with explicit refresh body. */
export async function logoutRemote(body: LogoutRequestBody): Promise<void>;
/** Mobile convenience: logout using stored refresh token + clear local session. */
export async function logoutRemote(): Promise<void>;
export async function logoutRemote(body?: LogoutRequestBody): Promise<void> {
  if (body?.refreshToken) {
    await apiClient.post('/auth/logout', body);
    return;
  }
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await apiClient.post('/auth/logout', { refreshToken });
    }
  } finally {
    clearImpersonationSession();
    await clearTokens();
  }
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await apiClient.post('/auth/logout', { refreshToken });
    }
  } finally {
    clearImpersonationSession();
    await clearTokens();
  }
}

export async function requestPasswordReset(
  body: PasswordResetRequestBody,
): Promise<string> {
  const { data } = await apiClient.post<PasswordResetMessageResponse>(
    '/auth/password-reset/request',
    { email: body.email.trim().toLowerCase() },
  );
  return data.data.message;
}

export async function verifyPasswordResetOtp(
  body: PasswordResetVerifyBody,
): Promise<void> {
  await apiClient.post<PasswordResetVerifyResponse>(
    '/auth/password-reset/verify',
    {
      email: body.email.trim().toLowerCase(),
      code: body.code.trim(),
    },
  );
}

export async function confirmPasswordReset(
  body: PasswordResetConfirmBody,
): Promise<string> {
  const { data } = await apiClient.post<PasswordResetMessageResponse>(
    '/auth/password-reset/confirm',
    {
      email: body.email.trim().toLowerCase(),
      code: body.code.trim(),
      password: body.password,
    },
  );
  return data.data.message;
}
