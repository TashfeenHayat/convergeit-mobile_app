export { AuthProvider, useAuth } from './AuthProvider';
export type { PermissionsByType } from './AuthProvider';
export type { AuthGateState } from './AuthContext';

export {
  setPasswordResetEmail,
  getPasswordResetEmail,
  clearPasswordResetEmail,
} from './password-reset-session';

export {
  AUTH_PATHS,
  APP_PATHS,
  isEmbedAppPath,
  shouldSkipRemoteAuthHydration,
} from './auth-paths';
export type { AuthPathValue } from './auth-paths';

export {
  getAuthEmailRules,
  getAuthOtpRules,
  getAuthPasswordRules,
  validateAuthEmail,
  validateAuthPassword,
  validateAuthOtp,
  AUTH_EMAIL_REGEX,
  AUTH_EMAIL_MESSAGES,
  AUTH_OTP_MESSAGES,
  AUTH_PASSWORD_MESSAGES,
} from './auth-form-validation';
export type { AuthFieldRule } from './auth-form-validation';

export { isForgotPasswordOtpApiEnabled } from './feature-flags';

export {
  extractIsPlatformAdmin,
  extractPermissionsByType,
  hasOperationalPermission,
  hasPagePermission,
  isRbacActive,
  mergePermissionsByType,
  PAGE_ACCESS_ALL,
  PAGE_PERMISSION_DASHBOARD,
  PERMISSION_BUCKET_OPERATIONAL,
  PERMISSION_BUCKET_PAGE,
  toPermissionSet,
} from './permissions-model';

export {
  getAccessibleDashboardHref,
  getDashboardPathPageRequirements,
  getRequiredPagePermission,
} from './route-page-permissions';

export { parseSafeDashboardNextPath } from './safe-next-path';

export {
  resolveSessionResellerId,
  resolveSessionParentCompanyId,
  sessionCanFilterByResellerId,
  sessionIsNarrowClientRootScope,
  sessionMayPickInternalUserScope,
  resolveSessionListFilterScope,
  sessionMayAssignWideResellerScope,
  sessionShowPocDeptDesignationPickFromList,
} from './session-scope';
export type { SessionListFilterScope, SessionScopeUser } from './session-scope';

export { extractResellerIdFromMePayload } from './extract-reseller-id';
export { useResellerListScope } from './use-reseller-list-scope';
export { sessionExpiredLoginHref } from './session-expired-login';
export { useAccessToken } from './use-access-token';
