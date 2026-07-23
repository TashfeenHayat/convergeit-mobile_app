import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  type AuthApiUser,
  type LoginRequestBody,
  type LoginSuccessData,
} from '@/api';
import { hydrateTokenCache, getAccessToken } from '@/api/storage/token-storage';
import { extractApiErrorMessage, extractNestFieldErrors } from '@/lib/api/errors';
import {
  extractIsPlatformAdmin,
  extractPermissionsByType,
  hasOperationalPermission,
  hasPagePermission,
  isRbacActive,
  PERMISSION_BUCKET_OPERATIONAL,
  PERMISSION_BUCKET_PAGE,
  toPermissionSet,
  type PermissionsByType,
} from '@/lib/auth/permissions-model';
import {
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
} from '@/lib/hooks';

export type { PermissionsByType };

type LoginResult =
  | { success: true; data: LoginSuccessData }
  | {
      success: false;
      error?: string;
      fieldErrors?: Partial<Record<'email' | 'password' | 'licenseKey', string>>;
    };

type AuthContextValue = {
  user: AuthApiUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPlatformAdmin: boolean;
  permissionsByType: PermissionsByType;
  pagePermissions: string[];
  operationalPermissions: string[];
  rbacEnabled: boolean;
  permissionsSyncing: boolean;
  login: (body: LoginRequestBody) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPage: (code: string) => boolean;
  hasOperational: (code: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function pickUserFromAuthPayload(
  data: LoginSuccessData | Record<string, unknown>,
): AuthApiUser | null {
  if ('user' in data && data.user && typeof data.user === 'object') {
    return data.user as AuthApiUser;
  }
  const root = data as Record<string, unknown>;
  const nested = root.data;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const nestedUser = (nested as Record<string, unknown>).user;
    if (nestedUser && typeof nestedUser === 'object') {
      return nestedUser as AuthApiUser;
    }
  }
  return null;
}

/**
 * Web-parity permission hydrate: use `extractPermissionsByType` so role
 * `breakdown.fromRole` grants (departments, pools, roles, …) land in PAGE.
 * The previous shallow `permissionsByType` / `permission.page` read dropped
 * those and hid Departments / Pools / Roles from the sidebar.
 */
function normalizePermissions(
  data: LoginSuccessData | Record<string, unknown>,
): {
  user: AuthApiUser | null;
  permissionsByType: PermissionsByType;
  isPlatformAdmin: boolean;
} {
  return {
    user: pickUserFromAuthPayload(data),
    permissionsByType: extractPermissionsByType(data) ?? {},
    isPlatformAdmin: extractIsPlatformAdmin(data),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<AuthApiUser | null>(null);
  const [permissionsByType, setPermissionsByType] = useState<PermissionsByType>(
    {},
  );
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();

  const meQuery = useMeQuery({
    permissionsBreakdown: true,
    enabled: hydrated && Boolean(getAccessToken()),
  });

  const applySession = useCallback(
    (next: {
      user: AuthApiUser | null;
      permissionsByType: PermissionsByType;
      isPlatformAdmin: boolean;
    }) => {
      setUser(next.user);
      setPermissionsByType(next.permissionsByType);
      setIsPlatformAdmin(next.isPlatformAdmin);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await hydrateTokenCache();
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!meQuery.data) return;
    applySession(normalizePermissions(meQuery.data as Record<string, unknown>));
  }, [meQuery.data, applySession]);

  useEffect(() => {
    if (!meQuery.isError || !hydrated) return;
    // Keep a session just established by login(); only clear empty hydrate failures.
    if (user) return;
    applySession({ user: null, permissionsByType: {}, isPlatformAdmin: false });
  }, [meQuery.isError, hydrated, applySession, user]);

  const refreshProfile = useCallback(async () => {
    if (!getAccessToken()) {
      applySession({ user: null, permissionsByType: {}, isPlatformAdmin: false });
      return;
    }
    const result = await meQuery.refetch();
    if (result.data) {
      applySession(normalizePermissions(result.data as Record<string, unknown>));
    }
  }, [applySession, meQuery]);

  const login = useCallback(
    async (body: LoginRequestBody): Promise<LoginResult> => {
      // Clear prior mutation failure so a retry is not stuck on stale error state.
      loginMutation.reset();
      try {
        const data = await loginMutation.mutateAsync(body);
        applySession(normalizePermissions(data));
        void meQuery.refetch();
        return { success: true, data };
      } catch (err) {
        const fields = extractNestFieldErrors(err);
        const error = extractApiErrorMessage(err, 'Sign in failed');
        if (__DEV__) {
          console.error('[AUTH] login failed:', error, fields);
        }
        const fieldErrors: NonNullable<
          Extract<LoginResult, { success: false }>['fieldErrors']
        > = {};
        if (fields.email) fieldErrors.email = fields.email;
        if (fields.password) fieldErrors.password = fields.password;
        if (fields.licenseKey) fieldErrors.licenseKey = fields.licenseKey;
        return {
          success: false,
          error,
          fieldErrors:
            Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
        };
      }
    },
    [applySession, loginMutation, meQuery],
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      applySession({ user: null, permissionsByType: {}, isPlatformAdmin: false });
    }
  }, [applySession, logoutMutation]);

  const pagePermissionSet = useMemo(
    () =>
      toPermissionSet(
        permissionsByType[PERMISSION_BUCKET_PAGE] ?? permissionsByType.page,
      ),
    [permissionsByType],
  );
  const operationalPermissionSet = useMemo(
    () =>
      toPermissionSet(
        permissionsByType[PERMISSION_BUCKET_OPERATIONAL] ??
          permissionsByType.operational,
      ),
    [permissionsByType],
  );

  const hasPage = useCallback(
    (code: string) => {
      if (isPlatformAdmin) return true;
      if (pagePermissionSet.size === 0) return true;
      return hasPagePermission(pagePermissionSet, code);
    },
    [isPlatformAdmin, pagePermissionSet],
  );

  const hasOperational = useCallback(
    (code: string) => {
      if (isPlatformAdmin) return true;
      if (operationalPermissionSet.size === 0) return true;
      return hasOperationalPermission(operationalPermissionSet, code);
    },
    [isPlatformAdmin, operationalPermissionSet],
  );

  const pagePermissions = [...pagePermissionSet];
  const operationalPermissions = [...operationalPermissionSet];
  const rbacEnabled = isRbacActive(permissionsByType);
  const permissionsSyncing =
    Boolean(getAccessToken()) && meQuery.isFetching && !user;

  const isLoading =
    !hydrated || (Boolean(getAccessToken()) && meQuery.isLoading && !user);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      isPlatformAdmin,
      permissionsByType,
      pagePermissions,
      operationalPermissions,
      rbacEnabled,
      permissionsSyncing,
      login,
      logout,
      refreshProfile,
      hasPage,
      hasOperational,
    }),
    [
      user,
      isLoading,
      isPlatformAdmin,
      permissionsByType,
      pagePermissions,
      operationalPermissions,
      rbacEnabled,
      permissionsSyncing,
      login,
      logout,
      refreshProfile,
      hasPage,
      hasOperational,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
