import type { User, LoginCredentials } from "./types";

const MOCK_USERS: User[] = [
  {
    id: "usr-demo-001",
    email: "demo@gmail.com",
    displayName: "Demo User",
    role: "user",
  },
];

type MockCredentialConfig = {
  password: string;
  licenseKey?: string;
};

const MOCK_CREDENTIALS: Record<string, MockCredentialConfig> = {
  "demo@gmail.com": { password: "Demo123" },
};

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateCredentials(credentials: LoginCredentials): User | null {
  const email = normalizeEmail(credentials.email);
  const stored = MOCK_CREDENTIALS[email];

  if (!stored) {
    return null;
  }

  if (stored.password !== credentials.password) {
    return null;
  }

  if (stored.licenseKey && credentials.licenseKey?.trim() !== stored.licenseKey) {
    return null;
  }

  return MOCK_USERS.find((u) => normalizeEmail(u.email) === email) ?? null;
}

type FieldErrorMap = {
  email?: string;
  password?: string;
  licenseKey?: string;
};

export function validateCredentialsDetailed(
  credentials: LoginCredentials,
): { user: User | null; fieldErrors: FieldErrorMap } {
  const email = normalizeEmail(credentials.email);
  const stored = MOCK_CREDENTIALS[email];

  const fieldErrors: FieldErrorMap = {};

  if (!credentials.email.trim()) {
    fieldErrors.email = "Email is required.";
  }

  if (!credentials.password) {
    fieldErrors.password = "Password is required.";
  }

  if (!stored) {
    // Email does not exist in our mock store.
    fieldErrors.email = "Email not found.";
    return { user: null, fieldErrors };
  }

  if (stored.password !== credentials.password) {
    fieldErrors.password = "Incorrect password.";
  }

  if (stored.licenseKey && credentials.licenseKey?.trim() !== stored.licenseKey) {
    fieldErrors.licenseKey = "Invalid license key.";
  }

  if (fieldErrors.email || fieldErrors.password || fieldErrors.licenseKey) {
    return { user: null, fieldErrors };
  }

  const user =
    MOCK_USERS.find((u) => normalizeEmail(u.email) === email) ?? null;

  return { user, fieldErrors: {} };
}

export function createSession(user: User): { user: User; expiresAt: number } {
  return {
    user,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
}

export function isSessionValid(expiresAt: number): boolean {
  return Date.now() < expiresAt;
}

export const MOCK_LOGIN_HINT = {
  email: "demo@gmail.com",
  password: "Demo123",
  licenseKey: "Optional for demo user",
};
