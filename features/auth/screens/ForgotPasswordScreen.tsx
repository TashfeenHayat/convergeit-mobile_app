import { router } from 'expo-router';
import { useState } from 'react';

import { AuthNavigationLink, AuthShell, InlineAlert } from '@/components/auth';
import { Button, InputField } from '@/components/ui';
import { AUTH_PATHS, getAuthCardCopy } from '@/constants/auth';
import { extractApiErrorMessage, extractNestFieldErrors } from '@/lib/api/errors';
import { setPasswordResetEmail } from '@/lib/auth';
import { useRequestPasswordResetMutation } from '@/lib/hooks';

const copy = getAuthCardCopy('forgot-password');

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function ForgotPasswordScreen() {
  const mutation = useRequestPasswordResetMutation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!isValidEmail(email)) {
      setError('Enter a valid email');
      return;
    }
    setError(undefined);
    setFormError(null);
    try {
      const normalized = email.trim().toLowerCase();
      await mutation.mutateAsync({ email: normalized });
      await setPasswordResetEmail(normalized);
      router.push({ pathname: '/verify-code', params: { email: normalized } });
    } catch (err) {
      const fields = extractNestFieldErrors(err);
      if (fields.email) {
        setError(fields.email);
        return;
      }
      setFormError(extractApiErrorMessage(err, 'Could not send reset code. Try again.'));
    }
  };

  return (
    <AuthShell heading={copy.heading} subheading={copy.subheading}>
      {formError ? <InlineAlert severity="error">{formError}</InlineAlert> : null}
      <InputField
        label="Email"
        placeholder="Enter your email"
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
        error={Boolean(error)}
        helperText={error}
      />
      <Button fullWidth loading={mutation.isPending} onPress={onSubmit}>
        Send OTP
      </Button>
      <AuthNavigationLink
        href={AUTH_PATHS.login}
        prompt="Remembered it?"
        actionLabel="Back to sign in"
      />
    </AuthShell>
  );
}
