import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthNavigationLink, AuthShell, InlineAlert } from '@/components/auth';
import {
  Button,
  Checkbox,
  // Divider,
  InputField,
  // SocialAuthButton,
  TextLink,
  // Typography,
} from '@/components/ui';
import { AUTH_PATHS, getAuthCardCopy } from '@/constants/auth';
import { APP_PATHS } from '@/constants/navigation';
import { useAuth } from '@/lib/auth';
// import { useAppTheme } from '@/theme';

const copy = getAuthCardCopy('login');

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Feature screen — route file only re-exports this. Matches web login (no social auth). */
export function LoginScreen() {
  // const theme = useAppTheme();
  const { login } = useAuth();
  const params = useLocalSearchParams<{ reset?: string }>();
  const [email, setEmail] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    licenseKey?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const passwordResetNotice = params.reset === 'success';

  const clearAuthErrors = () => {
    setFormError(null);
    setErrors({});
  };

  const onEmailChange = (value: string) => {
    setEmail(value);
    if (__DEV__) console.log('[AUTH][INPUT] email =', value);
    if (formError || errors.email || errors.password || errors.licenseKey) {
      clearAuthErrors();
    }
  };

  const onLicenseKeyChange = (value: string) => {
    setLicenseKey(value);
    if (__DEV__) console.log('[AUTH][INPUT] licenseKey =', value);
    if (formError || errors.email || errors.password || errors.licenseKey) {
      clearAuthErrors();
    }
  };

  const onPasswordChange = (value: string) => {
    setPassword(value);
    if (__DEV__) console.log('[AUTH][INPUT] password =', value);
    if (formError || errors.email || errors.password || errors.licenseKey) {
      clearAuthErrors();
    }
  };

  const onSubmit = async () => {
    const next: typeof errors = {};
    if (!isValidEmail(email)) next.email = 'Enter a valid email';
    if (!licenseKey.trim()) next.licenseKey = 'License key is required';
    if (password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) {
      if (__DEV__) {
        console.log('[AUTH][LOGIN] blocked by client validation:', next);
      }
      return;
    }

    setSubmitting(true);
    try {
      if (__DEV__) {
        console.log('[AUTH][LOGIN] Sign in pressed with inputs:', {
          email: email.trim(),
          password,
          licenseKey: licenseKey.trim(),
        });
      }
      const result = await login({
        email: email.trim(),
        password,
        licenseKey: licenseKey.trim(),
      });
      if (!result.success) {
        if (__DEV__) {
          console.log('[AUTH][LOGIN] failed:', {
            error: result.error,
            fieldErrors: result.fieldErrors,
          });
        }
        const fieldErrors = {
          email: result.fieldErrors?.email,
          password: result.fieldErrors?.password,
          licenseKey: result.fieldErrors?.licenseKey,
        };
        const hasFieldError = Boolean(
          fieldErrors.email || fieldErrors.password || fieldErrors.licenseKey,
        );
        setErrors(hasFieldError ? fieldErrors : {});
        if (!hasFieldError) {
          setFormError(result.error ?? 'Sign in failed');
        } else if (result.error && !fieldErrors.email) {
          // Show API message when field map is partial
          setFormError(result.error);
        }
        return;
      }
      if (__DEV__) {
        console.log('[AUTH][LOGIN] OK → navigating home');
      }
      void rememberMe;
      router.replace(APP_PATHS.home);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell heading={copy.heading} subheading={copy.subheading}>
      {passwordResetNotice ? (
        <InlineAlert severity="success">
          Password updated. Sign in with your new password and license key.
        </InlineAlert>
      ) : null}
      {formError ? <InlineAlert severity="error">{formError}</InlineAlert> : null}

      <InputField
        label="Email"
        placeholder="Enter your email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        value={email}
        onChangeText={onEmailChange}
        error={Boolean(errors.email)}
        helperText={errors.email}
      />
      <InputField
        label="License Key"
        placeholder="Enter your license key"
        autoCapitalize="characters"
        value={licenseKey}
        onChangeText={onLicenseKeyChange}
        error={Boolean(errors.licenseKey)}
        helperText={errors.licenseKey}
      />
      <InputField
        label="Password"
        placeholder="Enter your password"
        secureTextEntry
        textContentType="password"
        value={password}
        onChangeText={onPasswordChange}
        error={Boolean(errors.password)}
        helperText={errors.password}
      />

      <View style={styles.rememberRow}>
        <Checkbox checked={rememberMe} onChange={setRememberMe} label="Remember me" />
        <Link href={AUTH_PATHS.forgotPassword} asChild>
          <TextLink>Forgot password?</TextLink>
        </Link>
      </View>

      <Button fullWidth loading={submitting} onPress={onSubmit}>
        Sign in
      </Button>

      {/* Social / "or" block — not on web login; keep commented for parity
      <View style={[styles.orRow, { gap: theme.spacing.sm }]}>
        <Divider style={styles.orLine} />
        <Typography variant="small" muted>
          or
        </Typography>
        <Divider style={styles.orLine} />
      </View>

      <View style={[styles.socialRow, { gap: theme.spacing.sm }]}>
        <SocialAuthButton provider="google" onPress={() => undefined} />
        <SocialAuthButton provider="github" onPress={() => undefined} />
        <SocialAuthButton provider="facebook" onPress={() => undefined} />
      </View>
      */}

      <AuthNavigationLink
        href={AUTH_PATHS.forgotPassword}
        prompt="Need help?"
        actionLabel="Reset password"
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  // orRow: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  // },
  // orLine: { flex: 1 },
  // socialRow: { flexDirection: 'row' },
});
