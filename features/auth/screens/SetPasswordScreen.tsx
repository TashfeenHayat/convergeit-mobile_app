import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { AuthNavigationLink, AuthShell, InlineAlert } from '@/components/auth';
import { Button, InputField } from '@/components/ui';
import { AUTH_PATHS, getAuthCardCopy } from '@/constants/auth';
import { extractApiErrorMessage, extractNestFieldErrors } from '@/lib/api/errors';
import { clearPasswordResetEmail, getPasswordResetEmail } from '@/lib/auth';
import { useConfirmPasswordResetMutation } from '@/lib/hooks';

const copy = getAuthCardCopy('set-password');

export function SetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string; code?: string }>();
  const paramEmail = useMemo(
    () => (typeof params.email === 'string' ? params.email.trim().toLowerCase() : ''),
    [params.email],
  );
  const code = useMemo(
    () => (typeof params.code === 'string' ? params.code.trim() : ''),
    [params.code],
  );
  const mutation = useConfirmPasswordResetMutation();
  const [email, setEmail] = useState(paramEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (paramEmail) {
        setEmail(paramEmail);
        return;
      }
      const stored = await getPasswordResetEmail();
      if (!cancelled && stored) setEmail(stored);
    })();
    return () => {
      cancelled = true;
    };
  }, [paramEmail]);

  useEffect(() => {
    if (!code) router.replace(AUTH_PATHS.forgotPassword);
  }, [code]);

  const onSubmit = async () => {
    if (!email || !code) {
      router.replace(AUTH_PATHS.forgotPassword);
      return;
    }
    const next: typeof errors = {};
    if (password.length < 8) next.password = 'Password must be at least 8 characters';
    if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) return;

    try {
      await mutation.mutateAsync({ email, code, password });
      await clearPasswordResetEmail();
      router.replace({ pathname: '/login', params: { reset: 'success' } });
    } catch (err) {
      const fields = extractNestFieldErrors(err);
      if (fields.password) {
        setErrors({ password: fields.password });
        return;
      }
      setFormError(extractApiErrorMessage(err, 'Could not update password. Try again.'));
    }
  };

  return (
    <AuthShell heading={copy.heading} subheading={copy.subheading}>
      {formError ? <InlineAlert severity="error">{formError}</InlineAlert> : null}
      <InputField
        label="New password"
        placeholder="Enter new password"
        secureTextEntry
        textContentType="newPassword"
        value={password}
        onChangeText={setPassword}
        error={Boolean(errors.password)}
        helperText={errors.password}
      />
      <InputField
        label="Confirm password"
        placeholder="Confirm new password"
        secureTextEntry
        textContentType="newPassword"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        error={Boolean(errors.confirmPassword)}
        helperText={errors.confirmPassword}
      />
      <Button
        fullWidth
        loading={mutation.isPending}
        onPress={onSubmit}
        disabled={!email || !code}
      >
        Set password
      </Button>
      <AuthNavigationLink href={AUTH_PATHS.login} prompt="" actionLabel="Back to sign in" />
    </AuthShell>
  );
}
