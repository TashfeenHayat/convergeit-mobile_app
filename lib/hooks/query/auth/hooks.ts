import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  confirmPasswordReset,
  getMe,
  login,
  logoutRemote,
  requestPasswordReset,
  verifyPasswordResetOtp,
  type LoginRequestBody,
  type PasswordResetConfirmBody,
  type PasswordResetRequestBody,
  type PasswordResetVerifyBody,
} from '@/api';
import { getAccessToken } from '@/api/storage/token-storage';
import { authKeys } from './keys';

export function useMeQuery(options?: {
  permissionsBreakdown?: boolean;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: authKeys.me(options?.permissionsBreakdown),
    queryFn: () =>
      getMe({
        permissionsBreakdown: options?.permissionsBreakdown,
      }),
    enabled: (options?.enabled ?? true) && Boolean(getAccessToken()),
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginRequestBody) => login(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    meta: { skipSuccessToast: true },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => logoutRemote(),
    meta: { skipSuccessToast: true },
    onSettled: () => {
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
  });
}

export function useRequestPasswordResetMutation() {
  return useMutation({
    mutationFn: (body: PasswordResetRequestBody) => requestPasswordReset(body),
    meta: { skipSuccessToast: true },
  });
}

export function useVerifyPasswordResetOtpMutation() {
  return useMutation({
    mutationFn: (body: PasswordResetVerifyBody) => verifyPasswordResetOtp(body),
    meta: { skipSuccessToast: true },
  });
}

export function useConfirmPasswordResetMutation() {
  return useMutation({
    mutationFn: (body: PasswordResetConfirmBody) => confirmPasswordReset(body),
    meta: { skipSuccessToast: true },
  });
}
