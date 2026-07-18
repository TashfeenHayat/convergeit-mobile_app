export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthApiRole {
  id: string;
  name: string;
}

export interface AuthApiTheme {
  backgroundColor: string | null;
  themeJson: unknown | null;
}

export interface AuthApiUser {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  role: AuthApiRole;
  theme: AuthApiTheme;
  /** Present when /auth/me returns workforce flags (optional for login payload). */
  userType?: string | null;
  isPoolHead?: boolean;
  /** Tenant reseller scope (`/auth/me` user or JWT claims). */
  resellerId?: string | null;
  /** External portfolio admin — may pass an explicit `resellerId` list filter. */
  wideResellerScope?: boolean;
  /** Client root (parent company) from JWT or `/auth/me`. */
  parentCompanyId?: string | null;
  /** Tenant license key from `/auth/me` `claims.licenseKey`. */
  licenseKey?: string | null;
  poolId?: string | null;
  poolName?: string | null;
}

export type LoginPermissionEnvelope = {
  page?: string[];
  operational?: string[];
  breakdown?: Record<string, unknown>;
  isPlatformAdmin?: boolean;
};

export interface LoginSuccessData extends AuthTokenPair {
  tokenType: string;
  expiresIn?: string;
  refreshExpiresIn?: string;
  user: AuthApiUser;
  permission?: LoginPermissionEnvelope;
  permissionsByType?: Record<string, string[]>;
  context?: Record<string, unknown>;
}

export interface ApiEnvelope<TData> {
  success: boolean;
  data: TData;
  message?: string;
}

export type LoginResponseEnvelope = ApiEnvelope<LoginSuccessData>;

export interface LoginRequestBody {
  email: string;
  password: string;
  licenseKey: string;
}

export interface LoginAsRequestBody {
  targetUserId: string;
  licenseKey: string;
}

export interface RefreshRequestBody {
  refreshToken: string;
}

export interface LogoutRequestBody {
  refreshToken: string;
}

export interface VerifyAccessBodyRequest {
  accessToken: string;
}

export interface PasswordResetRequestBody {
  email: string;
}

export interface PasswordResetVerifyBody {
  email: string;
  code: string;
}

export interface PasswordResetConfirmBody {
  email: string;
  code: string;
  password: string;
}

export type PasswordResetMessageResponse = ApiEnvelope<{ message: string }>;
export type PasswordResetVerifyResponse = ApiEnvelope<{ valid: true }>;

export type AuthMeResponse = {
  success?: boolean;
  data?: {
    user?: AuthApiUser;
    permissionsByType?: Record<string, string[]>;
    permission?: LoginPermissionEnvelope;
    isPlatformAdmin?: boolean;
    [key: string]: unknown;
  };
  user?: AuthApiUser;
  permissionsByType?: Record<string, string[]>;
  [key: string]: unknown;
};

export interface HealthResponse {
  app?: string;
  status?: string;
  [key: string]: unknown;
}

export type AuthSessionSyncStatus =
  | 'anonymous'
  | 'valid'
  | 'refreshed'
  | 'invalid'
  /** Verify/refresh could not reach the server — do not treat tokens as a logged-in session. */
  | 'unreachable'
  | 'error';

export interface AuthSessionSyncResult {
  status: AuthSessionSyncStatus;
  /** Set when `status` is `unreachable` or `error`. */
  error?: unknown;
}
