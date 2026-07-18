import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'conver.auth.passwordReset.email';
let memoryEmail: string | null = null;

export async function setPasswordResetEmail(email: string): Promise<void> {
  memoryEmail = email.trim().toLowerCase();
  if (Platform.OS === 'web') {
    try {
      globalThis.sessionStorage?.setItem(KEY, memoryEmail);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.setItemAsync(KEY, memoryEmail);
}

export async function getPasswordResetEmail(): Promise<string | null> {
  if (memoryEmail) return memoryEmail;
  if (Platform.OS === 'web') {
    try {
      return globalThis.sessionStorage?.getItem(KEY) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(KEY);
}

export async function clearPasswordResetEmail(): Promise<void> {
  memoryEmail = null;
  if (Platform.OS === 'web') {
    try {
      globalThis.sessionStorage?.removeItem(KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.deleteItemAsync(KEY);
}
