import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthNavigationLink, AuthShell, InlineAlert } from '@/components/auth';
import { Button, InputField, TextLink, Typography } from '@/components/ui';
import { AUTH_PATHS, getAuthCardCopy } from '@/constants/auth';
import { extractApiErrorMessage, extractNestFieldErrors } from '@/lib/api/errors';
import { getPasswordResetEmail, setPasswordResetEmail } from '@/lib/auth';
import {
  useRequestPasswordResetMutation,
  useVerifyPasswordResetOtpMutation,
} from '@/lib/hooks';

const copy = getAuthCardCopy('verify-code');

export function VerifyCodeScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const paramEmail = useMemo(
    () => (typeof params.email === 'string' ? params.email.trim().toLowerCase() : ''),
    [params.email],
  );
  const verifyMutation = useVerifyPasswordResetOtpMutation();
  const resendMutation = useRequestPasswordResetMutation();
  const [email, setEmail] = useState(paramEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (paramEmail) {
        setEmail(paramEmail);
        await setPasswordResetEmail(paramEmail);
        return;
      }
      const stored = await getPasswordResetEmail();
      if (!cancelled && stored) setEmail(stored);
    })();
    return () => {
      cancelled = true;
    };
  }, [paramEmail]);

  const onSubmit = async () => {
    if (!email) {
      router.replace(AUTH_PATHS.forgotPassword);
      return;
    }
    if (code.trim().length < 4) {
      setError('Enter the code from your email');
      return;
    }
    setError(undefined);
    setFormError(null);
    try {
      await verifyMutation.mutateAsync({ email, code: code.trim() });
      router.push({
        pathname: '/set-password',
        params: { email, code: code.trim() },
      });
    } catch (err) {
      const fields = extractNestFieldErrors(err);
      if (fields.code) {
        setError(fields.code);
        return;
      }
      setFormError(extractApiErrorMessage(err, 'Invalid or expired code.'));
    }
  };

  const onResend = async () => {
    if (!email) return;
    setFormError(null);
    try {
      await resendMutation.mutateAsync({ email });
    } catch (err) {
      setFormError(extractApiErrorMessage(err, 'Could not resend code.'));
    }
  };

  return (
    <AuthShell heading={copy.heading} subheading={copy.subheading}>
      {email ? (
        <Typography variant="small" muted style={styles.emailHint}>
          Sent to {email}
        </Typography>
      ) : (
        <InlineAlert severity="warning">Missing email — start from forgot password.</InlineAlert>
      )}
      {formError ? <InlineAlert severity="error">{formError}</InlineAlert> : null}
      <InputField
        label="Authentication code"
        placeholder="Enter code"
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        value={code}
        onChangeText={setCode}
        error={Boolean(error)}
        helperText={error}
      />
      <Button
        fullWidth
        loading={verifyMutation.isPending}
        onPress={onSubmit}
        disabled={!email}
      >
        Verify
      </Button>
      <View style={styles.resend}>
        <Typography variant="medium" muted>
          Didn't get a code?{' '}
        </Typography>
        <TextLink onPress={onResend} disabled={resendMutation.isPending}>
          {resendMutation.isPending ? 'Sending…' : 'Resend'}
        </TextLink>
      </View>
      <AuthNavigationLink href={AUTH_PATHS.login} prompt="" actionLabel="Back to sign in" />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  emailHint: { textAlign: 'center', marginBottom: -8 },
  resend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
