/**
 * RN bridge — web code imported `AuthContext`; mobile uses `AuthProvider`.
 */
export { AuthProvider, useAuth } from './AuthProvider';
export type { PermissionsByType } from './AuthProvider';

/** Web `AuthGateState` — simplified for mobile. */
export type AuthGateState = 'loading' | 'authenticated' | 'anonymous';
