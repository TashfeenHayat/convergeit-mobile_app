export type AuthCardCopy = {
  heading?: string;
  subheading?: string;
};

export function getAuthCardCopy(
  route: 'login' | 'forgot-password' | 'verify-code' | 'set-password',
): AuthCardCopy {
  switch (route) {
    case 'forgot-password':
      return {
        heading: 'Forgot Password',
        subheading:
          "Don't worry — it happens to all of us. Enter your email below to recover your password.",
      };
    case 'set-password':
      return {
        heading: 'Set a Password',
        subheading:
          'Your previous password has been reset. Please set a new password for your account.',
      };
    case 'verify-code':
      return {
        heading: 'Verify Code',
        subheading: 'An authentication code has been sent to your email.',
      };
    default:
      return {
        heading: 'Sign in',
        subheading: 'Welcome back to ConvergeIT.',
      };
  }
}

export { AUTH_PATHS, APP_PATHS } from './navigation';
