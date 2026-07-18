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
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
} from '@/lib/hooks';

export type PermissionsByType = Record<string, string[]>;

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

function normalizePermissions(
  data: LoginSuccessData | Record<string, unknown>,
): {
  user: AuthApiUser | null;
  permissionsByType: PermissionsByType;
  isPlatformAdmin: boolean;
} {
  if ('user' in data && data.user && 'accessToken' in data) {
    const login = data as LoginSuccessData;
    const byType: PermissionsByType = { ...(login.permissionsByType ?? {}) };
    if (login.permission?.page?.length) byType.PAGE = login.permission.page;
    if (login.permission?.operational?.length) {
      byType.OPERATIONAL = login.permission.operational;
    }
    return {
      user: login.user,
      permissionsByType: byType,
      isPlatformAdmin: Boolean(login.permission?.isPlatformAdmin),
    };
  }

  const me = data as {
    data?: {
      user?: AuthApiUser;
      permissionsByType?: PermissionsByType;
      permission?: { isPlatformAdmin?: boolean };
      isPlatformAdmin?: boolean;
    };
    user?: AuthApiUser;
    permissionsByType?: PermissionsByType;
  };
  const payload = (me.data ?? me) as {
    user?: AuthApiUser;
    permissionsByType?: PermissionsByType;
    permission?: { isPlatformAdmin?: boolean };
    isPlatformAdmin?: boolean;
  };
  const user = payload.user ?? me.user ?? null;
  const permissionsByType = payload.permissionsByType ?? me.permissionsByType ?? {};
  const isPlatformAdmin = Boolean(
    payload.isPlatformAdmin ?? payload.permission?.isPlatformAdmin,
  );
  return { user, permissionsByType, isPlatformAdmin };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<AuthApiUser | null>(null);
  const [permissionsByType, setPermissionsByType] = useState<PermissionsByType>({});
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
        const fieldErrors: NonNullable<Extract<LoginResult, { success: false }>['fieldErrors']> =
          {};
        if (fields.email) fieldErrors.email = fields.email;
        if (fields.password) fieldErrors.password = fields.password;
        if (fields.licenseKey) fieldErrors.licenseKey = fields.licenseKey;
        return {
          success: false,
          error,
          fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
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

  const hasPage = useCallback(
    (code: string) => {
      if (isPlatformAdmin) return true;
      const pages = permissionsByType.PAGE ?? permissionsByType.page ?? [];
      if (pages.length === 0) return true;
      return pages.includes(code);
    },
    [isPlatformAdmin, permissionsByType],
  );

  const hasOperational = useCallback(
    (code: string) => {
      if (isPlatformAdmin) return true;
      const ops = permissionsByType.OPERATIONAL ?? permissionsByType.operational ?? [];
      if (ops.length === 0) return true;
      return ops.includes(code);
    },
    [isPlatformAdmin, permissionsByType],
  );

  const pagePermissions = permissionsByType.PAGE ?? permissionsByType.page ?? [];
  const operationalPermissions =
    permissionsByType.OPERATIONAL ?? permissionsByType.operational ?? [];
  const rbacEnabled = pagePermissions.length > 0 || operationalPermissions.length > 0;
  const permissionsSyncing = Boolean(getAccessToken()) && meQuery.isFetching && !user;

  const isLoading = !hydrated || (Boolean(getAccessToken()) && meQuery.isLoading && !user);

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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
